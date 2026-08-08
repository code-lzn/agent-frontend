import { resetConversation1 } from '@/api/movieAgentController';
import { getCurrentSession, listByUser as listSessions, create as createSession, remove8 as removeSession } from '@/api/chatSessionController';
import { listBySession } from '@/api/chatHistoryController';
import { listSchedule } from '@/api/scheduleController';
import { getSeatMap } from '@/api/seatController';
import { createOrder, lockSeat, payOrder, mockPay } from '@/api/orderController';
import { search as searchFilms } from '@/api/filmController';
import { history, useModel } from '@umijs/max';
import { Drawer, Empty, Input, message, Modal, Spin } from 'antd';
import { ArrowUpOutlined, MenuOutlined, PlusOutlined, DeleteOutlined, LoadingOutlined } from '@ant-design/icons';
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

interface SessionItem {
  id: string;
  sessionName: string;
  userId: string;
  editTime: string;
  createTime: string;
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
    if (json.type === 'tool_start') return { text: `⏳ ${json.d || json.toolName || '处理中'}...\n` };
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
const FilmCards: React.FC<{ items: any[]; onSelect: (filmId: string, name: string) => void }> = ({ items, onSelect }) => (
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
              <button className="btn-solid" onClick={() => onSelect(String(filmId || ''), name)}>选这部</button>
            </div>
          </div>
        </div>
      );
    })}
  </div>
);

