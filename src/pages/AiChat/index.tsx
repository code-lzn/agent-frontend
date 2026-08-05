import { resetConversation1 } from '@/api/movieAgentController';
import { history, useModel } from '@umijs/max';
import { Input } from 'antd';
import { ArrowUpOutlined, ReloadOutlined } from '@ant-design/icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import './index.css';

// ====== 类型 ======
interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  timestamp: number;
  cards?: any[];
}

interface TicketFlow {
  step: number; // 0=选片 1=选影院 2=选场次 3=选座 4=确认 5=支付
  film?: any;
  schedule?: any;
  seats?: any[];
  order?: any;
}

const STEPS = ['选择影片', '选择影院', '选择场次', '选择座位', '确认订单', '支付出票'];

const QUICK_TAGS = [
  { label: '🔥 热映推荐', text: '推荐几部好看的电影' },
  { label: '🎭 想看喜剧', text: '我想看喜剧片' },
  { label: '💰 便宜场次', text: '帮我找票价最便宜的电影' },
  { label: '🎬 IMAX体验', text: '帮我在IMAX厅找场次' },
];

// ====== SSE 解析 ======
function parseSSELine(raw: string): { text?: string; card?: any } | null {
  const data = raw.startsWith('data:') ? raw.slice(5).trim() : raw.trim();
  if (!data || data === '[DONE]') return null;
  try {
    const json = JSON.parse(data);
    // 卡片事件
    if (json.type === 'card' || json.cardType) return { card: json };
    // 工具执行事件 → 状态提示
    if (json.type === 'tool_start') return { text: json.d || `正在${json.toolName}...` };
    if (json.type === 'tool_end') return { text: '' }; // 工具结束，不显示
    if (json.type === 'error') return { text: `❌ ${json.d || json.message || '出错了'}` };
    // 普通文本
    if (json.d) return { text: json.d };
    if (json.content) return { text: json.content };
    if (json.result) return { text: typeof json.result === 'string' ? json.result : JSON.stringify(json.result) };
  } catch {
    if (raw.length > 2 && !raw.startsWith(':')) return { text: raw };
  }
  return null;
}

// ====== 卡片组件 ======
const FilmCards: React.FC<{ items: any[]; onSelect: (name: string) => void }> = ({ items, onSelect }) => (
  <div className="card-group">
    {items.map((m: any, i: number) => {
      const name = m?.name || m?.title || '';
      const poster = m?.posterUrl || m?.poster || '';
      const rating = m?.rating != null ? Number(m.rating) : null;
      const type = m?.type || m?.genre || '';
      const filmId = m?.filmId || m?.id;
      return (
        <div key={filmId || i} className="ai-film-card">
          <div className="ai-film-poster">{poster ? <img src={poster} alt={name} /> : '🎬'}</div>
          <div className="ai-film-info">
            <div className="ai-film-name">{name}</div>
            {rating != null && <div className="ai-film-rating">★ {rating.toFixed(1)}</div>}
            {type && <div className="ai-film-type">{type}</div>}
            <div className="ai-film-actions">
              <button className="btn-ghost" onClick={() => filmId != null && history.push(`/film/${filmId}`)}>详情</button>
              <button className="btn-solid" onClick={() => onSelect(name)}>选这部</button>
            </div>
          </div>
        </div>
      );
    })}
  </div>
);

