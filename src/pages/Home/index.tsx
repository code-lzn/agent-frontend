import { nowShowing, recommended } from '@/api/filmController';
import { history } from '@umijs/max';
import { Spin } from 'antd';
import React, { useEffect, useState } from 'react';
import type { Film } from '@/api/typings';
import styles from './index.less';

const HomePage: React.FC = () => {
  const [hotFilms, setHotFilms] = useState<Film[]>([]);
  const [recFilms, setRecFilms] = useState<Film[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([nowShowing({ limit: 8 }), recommended({ limit: 4 })])
      .then(([hotRes, recRes]) => {
        const hotData = hotRes?.data;
        const recData = recRes?.data;
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
    <div key={film.id} className={styles['movie-card']} onClick={() => history.push(`/film/${film.id}`)}>
      <div className={styles.poster}>
        {film.posterUrl ? (
          <img src={film.posterUrl} alt={film.name} />
        ) : (
          getTypeEmoji(film.type)
        )}
        {film.rating && (
          <div className={styles.score}>{film.rating.toFixed(1)} <span>分</span></div>
        )}
      </div>
      <div className={styles.info}>
        <div className={styles.title}>{film.name}</div>
        <div className={styles.meta}>{film.type?.split(',')[0]} · {film.duration}min</div>
        <div className={styles.tags}>
          {film.type?.split(',').slice(0, 2).map((t, i) => (
            <span key={t} className={i === 0 ? styles.imax : ''}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '120px 0' }}><Spin size="large" /></div>;
  }

  return (
    <div>
      {/* Hero */}
      <div className={styles['home-hero']}>
        <div className={styles['hero-banner']}>
          <div className={styles['hero-text']}>
            <h1>AI 电影票</h1>
            <p>一句话购票 · 也可以自己慢慢挑</p>
            <div className={styles.chips}>
              <button className={`${styles.chip} ${styles.solid}`} onClick={() => history.push('/ai-chat')}>🤖 问问 AI</button>
              <button className={styles.chip} onClick={() => history.push('/film')}>🔥 热映</button>
              <button className={styles.chip}>🎭 喜剧</button>
              <button className={styles.chip}>💎 IMAX</button>
            </div>
          </div>
          <div className={styles['hero-bg-icon']}>🎬</div>
        </div>
      </div>

      {/* 正在热映 */}
      <div className={styles['section-header']}>
        <h2>正在热映</h2>
        <button className={styles['view-all']} onClick={() => history.push('/film')}>全部 →</button>
      </div>
      <div className={styles['movie-grid']}>
        {hotFilms.slice(0, 8).map(filmCard)}
      </div>
      {hotFilms.length === 0 && (
        <div style={{ textAlign: 'center', padding: 32, color: '#999' }}>暂无热映影片</div>
      )}

      {/* 猜你喜欢 */}
      {recFilms.length > 0 && (
        <>
          <div className={styles['section-header']} style={{ marginTop: 32 }}>
            <h2>猜你喜欢</h2>
          </div>
          <div className={styles['movie-grid']}>
            {recFilms.map(filmCard)}
          </div>
        </>
      )}
    </div>
  );
};

export default HomePage;
