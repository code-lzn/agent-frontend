import { nowShowing, recommended } from '@/api/filmController';
import { history } from '@umijs/max';
import { Button, Card, Empty, Space, Spin } from 'antd';
import { RobotOutlined, RightOutlined } from '@ant-design/icons';
import React, { useEffect, useState } from 'react';
import type { Film } from '@/api/typings';
import './index.css';

const HomePage: React.FC = () => {
  const [hotFilms, setHotFilms] = useState<Film[]>([]);
  const [recFilms, setRecFilms] = useState<Film[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([nowShowing({ limit: 10 }), recommended({ limit: 5 })])
      .then(([hotRes, recRes]) => {
        const hotData = (hotRes as any)?.data;
        const recData = (recRes as any)?.data;
        if (hotData && Array.isArray(hotData)) setHotFilms(hotData);
        if (recData && Array.isArray(recData)) setRecFilms(recData);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const getTypeEmoji = (type?: string) => {
    const map: Record<string, string> = {
      科幻: '🌍', 动作: '⚔️', 喜剧: '😄', 动画: '🐉',
      爱情: '💕', 悬疑: '🔍', 恐怖: '👻', 奇幻: '🧙',
    };
    return map[type?.split(',')[0] || ''] || '🎬';
  };

  const filmCard = (film: Film) => (
    <div key={film.id} className="film-card" onClick={() => history.push(`/film/${film.id}`)}>
      <div className="film-poster">
        {film.posterUrl ? (
          <img src={film.posterUrl} alt={film.name} />
        ) : (
          getTypeEmoji(film.type)
        )}
        {film.status === 'upcoming' && (
          <span style={{
            position: 'absolute', top: 8, left: 8, background: '#FF4D4F', color: '#fff',
            fontSize: 11, padding: '2px 8px', borderRadius: 3, fontWeight: 600,
          }}>
            待映
          </span>
        )}
        {film.rating && (
          <div className="film-score">
            {film.rating.toFixed(1)} <span>分</span>
          </div>
        )}
      </div>
      <div className="film-info">
        <div className="film-name">{film.name}</div>
        <div className="film-meta">{film.type?.split(',')[0]} · {film.duration}min</div>
        <div className="film-tags">
          {film.type?.split(',').slice(0, 2).map((t, i) => (
            <span key={t} className={`film-tag ${i === 0 ? 'hot' : ''}`}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '120px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="user-home">
      {/* 欢迎卡片（管理端风格） */}
      <Card className="home-hero-card">
        <div className="hero-content">
          <div>
            <div className="hero-title">🎬 妙语购票</div>
            <div className="hero-desc">AI 智能选片 · 可视化选座 · 即时出票</div>
          </div>
          <Space>
            <Button
              type="primary"
              icon={<RobotOutlined />}
              onClick={() => history.push('/ai-chat')}
              size="large"
            >
              问问 AI
            </Button>
            <Button onClick={() => history.push('/film')} size="large">
              浏览影片 <RightOutlined />
            </Button>
          </Space>
        </div>
      </Card>

      {/* 快捷入口 */}
      <div className="home-section">
        <div className="quick-actions">
          {[
            { emoji: '🤖', label: 'AI 购票', desc: '一句话搞定选座购票', path: '/ai-chat', color: '#FF4D4F' },
            { emoji: '🔥', label: '正在热映', desc: '查看热映好片', path: '/film', color: '#fa8c16' },
            { emoji: '🏢', label: '附近影院', desc: '发现周边影院', path: '/cinema', color: '#1677ff' },
            { emoji: '🎫', label: '我的订单', desc: '查看购票记录', path: '/order/list', color: '#722ed1' },
          ].map((action) => (
            <Card
              key={action.path}
              hoverable
              size="small"
              className="quick-action-card"
              onClick={() => history.push(action.path)}
              style={{ borderRadius: 12, textAlign: 'center' }}
            >
              <div style={{ fontSize: 32, marginBottom: 4 }}>{action.emoji}</div>
              <div style={{ fontWeight: 600, fontSize: 14, color: action.color }}>{action.label}</div>
              <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{action.desc}</div>
            </Card>
          ))}
        </div>
      </div>

      {/* 正在热映 */}
      <div className="home-section">
        <div className="home-section-header">
          <h2>正在热映</h2>
          <Button type="link" onClick={() => history.push('/film')}>
            全部 <RightOutlined />
          </Button>
        </div>
        {hotFilms.length === 0 ? (
          <Card><Empty description="暂无热映影片" /></Card>
        ) : (
          <div className="film-grid">{hotFilms.map(filmCard)}</div>
        )}
      </div>

      {/* 猜你喜欢 */}
      {recFilms.length > 0 && (
        <div className="home-section">
          <div className="home-section-header">
            <h2>猜你喜欢</h2>
          </div>
          <div className="film-grid">{recFilms.map(filmCard)}</div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