const ScheduleCards: React.FC<{ items: any[]; onSelect: (s: any) => void }> = ({ items, onSelect }) => {
  const groups: Record<string, { name: string; addr: string; items: any[] }> = {};
  items.forEach((s: any) => {
    const cid = s.cinemaId || '0';
    if (!groups[cid]) groups[cid] = { name: s.cinemaName || '', addr: s.cinemaAddress || '', items: [] };
    groups[cid].items.push(s);
  });
  return (
    <div className="ai-session-list">
      {Object.entries(groups).map(([cid, g]) => (
        <div key={cid} className="ai-session-group">
          <div className="ai-session-cinema">
            <span className="ai-cinema-name">{g.name}</span>
            {g.addr && <span className="ai-cinema-addr">{g.addr}</span>}
          </div>
          <div className="ai-session-times">
            {g.items.map((s: any, i: number) => (
              <div key={s.id || i} className="ai-session-item" onClick={() => onSelect(s)}>
                <div className="ai-time">{String(s.startTime || '').substring(0, 5)}</div>
                <div className="ai-hall">{s.hallName} {s.hallType || ''}</div>
                <div className="ai-price">¥{s.price}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const OrderCard: React.FC<{ data: any; onPay: () => void }> = ({ data, onPay }) => (
  <div className="ai-order-card">
    <div className="ai-order-row"><span>影片</span><b>{data.filmName}</b></div>
    <div className="ai-order-row"><span>影院</span><b>{data.cinemaName}</b></div>
    <div className="ai-order-row"><span>场次</span><b>{data.showDate} {String(data.startTime || '').substring(0, 5)}</b></div>
    <div className="ai-order-row"><span>影厅</span><b>{data.hallName}</b></div>
    <div className="ai-order-row"><span>座位</span><b>{Array.isArray(data.seatLabels) ? data.seatLabels.join('、') : data.seatLabels || '-'}</b></div>
    <div className="ai-order-total">合计 <span>¥{Number(data.totalPrice || 0).toFixed(2)}</span></div>
    <div className="ai-order-actions">
      {data.orderId ? (
        <button className="btn-solid" onClick={() => history.push(`/order/${data.orderId}`)}>查看订单并支付</button>
      ) : (
        <button className="btn-solid" onClick={onPay}>确认下单</button>
      )}
    </div>
  </div>
);

// ====== 主组件 ======
const AiChatPage: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;

  // 持久化 conversationId（sessionStorage，刷新不丢失）
  const [conversationId] = useState(() => {
    const key = `ai_conv_${currentUser?.id || 'guest'}`;
    const saved = sessionStorage.getItem(key);
    if (saved) return saved;
    const id = String(Date.now());
    sessionStorage.setItem(key, id);
    return id;
  });

  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'ai', content: '你好！我是 AI 观影助手 🎬\n告诉我你的需求，比如"想看周末的喜剧片"或"帮我选IMAX哪吒"，我帮你一站式搞定选座购票～', timestamp: Date.now(), cards: [] },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [flow, setFlow] = useState<TicketFlow>({ step: 0 });
  const msgsRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    msgsRef.current?.scrollTo({ top: msgsRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // 根据卡片类型更新购票进度
  const updateFlow = (cards: any[]) => {
    if (!cards.length) return;
    const last = cards[cards.length - 1];
    const ct = last?.cardType || last?.type;
    const data = last?.data || last;
    setFlow((prev) => {
      const next = { ...prev };
      if (ct === 'movie_list' || ct === 'film_list') {
        next.step = Math.max(prev.step, 1);
      } else if (ct === 'session_list' || ct === 'schedule_list') {
        next.step = Math.max(prev.step, 3);
        if (data?.schedules?.[0] || data?.[0]) next.schedule = data;
      } else if (ct === 'seat_map') {
        next.step = Math.max(prev.step, 4);
      } else if (ct === 'order_confirm' || ct === 'order') {
        next.step = Math.max(prev.step, 5);
        next.order = data;
      }
      return next;
    });
  };

  // 发送消息（统一用流式 smart-stream）
  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    // 重置对话
    if (trimmed === '__reset__') {
      try { await resetConversation1({ conversationId }); } catch {}
      setMessages([messages[0]]);
      setFlow({ step: 0 });
      return;
    }

    const userMsg: ChatMessage = { role: 'user', content: trimmed, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setSending(true);

    const controller = new AbortController();
    abortRef.current = controller;

    const baseUrl = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:8123/api';
    const params = new URLSearchParams({ message: trimmed, conversationId });
    if (currentUser?.id) params.set('userId', String(currentUser.id));

    let aiText = '';
    const cards: any[] = [];

    try {
      const res = await fetch(`${baseUrl}/movie-agent/chat-stream?${params}`, {
        signal: controller.signal,
        credentials: 'include',
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body?.getReader();
      if (!reader) throw new Error('无法读取响应流');

      const decoder = new TextDecoder();
      let buf = '';

      // 先添加空的 AI 消息占位
      setMessages((prev) => [...prev, { role: 'ai', content: '', timestamp: Date.now(), cards: [] }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() || '';

        for (const line of lines) {
          const parsed = parseSSELine(line);
          if (!parsed) continue;

          if (parsed.card) {
            cards.push(parsed.card);
          }
          if (parsed.text) {
            aiText += parsed.text;
            // 流式更新最后一条消息
            setMessages((prev) => {
              const rest = prev.slice(0, -1);
              return [...rest, { role: 'ai', content: aiText, timestamp: Date.now(), cards: [...cards] }];
            });
          }
        }
      }

      // 流结束：更新卡片和进度
      updateFlow(cards);
      setMessages((prev) => {
        const rest = prev.slice(0, -1);
        return [...rest, { role: 'ai', content: aiText || '（收到回复）', timestamp: Date.now(), cards: [...cards] }];
      });
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setMessages((prev) => [...prev, { role: 'ai', content: '😵 连接中断，请重试', timestamp: Date.now(), cards: [] }]);
      }
    } finally {
      setSending(false);
      abortRef.current = null;
    }
  }, [sending, conversationId, currentUser?.id, messages]);

  // 渲染卡片
  const renderCards = (cards: any[]) => {
    if (!cards?.length) return null;
    return cards.map((card, i) => {
      const ct = card?.cardType || card?.type;
      const data = card?.data || card;

      if (ct === 'movie_list' || ct === 'film_list') {
        const list = data?.list || data?.records || data?.films || (Array.isArray(data) ? data : []);
        const items = Array.isArray(list) ? list : [];
        return items.length > 0 ? <FilmCards key={i} items={items} onSelect={(name) => sendMessage(`我要看《${name}》`)} /> : null;
      }

      if (ct === 'session_list' || ct === 'schedule_list') {
        const list = data?.schedules || data?.list || data?.records || (Array.isArray(data) ? data : []);
        const items = Array.isArray(list) ? list : [];
        return items.length > 0 ? (
          <ScheduleCards key={i} items={items} onSelect={(s) => sendMessage(`选这个场次：${s.cinemaName} ${s.hallName} ${s.startTime}，场次ID=${s.id || s.scheduleId}`)} />
        ) : null;
      }

      if (ct === 'order_confirm' || ct === 'order') {
        return <OrderCard key={i} data={data} onPay={() => sendMessage('确认下单，帮我创建订单')} />;
      }

      return null;
    });
  };

  return (
    <div className="ai-chat-wrap">
      {/* 对话区 */}
      <div className="chat-main">
        <div className="ch-header">
          <div className="ch-avatar">🤖</div>
          <div style={{ flex: 1 }}>
            <div className="ch-title">AI 观影助手<span className="ch-status"><span className="status-dot" />在线</span></div>
            <div className="ch-sub">说一句话，帮你选座购票</div>
          </div>
          <button className="reset-btn" title="新对话" onClick={() => sendMessage('__reset__')}><ReloadOutlined /></button>
        </div>

        <div className="chat-msgs" ref={msgsRef}>
          {messages.map((msg, idx) => (
            <div key={idx} className={`msg ${msg.role}`}>
              {msg.role === 'ai' && <div className="av">🤖</div>}
              <div>
                <div className="balloon">
                  {msg.content.split('\n').map((line, i) => (
                    <React.Fragment key={i}>{line}{i < msg.content.split('\n').length - 1 && <br />}</React.Fragment>
                  ))}
                  {msg.role === 'ai' && idx === 0 && (
                    <div className="quick-tags">
                      {QUICK_TAGS.map((tag) => (
                        <span key={tag.label} className="qt" onClick={() => sendMessage(tag.text)}>{tag.label}</span>
                      ))}
                    </div>
                  )}
                </div>
                {msg.cards && renderCards(msg.cards)}
              </div>
            </div>
          ))}
        </div>

        <div className="chat-input">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(inputValue); } }}
            placeholder={sending ? 'AI 正在思考...' : '说说你想看什么电影吧～'}
            disabled={sending}
            size="large"
          />
          {sending && <button className="stop-btn" onClick={() => abortRef.current?.abort()}>停止</button>}
          <button className="send-btn" onClick={() => sendMessage(inputValue)} disabled={sending || !inputValue.trim()}>
            <ArrowUpOutlined />
          </button>
        </div>
      </div>

      {/* 右侧栏 */}
      <div className="chat-sidebar">
        <div className="cs-card">
          <div className="cs-title">📊 购票进度</div>
          {STEPS.map((label, idx) => (
            <div key={idx} className={`step ${idx < flow.step ? 'done' : idx === flow.step ? 'active' : ''}`}>
              <span className="s-num">{idx < flow.step ? '✓' : idx + 1}</span>
              <span className="s-label">{label}</span>
            </div>
          ))}
        </div>
        <div className="cs-card cs-tip">
          <div className="cs-tip-title">💡 试试这样说</div>
          <div className="cs-tip-text">
            {QUICK_TAGS.map((tag) => (
              <button key={tag.label} className="chip" onClick={() => sendMessage(tag.text)}>{tag.label}</button>
            ))}
          </div>
        </div>
        {flow.order && (
          <div className="cs-card">
            <div className="cs-title">🧾 当前订单</div>
            <div style={{ fontSize: 12, color: '#666' }}>
              {flow.order.filmName && <div>🎬 {flow.order.filmName}</div>}
              {flow.order.totalPrice != null && <div style={{ color: '#FF4D4F', fontWeight: 700, fontSize: 16, marginTop: 4 }}>¥{Number(flow.order.totalPrice).toFixed(2)}</div>}
              {flow.order.orderId && (
                <button className="btn-solid" style={{ marginTop: 8, width: '100%', height: 32, borderRadius: 6, border: 'none', cursor: 'pointer', color: '#fff', background: '#FF4D4F' }}
                  onClick={() => history.push(`/order/${flow.order.orderId}`)}>
                  去支付
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AiChatPage;
