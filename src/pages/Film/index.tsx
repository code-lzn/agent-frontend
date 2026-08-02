import { listFilm } from '@/api/filmController';
import { Input, Select, Typography, Empty, Spin } from 'antd';
import React, { useEffect, useState } from 'react';
import { history, useSearchParams } from '@umijs/max';
import type { Film } from '@/api/typings';

const { Text } = Typography;
const { Search } = Input;

const FilmListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const keywordFromUrl = searchParams.get('keyword') || '';

  const [films, setFilms] = useState<Film[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filmType, setFilmType] = useState('');
  const [keyword, setKeyword] = useState(keywordFromUrl);

  useEffect(() => {
    setLoading(true);
    listFilm({
      pageNum: 1, pageSize: 50,
      status: 'published',
      type: filmType || undefined,
      keyword: keyword || undefined,
    } as any)
      .then((res) => {
        if (res?.data) {
          setFilms(res.data.records || []);
          setTotal(res.data.totalRow || 0);
        }
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [filmType, keyword]);

  const getTypeEmoji = (type?: string) => {
    const map: Record<string, string> = {
      科幻: '🌍', 动作: '⚔️', 喜剧: '😄', 动画: '🐉',
      爱情: '💕', 悬疑: '🔍', 奇幻: '🧙',
    };
    return map[type?.split(',')[0] || ''] || '🎬';
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* 筛选栏 - 猫眼风格 */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20,
        padding: '12px 20px', background: '#fff', borderRadius: 8,
        boxShadow: '0 1px 4px rgba(0,0,0,.04)', flexWrap: 'wrap',
      }}>
        <Search
          placeholder="搜影片、搜影院"
          defaultValue={keywordFromUrl}
          onSearch={(v) => { setKeyword(v); setSearchParams(v ? { keyword: v } : {}); }}
          style={{ width: 220 }}
        />
        <div style={{ width: 1, height: 24, background: '#e8e8e8' }} />
        <Select value={filmType} onChange={setFilmType}
          options={[
            { label: '全部类型', value: '' }, { label: '科幻', value: '科幻' },
            { label: '喜剧', value: '喜剧' }, { label: '动作', value: '动作' },
            { label: '动画', value: '动画' }, { label: '爱情', value: '爱情' },
            { label: '悬疑', value: '悬疑' },
          ]}
          style={{ width: 110 }} variant="borderless"
        />
        <span style={{ marginLeft: 'auto', fontSize: '.8125rem', color: '#999' }}>{total} 部影片</span>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}><Spin size="large" /></div>
      ) : films.length === 0 ? (
        <Empty description="暂无影片" style={{ padding: '60px 0' }} />
      ) : (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16,
        }}>
          {films.map((film) => (
            <div key={film.id}
              onClick={() => history.push(`/film/${film.id}`)}
              style={{
                background: '#fff', borderRadius: 8, overflow: 'hidden',
                cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,.04)',
                transition: 'all .2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,.08)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,.04)';
                e.currentTarget.style.transform = '';
              }}
            >
              <div style={{
                width: '100%', aspectRatio: '2/3', position: 'relative',
                background: 'linear-gradient(135deg, #2D2D5E, #1A1A3A)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '3rem', overflow: 'hidden',
              }}>
                {film.posterUrl ? (
                  <img src={film.posterUrl} alt={film.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : getTypeEmoji(film.type)}
                {film.rating && (
                  <span style={{
                    position: 'absolute', bottom: 8, left: 12,
                    fontWeight: 700, fontSize: '1.125rem', color: '#FFAA00',
                    textShadow: '0 1px 4px rgba(0,0,0,.5)',
                  }}>
                    {film.rating.toFixed(1)} <span style={{ fontSize: '.75rem', fontWeight: 400 }}>分</span>
                  </span>
                )}
              </div>
              <div style={{ padding: '12px 14px 14px' }}>
                <div style={{ fontWeight: 600, fontSize: '.9375rem', marginBottom: 4,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {film.name}
                </div>
                <div style={{ fontSize: '.75rem', color: '#999' }}>
                  {film.type?.split(',')[0]} · {film.duration}min
                </div>
                <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                  {film.type?.split(',').slice(0, 2).map((t, i) => (
                    <span key={t} style={{
                      fontSize: '.6875rem', padding: '2px 8px', borderRadius: 3,
                      border: i === 0 ? '1px solid #FF4D4F' : '1px solid #e8e8e8',
                      color: i === 0 ? '#FF4D4F' : '#666',
                      background: i === 0 ? '#FFF1F0' : 'transparent',
                    }}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FilmListPage;
