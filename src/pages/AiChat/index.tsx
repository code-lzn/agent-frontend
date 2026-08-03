import { doChat } from '@/api/movieAgentController';
import { history, useModel } from '@umijs/max';
import { Input } from 'antd';
import { ArrowUpOutlined } from '@ant-design/icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import './index.css';

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  timestamp: number;
  cards?: any[];
}

const QUICK_TAGS = [
  { label: '🎭 周末喜剧', text: '我想看喜剧片，周末下午的' },
  { label: '🎬 附近 IMAX', text: '帮我找附近的IMAX场次' },
  { label: '🔥 热映排行', text: '现在热映的电影有哪些' },
  { label: '💰 便宜场次', text: '帮我找最便宜的电影票' },
  { label: '🔄 重新开始', text: '重置对话' },
];

const STEPS = [
  { label: '选择影片' },
  { label: '选择影院' },
  { label: '选择场次' },
  { label: '选择座位' },
  { label: '支付出票' },
];

/** 卡片类型 → 进度步骤下标 */
const CARD_STEP_MAP: Record<string, number> = {
  movie_list: 0,
  session_list: 2,
  seat_map: 3,
  order_confirm: 4,
};

/**
 * 从 AI 回复中提取末尾的 JSON 卡片（提示词约定：{"type":"card",...} 放在回复最后）
 */
function extractCards(text: string): { text: string; cards: any[] } {
  const idx = text.lastIndexOf('{"type":"card"');
  if (idx === -1) return { text, cards: [] };
  let depth = 0;
  let end = -1;
  for (let i = idx; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') {
      depth--;
      if (depth === 0) { end = i + 1; break; }
    }
  }
  if (end === -1) return { text, cards: [] };
  try {
    const parsed = JSON.parse(text.slice(idx, end));
    return { text: text.slice(0, idx).trim(), cards: Array.isArray(parsed) ? parsed : [parsed] };
  } catch {
    return { text, cards: [] };
  }
}

