import { listSchedule } from '@/api/scheduleController';
import { getFilm } from '@/api/filmController';
import { Image, Radio, Spin, Typography, message, Empty } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from '@umijs/max';
import type { Film, ScheduleVO } from '@/api/typings';

const { Text } = Typography;

const SchedulePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const filmId = searchParams.get('filmId') || '';

  const [film, setFilm] = useState<Film | null>(null);
  const [schedules, setSchedules] = useState<ScheduleVO[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const dateOptions = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const days = ['今天', '明天'];
    const weeks = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return {
      label: i < 2 ? days[i] : weeks[d.getDay()],
      value: d.toISOString().split('T')[0],
    };
  });
  const [selDate, setSelDate] = useState(dateOptions[0].value);

  useEffect(() => {
    if (!filmId) { navigate('/film'); return; }
    getFilm({ id: filmId }).then((res) => { if (res?.data) setFilm(res.data); });
  }, [filmId]);

  useEffect(() => {
    if (!filmId) return;
    setLoading(true);
    listSchedule({ filmId, showDate: selDate })
      .then((res) => setSchedules(res?.data || []))
      .catch(() => message.error('加载排期失败'))
      .finally(() => setLoading(false));
  }, [filmId, selDate]);

  const groups: Record<number, { name: string; address: string; schedules: ScheduleVO[] }> = {};
  schedules.forEach((s) => {
    if (!groups[s.cinemaId!]) groups[s.cinemaId!] = { name: s.cinemaName || '', address: s.cinemaAddress || '', schedules: [] };
    groups[s.cinemaId!].schedules.push(s);
  });

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 0 16px' }}>
        <button onClick={() => navigate(`/film/${filmId}`)} style={{
          width: 32, height: 32, borderRadius: '50%', background: '#f5f5f5',
          border: 'none', color: '#666', cursor: 'pointer', fontSize: '1rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>←</button>
        <span style={{ fontSize: '.8125rem', color: '#999' }}>返回影片详情</span>
      </div>

      {film && (
        <div style={{ display: 'flex', gap: 12, padding: 16, background: '#fff', borderRadius: 8, marginBottom: 16, border: '1px solid #f0f0f0' }}>
          <Image src={film.posterUrl || ''} width={56} style={{ borderRadius: 4, objectFit: 'cover' }} fallback="https://via.placeholder.com/56x78?text=🎬" preview={false} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 17 }}>{film.name}</div>
            <Text type="secondary" style={{ fontSize: 13 }}>{film.type} · {film.duration}分钟</Text>
            <div style={{ marginTop: 4 }}>
              <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 3, background: '#e6f4ff', color: '#1677ff' }}>
                {film.rating?.toFixed(1)} 分
              </span>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <Radio.Group value={selDate} onChange={(e) => setSelDate(e.target.value)} buttonStyle="solid" size="small">
          {dateOptions.map((d) => (
            <Radio.Button key={d.value} value={d.value}
              style={{ borderRadius: 20, marginRight: 8, border: '1px solid #e8e8e8', padding: '4px 14px' }}>
              {d.label}
            </Radio.Button>
          ))}
        </Radio.Group>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
      ) : Object.keys(groups).length === 0 ? (
        <Empty description="该日期暂无排期" />
      ) : (
        Object.entries(groups).map(([cid, g]) => (
          <div key={cid} style={{ background: '#fff', borderRadius: 8, padding: '16px 20px', marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #f0f0f0' }}>
              <span style={{ fontWeight: 600, fontSize: '.9375rem' }}>{g.name}</span>
              {g.address && <Text type="secondary" style={{ fontSize: '.75rem' }}>📍 {g.address}</Text>}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {g.schedules.map((s) => (
                <div key={s.id}
                  onClick={() => navigate(`/seat?scheduleId=${s.id}`)}
                  style={{
                    padding: '8px 18px', borderRadius: 6, border: '1px solid #e8e8e8',
                    background: '#fafafa', textAlign: 'center', cursor: 'pointer',
                    transition: 'all .15s', minWidth: 100, fontFamily: 'inherit',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#FF4D4F'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e8e8e8'; }}
                >
                  <div style={{ fontWeight: 600, fontSize: '1rem' }}>{s.startTime?.substring(0, 5)}</div>
                  <div style={{ fontSize: '.8125rem', color: '#FF4D4F', marginTop: 2 }}>¥{s.price}</div>
                  <div style={{ fontSize: '.625rem', color: '#999', marginTop: 2 }}>{s.hallName}</div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default SchedulePage;