const ScheduleCards: React.FC<{ items: any[]; onSelect: (s: any) => void }> = ({ items, onSelect }) => {
  // 按日期分组，每组内按影院+时间展示
  const dateGroups: Record<string, { label: string; cinemas: Record<string, { name: string; addr: string; items: any[] }> }> = {};

  const formatDateLabel = (dateStr: string) => {
    if (!dateStr) return '未知日期';
    const today = new Date();
    const d = new Date(dateStr);
    const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth()+1).padStart(2,'0')}-${String(tomorrow.getDate()).padStart(2,'0')}`;
    if (dateStr === todayStr) return '今天';
    if (dateStr === tomorrowStr) return '明天';
    return `${d.getMonth()+1}月${d.getDate()}日`;
  };

  items.forEach((s: any) => {
    const date = s.showDate || '';
    if (!dateGroups[date]) dateGroups[date] = { label: formatDateLabel(date), cinemas: {} };
    const cid = String(s.cinemaId || '0');
    if (!dateGroups[date].cinemas[cid]) {
      dateGroups[date].cinemas[cid] = { name: s.cinemaName || '', addr: s.cinemaAddress || '', items: [] };
    }
    dateGroups[date].cinemas[cid].items.push(s);
  });

  return (
    <div className="ai-session-list">
      {Object.entries(dateGroups).map(([date, dg]) => (
        <div key={date} className="ai-session-date-group">
          <div className="ai-session-date-header">📅 {dg.label}</div>
          {Object.entries(dg.cinemas).map(([cid, cg]) => (
            <div key={cid} className="ai-session-group">
              <div className="ai-session-cinema">
                <span className="ai-cinema-name">{cg.name}</span>
                {cg.addr && <span className="ai-cinema-addr">{cg.addr}</span>}
              </div>
              <div className="ai-session-times">
                {cg.items.map((s: any, i: number) => (
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
      ))}
    </div>
  );
};

// ====== 影院列表卡片（点击直接查该影院+当前影片的场次） ======
const CinemaCards: React.FC<{ items: any[]; filmId?: string; onSelectCinema: (cinemaId: string, cinemaName: string, cardFilmId?: string) => void }> = ({ items, filmId, onSelectCinema }) => (
  <div className="card-group">
    {items.map((c: any, i: number) => {
      const name = c?.name || c?.cinemaName || '';
      const addr = c?.address || c?.cinemaAddress || '';
      const tags = c?.tags ? String(c.tags).split(',').filter(Boolean) : [];
      const cid = c?.cinemaId || c?.id;
      return (
        <div key={cid || i} className="ai-film-card" style={{ width: 200 }}>
          <div className="ai-film-poster" style={{ background: 'linear-gradient(135deg,#1a1a3a,#2d2d5e)', fontSize: '2.5rem' }}>🎬</div>
          <div className="ai-film-info">
            <div className="ai-film-name">{name}</div>
            {addr && <div className="ai-film-type">📍 {addr}</div>}
            {tags.length > 0 && <div className="ai-film-type">{tags.slice(0, 3).join(' · ')}</div>}
            {c?.basePrice != null && <div className="ai-film-rating">¥{c.basePrice} 起</div>}
            <div className="ai-film-actions">
              <button className="btn-solid" onClick={() => onSelectCinema(String(cid), name, c?.filmId || filmId)}>选这家 → 看场次</button>
            </div>
          </div>
        </div>
      );
    })}
  </div>
);

// ====== 座位图卡片 ======
const SeatMapCard: React.FC<{ data: any; onSelectSeats: (scheduleId: any, seatIds: any[], seatData: any) => void; locking?: boolean }> = ({ data, onSelectSeats, locking }) => {
  const seats: any[] = data?.seats || [];
  const hallName = data?.hallName || '';
  const scheduleId = data?.scheduleId;
  const price = data?.price ?? 0;
  const [selected, setSelected] = useState<string[]>([]);

  const rows: Record<number, any[]> = {};
  seats.forEach((s: any) => {
    const r = s.rowNum ?? 0;
    if (!rows[r]) rows[r] = [];
    rows[r].push(s);
  });

  const toggleSeat = (seatId: string, status: string) => {
    if (status === 'sold' || status === 'locked') return;
    setSelected((prev) => (prev.includes(seatId) ? prev.filter((id) => id !== seatId) : [...prev, seatId]));
  };

  return (
    <div className="ai-seat-card">
      <div className="ai-seat-header">
        <span>🎯 {hallName}</span>
        <span className="ai-seat-price">¥{price}/座</span>
      </div>
      <div style={{ display: 'flex', gap: 14, marginBottom: 8, fontSize: 11, color: '#999' }}>
        <span><span className="ai-seat-dot free" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 4 }} /> 可选</span>
        <span><span className="ai-seat-dot sold" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 4 }} /> 已售</span>
      </div>
      <div className="ai-seat-grid">
        {Object.entries(rows)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([rowNum, rowSeats]) => (
            <div className="ai-seat-row" key={rowNum}>
              <span className="ai-seat-rn">{rowNum}</span>
              {rowSeats
                .sort((a, b) => (a.colNum ?? 0) - (b.colNum ?? 0))
                .map((seat) => (
                  <div
                    key={seat.id}
                    className={`ai-seat-dot ${seat.status === 'sold' || seat.status === 'locked' ? 'sold' : seat.zone === 'vip' ? 'vip' : 'free'} ${selected.includes(seat.id) ? 'selected' : ''}`}
                    onClick={() => toggleSeat(seat.id, seat.status)}
                    title={seat.seatLabel}
                  />
                ))}
            </div>
          ))}
      </div>
      {selected.length > 0 && (
        <div style={{ marginTop: 12, textAlign: 'right' }}>
          <button
            style={{ height: 36, padding: '0 24px', borderRadius: 8, border: 'none', background: locking ? '#ccc' : '#FF4D4F', color: '#fff', cursor: locking ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'inherit' }}
            onClick={() => onSelectSeats(scheduleId, selected, data)}
            disabled={locking}
          >
            {locking ? '锁定中...' : `确认选座（${selected.length}座 ¥${(selected.length * price).toFixed(2)}）`}
          </button>
        </div>
      )}
    </div>
  );
};

const OrderCard: React.FC<{ data: any; onPay: (orderId: number) => void; paying?: boolean }> = ({ data, onPay, paying }) => {
  const orderId = data?.orderId || data?.id;
  const [countdown, setCountdown] = useState<number>(0);

  // 计算支付倒计时
  useEffect(() => {
    const expireAt = data?.expireAt;
    if (!expireAt) return;
    const calcRemaining = () => {
      try {
        const remaining = Math.max(0, Math.floor((new Date(expireAt).getTime() - Date.now()) / 1000));
        setCountdown(remaining);
        return remaining;
      } catch { return 0; }
    };
    calcRemaining();
    const timer = setInterval(() => {
      const r = calcRemaining();
      if (r <= 0) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [data?.expireAt]);

  const fmtCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="ai-order-card">
      <div className="ai-order-row"><span>影片</span><b>{data.filmName}</b></div>
      <div className="ai-order-row"><span>影院</span><b>{data.cinemaName}</b></div>
      <div className="ai-order-row"><span>场次</span><b>{data.scheduleTime || `${data.showDate || ''} ${String(data.startTime || '').substring(0, 5)}`}</b></div>
      <div className="ai-order-row"><span>影厅</span><b>{data.hallName}</b></div>
      <div className="ai-order-row"><span>座位</span><b>{Array.isArray(data.seatLabels) ? data.seatLabels.join('、') : data.seatLabels || '-'}</b></div>
      <div className="ai-order-row"><span>订单号</span><b style={{fontSize:11,color:'#999'}}>{data.orderNo || '-'}</b></div>
      <div className="ai-order-total">
        合计 <span>¥{Number(data.totalPrice || 0).toFixed(2)}</span>
      </div>
      {countdown > 0 && (
        <div className={`ai-order-countdown ${countdown < 60 ? 'urgent' : ''}`}>
          ⏱ 支付剩余 <b>{fmtCountdown(countdown)}</b>
        </div>
      )}
      <div className="ai-order-actions">
        {orderId ? (
          <>
            <button className="btn-solid" onClick={() => onPay(orderId)} disabled={paying}>
              {paying ? '支付中...' : `💳 立即支付 ¥${Number(data.totalPrice || 0).toFixed(2)}`}
            </button>
            <button className="btn-ghost" onClick={() => history.push(`/order/${orderId}`)}>查看订单</button>
          </>
        ) : (
          <button className="btn-solid" onClick={() => onPay(0)}>确认下单</button>
        )}
      </div>
    </div>
  );
};

// ====== 主组件 ======
const AiChatPage: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;

  // 游客 conversationId（sessionStorage 持久化）
  const [guestConvId] = useState(() => {
    const key = 'ai_guest_conv';
    const saved = sessionStorage.getItem(key);
    if (saved) return saved;
    const id = String(Date.now());
    sessionStorage.setItem(key, id);
    return id;
  });

  // 登录用户的会话管理
  const isLoggedIn = !!currentUser?.id;
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const activeConvId = sessionId != null ? String(sessionId) : guestConvId;

  // 用稳定 key 缓存消息（含卡片），刷新不丢
  const msgCacheKey = `ai_msgs_${currentUser?.id || guestConvId}`;
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const cached = sessionStorage.getItem(msgCacheKey);
      if (cached) return JSON.parse(cached);
    } catch {}
    return [
      { role: 'ai', content: '你好！我是 AI 观影助手 🎬\n告诉我你的需求，比如"想看周末的喜剧片"或"帮我选IMAX哪吒"，我帮你一站式搞定选座购票～', timestamp: Date.now(), cards: [] },
    ];
  });
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [flow, setFlow] = useState<TicketFlow>({ step: 0 });
  const msgsRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    msgsRef.current?.scrollTo({ top: msgsRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // 消息变化时存 sessionStorage
  const lastSavedRef = useRef('');
  useEffect(() => {
    const json = JSON.stringify(messages);
    if (json !== lastSavedRef.current) {
      lastSavedRef.current = json;
      try { sessionStorage.setItem(msgCacheKey, json); } catch {}
    }
  }, [messages, msgCacheKey]);

  // ---- 会话初始化（仅登录用户） ----
  useEffect(() => {
    if (!isLoggedIn) return;
    (async () => {
      try {
        const resList = await listSessions({ userId: currentUser!.id! });
        const list = (resList as any)?.data || [];
        setSessions(list);
        const resCur = await getCurrentSession({ userId: currentUser!.id! });
        const cur = (resCur as any)?.data;
        if (cur?.id) {
          setSessionId(cur.id);
          await loadHistory(cur.id);
        }
      } catch { /* ignore */ }
    })();
  }, [isLoggedIn]);

  // ---- 加载历史消息 ----
  const loadHistory = useCallback(async (sid: string) => {
    setLoadingHistory(true);
    // 优先用 sessionStorage 缓存（含卡片数据）
    const cacheKey2 = `ai_msgs_${currentUser?.id || guestConvId}`;
    const cached = (() => { try { const c = sessionStorage.getItem(cacheKey2); return c ? JSON.parse(c) : null; } catch { return null; } })();
    if (cached && cached.length > 0) {
      setMessages(cached);
      setLoadingHistory(false);
      return;
    }
    setMessages([]);
    try {
      const res = await listBySession({ sessionId: sid });
      const historyList: any[] = (res as any)?.data || [];
      if (historyList.length > 0) {
        const msgs: ChatMessage[] = historyList.map((h) => ({
          role: (h.messageType === 'user' ? 'user' : 'ai') as 'user' | 'ai',
          content: h.message || '',
          timestamp: Date.parse(h.createTime || '') || Date.now(),
          cards: [],
        }));
        setMessages(msgs);
      } else {
        setMessages([{ role: 'ai', content: '你好！我是 AI 观影助手 🎬\n告诉我你的需求...', timestamp: Date.now(), cards: [] }]);
      }
    } catch {
      setMessages([{ role: 'ai', content: '你好！我是 AI 观影助手 🎬', timestamp: Date.now(), cards: [] }]);
    } finally {
      setLoadingHistory(false);
    }
  }, [currentUser?.id, guestConvId]);

  // ---- 会话操作 ----
  const newSession = useCallback(async () => {
    if (!isLoggedIn) return;
    if (abortRef.current) { abortRef.current.abort(); abortRef.current = null; }
    setSending(false);
    try {
      const res = await createSession({ userId: currentUser!.id! });
      const s = (res as any)?.data;
      if (s?.id) {
        setSessionId(s.id);
        setMessages([{ role: 'ai', content: '新对话已创建，有什么想看的？', timestamp: Date.now(), cards: [] }]);
        setFlow({ step: 0 });
        setHistoryOpen(false);
        const listRes = await listSessions({ userId: currentUser!.id! });
        setSessions((listRes as any)?.data || []);
      }
    } catch { message.error('创建会话失败'); }
  }, [isLoggedIn, currentUser]);

  const switchSession = useCallback(async (sid: string) => {
    if (sid === sessionId) { setHistoryOpen(false); return; }
    if (abortRef.current) { abortRef.current.abort(); abortRef.current = null; }
    setSessionId(sid);
    setSending(false);
    setHistoryOpen(false);
    setFlow({ step: 0 });
    await loadHistory(sid);
  }, [sessionId, loadHistory]);

  const deleteSession = useCallback(async (sid: string) => {
    try {
      await removeSession({ id: sid });
      const listRes = await listSessions({ userId: currentUser!.id! });
      const list = (listRes as any)?.data || [];
      setSessions(list);
      if (sid === sessionId) {
        if (list.length > 0) {
          switchSession(list[0].id);
        } else {
          newSession();
        }
      }
    } catch { message.error('删除失败'); }
  }, [currentUser, sessionId, switchSession, newSession]);

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

  // ★ 发送消息前先尝试本地处理（查影片→查影院，避免走后端 AI 返回不准确的影院列表）
  const tryLocalFilmSearch = useCallback(async (text: string): Promise<boolean> => {
    // 匹配 "《xxx》" 或 "我要看xxx" 或 "xxx有哪些影院" 等模式
    const bookPattern = /《(.+?)》/;
    const bookMatch = text.match(bookPattern);
    const wantPattern = /(?:我要看|想看|看下?|查下?|搜下?|找下?)\s*[《]?(.+?)[》]?(?:\s*(?:有哪些|在哪里|哪个|哪些|什么).*(?:影院|电影院|影城|放映|上映|场次|排片)|$)/;
    const wantMatch = text.match(wantPattern);

    let filmName: string | null = null;
    if (bookMatch) {
      filmName = bookMatch[1].trim();
    } else if (wantMatch) {
      filmName = wantMatch[1].trim();
    }

    if (!filmName || filmName.length < 1 || filmName.length > 50) return false;

    // 搜索影片
    try {
      const baseUrl = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:8123/api';
      // ★ 直接用 fetch 调接口，避免 typed API 函数的参数处理问题
      const filmResp = await fetch(`${baseUrl}/film/search?keyword=${encodeURIComponent(filmName)}&pageNum=1&pageSize=10`, { credentials: 'include' });
      const filmJson = await filmResp.json();
      const films: any[] = filmJson?.data?.records || [];
      if (films.length === 0) return false;

      // 模糊匹配
      let matched: any = null;
      for (const f of films) {
        const n = f.name || '';
        if (n === filmName || n.includes(filmName) || filmName.includes(n)) { matched = f; break; }
      }
      if (!matched) matched = films[0];

      const fid = matched.id || matched.filmId;
      if (!fid) return false;

      currentFilmIdRef.current = String(fid);
      const fname = matched.name;

      // 查排片 → 去重得影院
      const schResp = await fetch(`${baseUrl}/schedule/list?filmId=${fid}`, { credentials: 'include' });
      const schJson = await schResp.json();
      const allData: any[] = schJson?.data || [];
      const validData = allData.filter((s: any) => Number(s.availableSeats) > 0 || s.availableSeats == null);
      const cinemaMap = new Map<string, any>();
      validData.forEach((s: any) => {
        const cid = String(s.cinemaId || '');
        if (!cinemaMap.has(cid)) {
          cinemaMap.set(cid, {
            cinemaId: cid,
            name: s.cinemaName || `影院${cid}`,
            address: s.cinemaAddress || '',
            basePrice: s.price,
            tags: s.cinemaTags || '',
            filmId: String(s.filmId || ''),  // ★ 带上 filmId，供 handleCinemaSelect 兜底
          });
        }
      });
      const cinemaList = Array.from(cinemaMap.values());

      if (cinemaList.length === 0) {
        setMessages((prev) => [...prev, { role: 'ai', content: `😔 暂无影院放映《${fname}》，换一部试试～`, timestamp: Date.now(), cards: [] }]);
      } else {
        const cardPayload = { type: 'card', cardType: 'cinema_list', data: { cinemas: cinemaList, total: cinemaList.length } };
        setMessages((prev) => [...prev, { role: 'ai', content: `✅ 共${cinemaList.length}家影院放映《${fname}》，选一家看场次吧～`, timestamp: Date.now(), cards: [cardPayload] }]);
      }
      setSending(false);
      return true; // 已本地处理，不走后端 AI
    } catch {
      return false; // 失败则回退到后端 AI
    }
  }, []);

  // 发送消息（统一用流式 smart-stream）
  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    // 重置对话
    if (trimmed === '__reset__') {
      try { await resetConversation1({ conversationId: activeConvId }); } catch {}
      setMessages([{ role: 'ai', content: '对话已重置', timestamp: Date.now(), cards: [] }]);
      setFlow({ step: 0 });
      return;
    }

    const userMsg: ChatMessage = { role: 'user', content: trimmed, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setSending(true);

    // ★ 本地处理：影片+影院搜索 直接调 API，不靠后端 AI
    if (await tryLocalFilmSearch(trimmed)) return;

    const controller = new AbortController();
    abortRef.current = controller;

    const baseUrl = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:8123/api';
    const params = new URLSearchParams({ message: trimmed, conversationId: activeConvId });
    if (currentUser?.id) params.set('userId', String(currentUser.id));

    let aiText = '';
    const cards: any[] = [];

    try {
      const res = await fetch(`${baseUrl}/movie-agent/smart-stream?${params}`, {
        signal: controller.signal,
        credentials: 'include',
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body?.getReader();
      if (!reader) throw new Error('无法读取响应流');

      const decoder = new TextDecoder();
      let buf = '';
      let currentEvent = '';

      // 先添加空的 AI 消息占位
      setMessages((prev) => [...prev, { role: 'ai', content: '', timestamp: Date.now(), cards: [] }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() || '';

        for (const line of lines) {
          // SSE event 类型行
          if (line.startsWith('event:')) {
            currentEvent = line.slice(6).trim();
            continue;
          }

          const parsed = parseSSELine(line);
          if (!parsed) continue;

          if (parsed.card) {
            cards.push(parsed.card);
          }
          if (parsed.text != null) {
            aiText += parsed.text;
            // 流式更新最后一条消息
            setMessages((prev) => {
              const rest = prev.slice(0, -1);
              return [...rest, { role: 'ai', content: aiText, timestamp: Date.now(), cards: [...cards] }];
            });
          }

          // done 事件 → 结束流
          if (currentEvent === 'done') {
            currentEvent = '';
            controller.abort();
            break;
          }
        }

        if (currentEvent === 'done') { currentEvent = ''; break; }
      }

      // 流结束：更新卡片和进度
      updateFlow(cards);
      setMessages((prev) => {
        const rest = prev.slice(0, -1);
        return [...rest, { role: 'ai', content: aiText || '（收到回复）', timestamp: Date.now(), cards: [...cards] }];
      });
      // 刷新会话列表
      if (isLoggedIn) {
        try {
          const listRes = await listSessions({ userId: currentUser!.id! });
          setSessions((listRes as any)?.data || []);
        } catch { /* ignore */ }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setMessages((prev) => [...prev, { role: 'ai', content: '😵 连接中断，请重试', timestamp: Date.now(), cards: [] }]);
      }
    } finally {
      setSending(false);
      abortRef.current = null;
    }
  }, [sending, activeConvId, currentUser?.id, isLoggedIn]);

  // 记录当前影片卡片中的 filmId，用于后续影院→场次查询
  const currentFilmIdRef = useRef<string>('');

  // ★ 影片卡片点选：直接调 listSchedule API 查有排片的影院（绕过 AI，确保只展示真正有该片的影院）
  const handleFilmSelect = useCallback(async (filmId: string, filmName: string) => {
    currentFilmIdRef.current = filmId;
    const userMsg: ChatMessage = { role: 'user', content: `我要看《${filmName}》，有哪些影院放映`, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setSending(true);
    try {
      const baseUrl = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:8123/api';
      const resp = await fetch(`${baseUrl}/schedule/list?filmId=${filmId}`, { credentials: 'include' });
      const json = await resp.json();
      const allData: any[] = json?.data || [];
      // 有可用座位的排片才纳入
      const validData = allData.filter((s: any) => Number(s.availableSeats) > 0 || s.availableSeats == null);
      // 按影院去重
      const cinemaMap = new Map<string, any>();
      validData.forEach((s: any) => {
        const cid = String(s.cinemaId || '');
        if (!cinemaMap.has(cid)) {
          cinemaMap.set(cid, {
            cinemaId: cid,
            name: s.cinemaName || `影院${cid}`,
            address: s.cinemaAddress || '',
            basePrice: s.price,
            tags: s.cinemaTags || '',
            filmId: String(s.filmId || ''),  // ★ 带上 filmId，供 handleCinemaSelect 兜底
          });
        }
      });
      const cinemaList = Array.from(cinemaMap.values());
      if (cinemaList.length === 0) {
        setMessages((prev) => [...prev, { role: 'ai', content: `😔 暂无影院放映《${filmName}》，换一部试试～`, timestamp: Date.now(), cards: [] }]);
      } else {
        const cardPayload = { type: 'card', cardType: 'cinema_list', data: { cinemas: cinemaList, total: cinemaList.length } };
        setMessages((prev) => [...prev, { role: 'ai', content: `✅ 共${cinemaList.length}家影院放映《${filmName}》，选一家看场次吧～`, timestamp: Date.now(), cards: [cardPayload] }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'ai', content: '😵 加载影院失败，请重试', timestamp: Date.now(), cards: [] }]);
    } finally {
      setSending(false);
    }
  }, []);

  // 影院卡片点击：直接调 listSchedule API，绕过后端 AI 避免查全量
  const handleCinemaSelect = useCallback(async (cinemaId: string, cinemaName: string, cardFilmId?: string) => {
    const fid = currentFilmIdRef.current || cardFilmId;
    if (!fid) {
      sendMessage(`就选这家影院：${cinemaName}，影院ID=${cinemaId}`);
      return;
    }
    const userMsg: ChatMessage = { role: 'user', content: `就选这家影院：${cinemaName}`, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    try {
      // ★ 直接用 fetch 调接口，避免 typed API 函数的参数处理问题
      const baseUrl = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:8123/api';
      const url = `${baseUrl}/schedule/list?filmId=${fid}&cinemaId=${cinemaId}`;
      const resp = await fetch(url, { credentials: 'include' });
      const json = await resp.json();
      const rawData = json?.data || [];
      // 去重+有座位+排序+限30条（日期过滤由后端 queryScheduleList 处理）
      const seen = new Set<string>();
      const data = rawData
        .filter((s: any) => Number(s.availableSeats) > 0 || s.availableSeats == null)
        .filter((s: any) => {
          const key = `${s.showDate}|${s.startTime}|${s.hallName}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .sort((a: any, b: any) => (a.showDate + a.startTime).localeCompare(b.showDate + b.startTime))
        .slice(0, 30);
      if (data.length === 0) {
        setMessages((prev) => [...prev, { role: 'ai', content: `😔 ${cinemaName}暂无该影片的排期，换一家试试～`, timestamp: Date.now(), cards: [] }]);
        return;
      }
      const cardPayload = { type: 'card', cardType: 'schedule_list', data: { sessions: data, total: data.length } };
      setMessages((prev) => [...prev, { role: 'ai', content: `✅ ${cinemaName}的场次如下，选一个吧～`, timestamp: Date.now(), cards: [cardPayload] }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'ai', content: '😵 加载场次失败，请重试', timestamp: Date.now(), cards: [] }]);
    }
  }, []);

  // 场次卡片点击：直接调 getSeatMap API，不靠后端 AI
  const handleScheduleSelect = useCallback(async (s: any) => {
    const sid = s.scheduleId || s.id;
    const label = `${s.cinemaName || ''} ${s.hallName} ${s.startTime}`.trim();
    const userMsg: ChatMessage = { role: 'user', content: `选这个场次：${label}`, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    try {
      const baseUrl2 = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:8123/api';
      const resp2 = await fetch(`${baseUrl2}/seat/seatmap/${sid}`, { credentials: 'include' });
      const json2 = await resp2.json();
      const data = json2?.data;
      if (!data || !data.seats || data.seats.length === 0) {
        setMessages((prev) => [...prev, { role: 'ai', content: `😔 ${label} 暂无可用座位`, timestamp: Date.now(), cards: [] }]);
        return;
      }
      const cardPayload = { type: 'card', cardType: 'seat_map', data };
      setMessages((prev) => [...prev, { role: 'ai', content: `🎯 ${data.hallName || ''} 座位图，点击选座：`, timestamp: Date.now(), cards: [cardPayload] }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'ai', content: '😵 加载座位图失败，请重试', timestamp: Date.now(), cards: [] }]);
    }
  }, []);

  // ★ 选座确认：直接调 lockSeat + createOrder API，不走后端 AI
  const [lockingSeats, setLockingSeats] = useState(false);
  const handleSeatConfirm = useCallback(async (scheduleId: number, seatIds: number[], seatData: any) => {
    if (!currentUser?.id) {
      message.warning('请先登录后再购票');
      history.push('/user/login');
      return;
    }
    setLockingSeats(true);
    try {
      // Step 1: 锁座
      const lockRes = await lockSeat({ scheduleId, seatIds } as any);
      const lockOk = (lockRes as any)?.data === true || (lockRes as any)?.code === 0;
      if (!lockOk) {
        const errMsg = (lockRes as any)?.message || (lockRes as any)?.data?.message || '座位已被抢走，请重新选择';
        setMessages((prev) => [...prev, { role: 'ai', content: `😔 ${errMsg}`, timestamp: Date.now(), cards: [] }]);
        setLockingSeats(false);
        return;
      }

      // Step 2: 锁座成功 → 创建订单
      const orderRes = await createOrder({ scheduleId, seatIds } as any);
      const orderData = (orderRes as any)?.data;
      if (orderData) {
        const seatLabels = orderData.seatLabels || [];
        const totalPrice = orderData.totalPrice || 0;
        const cardPayload = { type: 'card', cardType: 'order_confirm', data: orderData };
        setMessages((prev) => [...prev, {
          role: 'ai',
          content: `🔒 已锁定 ${seatLabels.join('、')}，共 ¥${Number(totalPrice).toFixed(2)}。订单已生成，请在15分钟内完成支付哦～`,
          timestamp: Date.now(),
          cards: [cardPayload],
        }]);
        setFlow((prev) => ({ ...prev, step: 5, order: orderData }));
      } else {
        setMessages((prev) => [...prev, {
          role: 'ai', content: `🔒 座位已锁定！请发送"确认下单"来创建订单～`,
          timestamp: Date.now(),
          cards: [{ type: 'card', cardType: 'seats_confirmed', data: { scheduleId, seatIds } }],
        }]);
      }
    } catch (e: any) {
      setMessages((prev) => [...prev, { role: 'ai', content: `😵 操作失败：${e?.message || '请重试'}`, timestamp: Date.now(), cards: [] }]);
    } finally {
      setLockingSeats(false);
    }
  }, [currentUser?.id]);

  // ★ 支付订单：自动提交支付宝表单（和订单列表支付逻辑一致）
  const [payingOrder, setPayingOrder] = useState(false);
  const handlePayOrder = useCallback(async (orderId: number) => {
    setPayingOrder(true);
    try {
      const res = await payOrder({ orderId } as any);
      const payData = (res as any)?.data;
      if (payData?.payForm) {
        // 自动提交支付表单，跳转到支付宝
        const div = document.createElement('div');
        div.style.display = 'none';
        div.innerHTML = payData.payForm;
        document.body.appendChild(div);
        const form = div.querySelector('form');
        if (form) {
          form.submit();
          setMessages((prev) => [...prev, {
            role: 'ai',
            content: `💳 已跳转支付宝支付，订单号 ${payData.orderNo || orderId}，支付完成后票会自动出现在订单列表中～`,
            timestamp: Date.now(),
            cards: [],
          }]);
        }
      } else {
        // 没有 payForm → 尝试模拟支付
        const mockRes = await mockPay({ orderId } as any);
        const mockData = (mockRes as any)?.data;
        if (mockData && mockData.status === 'paid') {
          setMessages((prev) => [...prev, {
            role: 'ai',
            content: `✅ 支付成功！${mockData.filmName} ${mockData.seatLabels?.join('、')}，祝您观影愉快～🎉`,
            timestamp: Date.now(),
            cards: [],
          }]);
          setFlow((prev) => ({ ...prev, step: 6, order: mockData }));
        }
      }
    } catch (e: any) {
      setMessages((prev) => [...prev, { role: 'ai', content: `😵 支付失败：${e?.message || '请重试'}`, timestamp: Date.now(), cards: [] }]);
    } finally {
      setPayingOrder(false);
    }
  }, [currentUser?.id]);

  // 渲染卡片
  const renderCards = (cards: any[]) => {
    if (!cards?.length) return null;
    return cards.map((card, i) => {
      const ct = card?.cardType || card?.type;
      const data = card?.data || card;

      if (ct === 'movie_list' || ct === 'film_list') {
        const list = data?.list || data?.records || data?.films || (Array.isArray(data) ? data : []);
        const items = Array.isArray(list) ? list : [];
        if (items.length === 0) {
          return <div key={i} style={{ marginTop: 10, padding: '12px 16px', background: '#fffbe6', borderRadius: 8, border: '1px solid #ffe58f', fontSize: 13, color: '#ad6800' }}>⚠️ 没有搜到符合条件的影片，换个关键词试试～</div>;
        }
        // 记住当前影片ID，后续选影院时直接调 API 查场次
        if (items[0]?.filmId) currentFilmIdRef.current = String(items[0].filmId);
        return (
          <div key={i}>
            <FilmCards items={items} onSelect={handleFilmSelect} />
            {items.length === 1 && (() => {
              const fid = items[0]?.filmId || items[0]?.id;
              const fname = items[0]?.name;
              return (
                <button
                  style={{ marginTop: 8, height: 32, padding: '0 14px', borderRadius: 6, border: '1px solid #FF4D4F', background: '#fff', color: '#FF4D4F', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}
                  onClick={async () => {
                    if (!fid) { sendMessage(`帮我查《${fname}》在哪些影院上映`); return; }
                    currentFilmIdRef.current = String(fid);
                    setMessages((prev) => [...prev, { role: 'user', content: `查看《${fname}》放映影院`, timestamp: Date.now() }]);
                    try {
                      const baseUrl2 = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:8123/api';
                      const resp2 = await fetch(`${baseUrl2}/schedule/list?filmId=${fid}`, { credentials: 'include' });
                      const json2 = await resp2.json();
                      const allData: any[] = json2?.data || [];
                      const cinemaMap = new Map<string, any>();
                      allData.forEach((s: any) => {
                        const cid = String(s.cinemaId || '');
                        if (!cinemaMap.has(cid)) {
                          cinemaMap.set(cid, { cinemaId: cid, name: s.cinemaName || `影院${cid}`, address: s.cinemaAddress || '', basePrice: s.price });
                        }
                      });
                      const cinemaList = Array.from(cinemaMap.values());
                      if (cinemaList.length === 0) {
                        setMessages((prev) => [...prev, { role: 'ai', content: `😔 暂无影院放映《${fname}》`, timestamp: Date.now(), cards: [] }]);
                      } else {
                        setMessages((prev) => [...prev, { role: 'ai', content: `✅ 共${cinemaList.length}家影院放映《${fname}》，选一家看场次吧～`, timestamp: Date.now(), cards: [{ type: 'card', cardType: 'cinema_list', data: { cinemas: cinemaList, total: cinemaList.length } }] }]);
                      }
                    } catch { setMessages((prev) => [...prev, { role: 'ai', content: '😵 加载失败，请重试', timestamp: Date.now(), cards: [] }]); }
                  }}
                >
                  🎬 查看放映影院 →
                </button>
              );
            })()}
          </div>
        );
      }

      if (ct === 'cinema_list') {
        const list = data?.cinemas || data?.list || data?.records || (Array.isArray(data) ? data : []);
        const items = Array.isArray(list) ? list : [];
        if (items.length === 0) {
          return <div key={i} style={{ marginTop: 10, padding: '12px 16px', background: '#fffbe6', borderRadius: 8, border: '1px solid #ffe58f', fontSize: 13, color: '#ad6800' }}>⚠️ 暂无符合条件的影院</div>;
        }
        return <CinemaCards key={i} items={items} filmId={currentFilmIdRef.current} onSelectCinema={handleCinemaSelect} />;
      }

      if (ct === 'session_list' || ct === 'schedule_list') {
        const list = data?.sessions || data?.schedules || data?.list || data?.records || (Array.isArray(data) ? data : []);
        const items = Array.isArray(list) ? list : [];
        if (items.length === 0) {
          return <div key={i} style={{ marginTop: 10, padding: '12px 16px', background: '#fffbe6', borderRadius: 8, border: '1px solid #ffe58f', fontSize: 13, color: '#ad6800' }}>⚠️ 该日期暂无场次，换一天试试～</div>;
        }
        return <ScheduleCards key={i} items={items} onSelect={handleScheduleSelect} />;
      }

      if (ct === 'seat_map') {
        return <SeatMapCard key={i} data={data} onSelectSeats={handleSeatConfirm} locking={lockingSeats} />;
      }

      if (ct === 'order_confirm' || ct === 'order' || ct === 'order_detail') {
        return <OrderCard key={i} data={data} onPay={handlePayOrder} paying={payingOrder} />;
      }

      if (ct === 'payment_form') {
        const payForm = data?.payForm;
        const orderNo = data?.orderNo;
        return (
          <div key={i} className="ai-order-card" style={{ marginTop: 10 }}>
            <div style={{ marginBottom: 8, fontWeight: 600 }}>💳 支付宝支付 - 订单 {orderNo}</div>
            {payForm ? (
              <div dangerouslySetInnerHTML={{ __html: payForm }} />
            ) : (
              <div style={{ color: '#999', fontSize: 13 }}>支付页面加载中...</div>
            )}
          </div>
        );
      }

      if (ct === 'seats_confirmed') {
        const sid = data?.scheduleId;
        const sids = data?.seatIds;
        const tp = data?.totalPrice;
        const cnt = data?.count;
        return (
          <div key={i} style={{ marginTop: 10 }}>
            <button
              className="btn-solid"
              style={{ height: 40, padding: '0 28px', borderRadius: 8, border: 'none', background: '#FF4D4F', color: '#fff', cursor: 'pointer', fontSize: 15, fontWeight: 600, fontFamily: 'inherit' }}
              onClick={async () => {
                if (!sid || !sids?.length) return;
                try {
                  const orderRes = await createOrder({ scheduleId: sid, seatIds: sids } as any);
                  const orderData = (orderRes as any)?.data;
                  if (orderData) {
                    const cardPayload = { type: 'card', cardType: 'order_confirm', data: orderData };
                    setMessages((prev) => [...prev, {
                      role: 'ai',
                      content: `✅ 订单已生成！请在15分钟内完成支付哦～`,
                      timestamp: Date.now(),
                      cards: [cardPayload],
                    }]);
                    setFlow((prev) => ({ ...prev, step: 5, order: orderData }));
                  }
                } catch { /* ignore */ }
              }}
            >
              📋 确认下单 {tp ? `¥${Number(tp).toFixed(2)}` : ''}{cnt ? ` (${cnt}张)` : ''}
            </button>
          </div>
        );
      }

      return null;
    });
  };

  const formatTime = (t?: string) => {
    if (!t) return '';
    const d = new Date(t);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    return `${d.getMonth() + 1}-${d.getDate()}`;
  };

  return (
    <div className="ai-chat-wrap">
      {/* 历史会话抽屉 */}
      {isLoggedIn && (
        <Drawer
          title="对话历史"
          placement="left"
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
          width={300}
          extra={<span className="drawer-new-btn" onClick={newSession}><PlusOutlined /> 新对话</span>}
        >
          {/* 按日期分组 */}
          {(() => {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const yesterday = new Date(today.getTime() - 86400000);
            const weekAgo = new Date(today.getTime() - 7 * 86400000);

            const groups: { label: string; items: SessionItem[] }[] = [];
            const grouped = new Set<string>();

            const addGroup = (label: string, filter: (d: Date) => boolean) => {
              const items = sessions.filter((s) => {
                if (grouped.has(s.id)) return false;
                const d = new Date(s.editTime || s.createTime);
                return filter(d);
              });
              items.forEach((s) => grouped.add(s.id));
              if (items.length > 0) groups.push({ label, items });
            };

            addGroup('今天', (d) => d >= today);
            addGroup('昨天', (d) => d >= yesterday && d < today);
            addGroup('本周', (d) => d >= weekAgo && d < yesterday);
            addGroup('更早', () => true);

            if (groups.length === 0) return <Empty description="暂无对话记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />;

            return groups.map((grp) => (
              <div key={grp.label} className="session-group">
                <div className="session-group-title">{grp.label}</div>
                {grp.items.map((s) => (
                  <div
                    key={s.id}
                    className={`session-item ${s.id === sessionId ? 'session-item-active' : ''}`}
                    onClick={() => switchSession(s.id)}
                  >
                    <span className="session-icon">💬</span>
                    <div className="session-content">
                      <span className="session-name">{s.sessionName || '新对话'}</span>
                      <span className="session-time">{formatTime(s.editTime || s.createTime)}</span>
                    </div>
                    <DeleteOutlined
                      className="session-del"
                      onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
                    />
                  </div>
                ))}
              </div>
            ));
          })()}
        </Drawer>
      )}

      {/* 对话区 */}
      <div className="chat-main">
        <div className="ch-header">
          {isLoggedIn && <MenuOutlined className="history-toggle-btn" onClick={() => setHistoryOpen(true)} />}
          <div className="ch-avatar">🤖</div>
          <div style={{ flex: 1 }}>
            <div className="ch-title">
              {isLoggedIn ? (sessions.find(s => s.id === sessionId)?.sessionName || 'AI 观影助手') : 'AI 观影助手'}
              <span className="ch-status"><span className="status-dot" />在线</span>
            </div>
            <div className="ch-sub">说一句话，帮你选座购票</div>
          </div>
          {isLoggedIn && <button className="reset-btn" title="新对话" onClick={newSession}><PlusOutlined /></button>}
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