const AiChatPage: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'ai',
      content: '你好！我是你的 AI 观影助手 🎬\n告诉我你想看什么电影，我帮你快速选座～',
      timestamp: Date.now(),
      cards: [],
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [conversationId] = useState(
    () => `user_${currentUser?.id || 'guest'}_${Date.now()}`,
  );
  // 购票进度（基于最近收到的卡片类型推进）
  const [maxStep, setMaxStep] = useState(0);
  const msgsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (msgsRef.current) {
      msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
    }
  }, [messages, sending]);

  const addMessage = (role: 'user' | 'ai', content: string, cards?: any[]) => {
    setMessages((prev) => [...prev, { role, content, timestamp: Date.now(), cards: cards || [] }]);
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    addMessage('user', trimmed);
    setInputValue('');
    setSending(true);

    try {
      const res = await doChat({
        message: trimmed,
        conversationId,
        userId: currentUser?.id,
      } as API.MovieChatRequest);
      const reply =
        typeof res === 'string' ? res : (res as any)?.data || JSON.stringify(res);
      const { text: cleanText, cards } = extractCards(reply || '');
      if (cards.length) {
        const lastCardType = cards[cards.length - 1]?.cardType;
        const step = CARD_STEP_MAP[lastCardType];
        if (step != null) {
          setMaxStep((prev) => Math.max(prev, step + 1));
        }
      }
      addMessage('ai', cleanText || '收到你的消息，请稍后重试～', cards);
    } catch (err: any) {
      addMessage('ai', '抱歉，出了点小问题，请再试一次～');
      console.error('AI chat error:', err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  const renderContent = (content: string) => {
    return content.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {line}
        {i < content.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  /** 电影推荐卡片 */
  const MovieCard = ({ data }: { data: any }) => {
    const name = data?.name || data?.title || '';
    const poster = data?.posterUrl || data?.poster || '';
    const rating = data?.rating != null ? Number(data.rating) : null;
    const type = data?.type || data?.genre || '';
    const filmId = data?.filmId || data?.id;
    return (
      <div className="movie-card">
        <div className="movie-card-poster">
          {poster ? <img src={poster} alt={name} /> : '🎬'}
        </div>
        <div className="movie-card-info">
          <div className="movie-card-name">{name}</div>
          {rating != null && <div className="movie-card-rating">★ {rating.toFixed(1)}</div>}
          {type && <div className="movie-card-type">{type}</div>}
          <div className="movie-card-actions">
            <button
              className="btn-ghost"
              onClick={() => {
                if (filmId != null) history.push(`/film/${filmId}`);
                else sendMessage(`介绍一下《${name}》`);
              }}
            >
              详情
            </button>
            <button className="btn-solid" onClick={() => sendMessage(`选这部《${name}》`)}>
              选这部
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderCards = (cards: any[]) => {
    const movieCards = cards.filter((c) => c?.cardType === 'movie_list');
    if (movieCards.length === 0) return null;
    const list = movieCards[0]?.data?.list || movieCards[0]?.data?.records || movieCards[0]?.data || [];
    const items = Array.isArray(list) ? list : [];
    if (items.length === 0) return null;
    return (
      <div className="card-group">
        {items.map((m: any, i: number) => (
          <MovieCard key={m?.filmId || i} data={m} />
        ))}
      </div>
    );
  };

  return (
    <div className="ai-chat-wrap">
      {/* 中间对话区 */}
      <div className="chat-main">
        <div className="ch-header">
          <div className="ch-avatar">🤖</div>
          <div style={{ flex: 1 }}>
            <div className="ch-title">
              AI 观影助手
              <span className="ch-status">
                <span className="status-dot" />在线
              </span>
            </div>
            <div className="ch-sub">告诉我你想看什么，一句话搞定～</div>
          </div>
        </div>

        <div className="chat-msgs" ref={msgsRef}>
          {messages.map((msg, idx) => (
            <div key={idx} className={`msg ${msg.role}`}>
              {msg.role === 'ai' && <div className="av">🤖</div>}
              <div>
                <div className="balloon">
                  {renderContent(msg.content)}
                  {msg.role === 'ai' && idx === 0 && (
                    <div className="quick-tags">
                      {QUICK_TAGS.slice(0, 3).map((tag) => (
                        <span key={tag.label} className="qt" onClick={() => sendMessage(tag.text)}>
                          {tag.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {msg.cards && msg.cards.length > 0 && renderCards(msg.cards)}
              </div>
            </div>
          ))}
          {sending && (
            <div className="msg ai">
              <div className="av">🤖</div>
              <div className="balloon">
                <div className="typing-dots">
                  <span />
                  <span />
                  <span />
                </div>
                <div style={{ fontSize: 12, color: '#909399', marginTop: 4 }}>
                  正在思考...
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 输入区 */}
        <div className="chat-input">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="说说你想看什么电影吧～"
            disabled={sending}
            size="large"
          />
          <button
            className="send-btn"
            onClick={() => sendMessage(inputValue)}
            disabled={sending || !inputValue.trim()}
          >
            <ArrowUpOutlined />
          </button>
        </div>
      </div>

      {/* 右侧辅助栏 */}
      <div className="chat-sidebar">
        <div className="cs-card">
          <div className="cs-title">📊 购票进度</div>
          {STEPS.map((step, idx) => (
            <div
              key={idx}
              className={`step ${idx < maxStep ? 'done' : idx === maxStep ? 'active' : ''}`}
            >
              <span className="s-num">
                {idx < maxStep ? '✓' : idx + 1}
              </span>
              <span className="s-label">{step.label}</span>
            </div>
          ))}
        </div>
        <div className="cs-card cs-tip">
          <div className="cs-tip-title">💡 快捷指令</div>
          <div className="cs-tip-text">
            {QUICK_TAGS.map((tag) => (
              <button key={tag.label} className="chip" onClick={() => sendMessage(tag.text)}>
                {tag.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiChatPage;
