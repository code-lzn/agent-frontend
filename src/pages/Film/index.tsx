import { listFilm } from '@/api/filmController';
import { Card, Empty, Input, Select, Spin, Typography } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { history, useSearchParams } from '@umijs/max';
import type { Film } from '@/api/typings';
import './index.css';

const { Text } = Typography;
const { Search } = Input;

const FilmListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const keywordFromUrl = searchParams.get('keyword') || '';

  const [films, setFilms] = useState<Film[]>([]);
  const [loading, setLoading] = useState(true);
  const [filmType, setFilmType] = useState('');
  const [keyword, setKeyword] = useState(keywordFromUrl);

  useEffect(() => {
    setLoading(true);
    listFilm({
      pageNum: 1, pageSize: 50,
      type: filmType || undefined,
      keyword: keyword || undefined,
    } as any)
      .then((res) => {
        const data = (res as any)?.data;
        if (data) {
          setFilms(data.records || []);
        }
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [filmType, keyword]);

  const getTypeEmoji = (type?: string) => {
    const map: Record<string, string> = {
      科幻: '🌍', 动作: '⚔️', 喜剧: '😄', 动画: '🐉',
      爱情: '💕', 悬疑: '🔍', 恐怖: '👻', 奇幻: '🧙',
    };
    return map[type?.split(',')[0] || ''] || '🎬';
  };

  const statusLabel = (status?: string) => {
    if (status === 'upcoming') return { text: '待映', className: '' };
    if (status === 'hot') return { text: '热映', className: '' };
    return null;
  };

  return (
    <div className="film-list-page">
      {/* 筛选栏 */}
      <Card className="film-filter-card">
        <div className="film-filter-bar">
          <Search
            placeholder="搜影片、搜影院"
            defaultValue={keywordFromUrl}
            onSearch={(v) => { setKeyword(v); setSearchParams(v ? { keyword: v } : {}); }}
            style={{ width: 260 }}
          />
          <div style={{ width: 1, height: 24, background: '#e8e8e8' }} />
          <Select value={filmType} onChange={setFilmType}
            options={[
              { label: '全部类型', value: '' }, { label: '科幻', value: '科幻' },
              { label: '喜剧', value: '喜剧' }, { label: '动作', value: '动作' },
              { label: '动画', value: '动画' }, { label: '爱情', value: '爱情' },
              { label: '悬疑', value: '悬疑' },
            ]}
            variant="borderless"
          />
          <span className="film-total">{films.length} 部影片</span>
        </div>
      </Card>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <Spin size="large" />
        </div>
      ) : films.length === 0 ? (
        <Card><Empty description="暂无影片" style={{ padding: '40px 0' }} /></Card>
      ) : (
        <div className="film-grid">
          {films.map((film) => {
            const tag = statusLabel(film.status);
            return (
              <div
                key={film.id}
                className="film-card"
                onClick={() => history.push(`/film/${film.id}`)}
              >
                <div className="film-poster">
                  {film.posterUrl ? (
                    <img src={film.posterUrl} alt={film.name} />
                  ) : (
                    getTypeEmoji(film.type)
                  )}
                  {tag && <span className="film-status-tag">{tag.text}</span>}
                  {film.rating && (
                    <span className="film-score">
                      {film.rating.toFixed(1)} <span>分</span>
                    </span>
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
          })}
        </div>
      )}
    </div>
  );
};

export default FilmListPage;
