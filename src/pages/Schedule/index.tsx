import { listSchedule } from '@/api/scheduleController';
import { getFilm } from '@/api/filmController';
import { useModel } from '@umijs/max';
import { Button, Card, Empty, Image, Modal, Radio, Spin, Typography, message } from 'antd';
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from '@umijs/max';
import type { Film, ScheduleVO } from '@/api/typings';
import './index.css';

const { Text } = Typography;

const SchedulePage: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const filmId = Number(searchParams.get('filmId'));

  // 游客点击场次：先弹登录确认框
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [pendingSchedule, setPendingSchedule] = useState<number | null>(null);

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
    getFilm({ id: filmId }).then((res) => { if ((res as any)?.data) setFilm((res as any)?.data); });
  }, [filmId]);

  useEffect(() => {
    if (!filmId) return;
    setLoading(true);
    listSchedule({ filmId, showDate: selDate })
      .then((res) => setSchedules((res as any)?.data || []))
      .catch(() => message.error('加载排期失败'))
      .finally(() => setLoading(false));
  }, [filmId, selDate]);

  const groups: Record<number, { name: string; address: string; schedules: ScheduleVO[] }> = {};
  schedules.forEach((s) => {
    if (!groups[s.cinemaId!]) {
      groups[s.cinemaId!] = { name: s.cinemaName || '', address: s.cinemaAddress || '', schedules: [] };
    }
    groups[s.cinemaId!].schedules.push(s);
  });

  /** 点击场次：游客先弹登录确认框，登录后回到选座 */
  const handleShowtimeClick = (scheduleId: number) => {
    if (!currentUser) {
      setPendingSchedule(scheduleId);
      setLoginModalOpen(true);
      return;
    }
    navigate(`/seat?scheduleId=${scheduleId}`);
  };

  const handleGoLogin = () => {
    setLoginModalOpen(false);
    if (pendingSchedule != null) {
      navigate(`/user/login?redirect=${encodeURIComponent(`/seat?scheduleId=${pendingSchedule}`)}`);
    }
  };

  return (
    <div className="schedule-page">
      <div className="page-back">
        <button className="back-btn" onClick={() => navigate(`/film/${filmId}`)}>←</button>
        <span>返回影片详情</span>
      </div>

      {film && (
        <Card className="film-info-card">
          <div className="film-info-row">
            <Image
              src={film.posterUrl || ''}
              width={56}
              height={78}
              style={{ borderRadius: 6, objectFit: 'cover' }}
              fallback="https://via.placeholder.com/56x78?text=🎬"
              preview={false}
            />
            <div>
              <div className="film-name">{film.name}</div>
              <Text type="secondary" style={{ fontSize: 13 }}>{film.type} · {film.duration}分钟</Text>
              <div style={{ marginTop: 6 }}>
                <span className="film-rating-badge">{film.rating?.toFixed(1)} 分</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card className="date-card">
        <Radio.Group value={selDate} onChange={(e) => setSelDate(e.target.value)} size="middle">
          {dateOptions.map((d) => (
            <Radio.Button key={d.value} value={d.value}>
              {d.label}
            </Radio.Button>
          ))}
        </Radio.Group>
      </Card>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Spin size="large" />
        </div>
      ) : Object.keys(groups).length === 0 ? (
        <Card><Empty description="该日期暂无排期" /></Card>
      ) : (
        Object.entries(groups).map(([cid, g]) => (
          <Card key={cid} className="cinema-card">
            <div className="cinema-header">
              <span className="cinema-name">{g.name}</span>
              {g.address && <Text type="secondary" className="cinema-address">📍 {g.address}</Text>}
            </div>
            <div className="schedule-list">
              {g.schedules.map((s) => (
                <div
                  key={s.id}
                  className="schedule-item"
                  onClick={() => handleShowtimeClick(s.id!)}
                >
                  <div className="schedule-time">{s.startTime?.substring(0, 5)}</div>
                  <div className="schedule-price">¥{s.price}</div>
                  <div className="schedule-hall">{s.hallName}</div>
                </div>
              ))}
            </div>
          </Card>
        ))
      )}

      {/* 游客点击场次：登录确认弹窗 */}
      <Modal
        open={loginModalOpen}
        onCancel={() => setLoginModalOpen(false)}
        footer={null}
        width={360}
      >
        <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
          <div style={{ fontSize: 17, fontWeight: 600, color: '#303133', marginBottom: 8 }}>
            需要先登录
          </div>
          <div style={{ fontSize: 14, color: '#909399', marginBottom: 24 }}>
            选座购票需要先登录，登录后将继续刚才的选座
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Button onClick={() => setLoginModalOpen(false)}>暂不登录</Button>
            <Button type="primary" onClick={handleGoLogin}>去登录</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SchedulePage;
