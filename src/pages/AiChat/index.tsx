import { movieAgentChat } from '@/api/movieAgentController';
import { useModel } from '@umijs/max';
import { Button, Input, message } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import React, { useEffect, useRef, useState } from 'react';
import './index.css';

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  timestamp: number;
}

const QUICK_TAGS = [
  { label: '🎭 周末喜剧', text: '我想看喜剧片，周末下午的' },
  { label: '🎬 附近 IMAX', text: '帮我找附近的IMAX场次' },
  { label: '🔥 热映排行', text: '现在热映的电影有哪些' },
  { label: '💰 便宜场次', text: '帮我找最便宜的电影票' },
  { label: '🏠 推荐影院', text: '附近有什么好的电影院' },
  { label: '🔄 重新开始', text: '重置对话' },
];

const AiChatPage: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'ai',
      content: '你好！我是你的 AI 观影助手 🎬\n告诉我你想看什么电影，我帮你快速选座～',
      timestamp: Date.now(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [conversationId] = useState(
    () => `user_${currentUser?.id || 'guest'}_${Date.now()}`,
  );
  const msgsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (msgsRef.current) {
      msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
    }
  }, [messages]);

  const addMessage = (role: 'user' | 'ai', content: string) => {
    setMessages((prev) => [...prev, { role, content, timestamp: Date.now() }]);
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    addMessage('user', trimmed);
    setInputValue('');
    setSending(true);

    try {
      const res = await movieAgentChat({
        message: trimmed,
        conversationId,
        userId: currentUser?.id,
      });

      const reply =
        typeof res === 'string' ? res : (res as any)?.data || JSON.stringify(res);
      addMessage('ai', reply || '收到你的消息，请稍后重试～');
    } catch (err: any) {
      addMessage('ai', '抱歉，出了点小问题，请再试一次～');
      console.error('AI chat error:', err);
    } finally {
      setSending(false);
    }
  };

  const handleQuickTag = (text: string) => {
    sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  const renderContent = (content: string) => {
    // 简单换行处理
    return content.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {line}
        {i < content.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  // 购票步骤
  const steps = [
    { label: '选择影片', done: messages.length > 1 },
    { label: '选择影院', done: messages.length > 2 },
    { label: '选择场次', done: messages.length > 3 },
    { label: '选择座位', done: messages.length > 4 },
    { label: '支付出票', done: messages.length > 5 },
  ];
  const activeStep = steps.filter((s) => s.done).length;

  return (
    <div className="ai-chat-wrap">
      {/* 主对话区 */}
      <div className="chat-main">
        <div className="ch-header">
          <div className="ch-avatar">🤖</div>
          <div>
            <div className="ch-title">AI 观影助手</div>
            <div className="ch-sub">
              告诉我你想看什么，一句话搞定～
            </div>
          </div>
        </div>

        <div className="chat-msgs" ref={msgsRef}>
          {messages.map((msg, idx) => (
            <div key={idx} className={`msg ${msg.role}`}>
              {msg.role === 'ai' && <div className="av">🤖</div>}
              <div className="balloon">
                {renderContent(msg.content)}
                {msg.role === 'ai' && idx === 0 && (
                  <div className="quick-tags">
                    {QUICK_TAGS.slice(0, 3).map((tag) => (
                      <span
                        key={tag.label}
                        className="qt"
                        onClick={() => handleQuickTag(tag.text)}
                      >
                        {tag.label}
                      </span>
                    ))}
                  </div>
                )}
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
                <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                  正在思考...
                </div>
              </div>
            </div>
          )}
        </div>

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
            <SendOutlined />
          </button>
        </div>
      </div>

      {/* 右侧边栏 */}
      <div className="chat-sidebar">
        <div className="cs-card">
          <div className="cs-title">📊 购票进度</div>
          {steps.map((step, idx) => (
            <div
              key={idx}
              className={`step ${
                idx < activeStep ? 'done' : idx === activeStep ? 'active' : ''
              }`}
            >
              <span className="s-num">{idx + 1}</span>
              <span className="s-label">{step.label}</span>
            </div>
          ))}
        </div>
        <div className="cs-card cs-tip">
          <div className="cs-tip-title">💡 快捷指令</div>
          <div className="cs-tip-text">
            {QUICK_TAGS.map((tag) => (
              <div
                key={tag.label}
                style={{
                  padding: '4px 0',
                  cursor: 'pointer',
                  color: '#666',
                  fontSize: 12,
                }}
                onClick={() => handleQuickTag(tag.text)}
              >
                {tag.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiChatPage;
