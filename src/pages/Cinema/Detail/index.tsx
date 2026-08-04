import { getInfo7 } from '@/api/cinemaController';
import { listSchedule } from '@/api/scheduleController';
import { listAll2 } from '@/api/filmController';
import { useModel } from '@umijs/max';
import { Button, Card, Empty, Image, Modal, Spin, Tag, Typography, message } from 'antd';
import { EnvironmentOutlined, PhoneOutlined, ClockCircleOutlined } from '@ant-design/icons';
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from '@umijs/max';
import type { Cinema, Film, ScheduleVO } from '@/api/typings';
import './index.css';

const { Text, Title } = Typography;

const CinemaDetailPage: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const cityFromUrl = searchParams.get('city') || '';

  const [cinema, setCinema] = useState<Cinema | null>(null);
  const [schedules, setSchedules] = useState<ScheduleVO[]>([]);
  const [loading, setLoading] = useState(true);

  // 游客点击场次：先弹登录确认框
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [pendingSchedule, setPendingSchedule] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      message.error('缺少影院ID');
      navigate(`/cinema${cityFromUrl ? `?city=${encodeURIComponent(cityFromUrl)}` : ''}`);
      return;
    }

    // ID 保持字符串，避免超长 Snowflake ID 精度丢失
    const cinemaId = id;

    // 加载影院信息
    getInfo7({ id: cinemaId } as any)
      .then((res) => {
        if (res?.data) setCinema(res.data);
        else {
          message.error('影院不存在');
          navigate(`/cinema${cityFromUrl ? `?city=${encodeURIComponent(cityFromUrl)}` : ''}`);
        }
      })
      .catch(() => message.error('加载影院信息失败'));

    // 加载排期：查全部影片（含offline），再逐部查该影院排期
    setLoading(true);
    listAll2()
      .then((res) => {
        const films: Film[] = (res as any)?.data || [];
        if (films.length === 0) {
          setSchedules([]);
          setLoading(false);
          return;
        }
        // 并行请求每部影片在该影院的排期
        return Promise.all(
          films.map((film) =>
            listSchedule({ filmId: film.id!, cinemaId } as any)
              .then((sRes) => (sRes as any)?.data || [])
              .catch((e) => {
                console.error(`[CinemaDetail] 影片${film.name} 排期查询失败:`, e);
                return [];
              }),
          ),
        ).then((results) => {
          // 合并所有排期
          const all: ScheduleVO[] = [];
          results.forEach((arr) => all.push(...arr));
          setSchedules(all);
        });
      })
      .catch(() => message.error('加载排期失败'))
      .finally(() => setLoading(false));
  }, [id]);

  // 按影片分组排期（过滤已过期的场次）
  const filmGroups = useMemo(() => {
    const nowTs = Date.now();
    const validSchedules = schedules.filter((s) => {
      if (!s.showDate || !s.startTime) return true;
      const [y, mo, d] = s.showDate.split('-').map(Number);
      const [hh, mm] = s.startTime.split(':').map(Number);
      return new Date(y, mo - 1, d, hh, mm).getTime() > nowTs;
    });

    const map: Record<number, { filmName: string; filmPoster: string; filmType: string; filmDuration: number; filmRating: number; schedules: ScheduleVO[] }> = {};
    validSchedules.forEach((s) => {
      const fid = s.filmId!;
      if (!map[fid]) {
        map[fid] = {
          filmName: s.filmName || '',
          filmPoster: s.filmPoster || '',
          filmType: s.filmType || '',
          filmDuration: s.filmDuration || 0,
          filmRating: s.filmRating ? Number(s.filmRating) : 0,
          schedules: [],
        };
      }
      map[fid].schedules.push(s);
    });
    return Object.entries(map).map(([fid, g]) => ({ filmId: Number(fid), ...g }));
  }, [schedules]);

  const parseTags = (tags?: string) => {
    if (!tags) return [];
    return tags.split(',').filter(Boolean);
  };

  /** 点击场次：游客先弹登录确认框（scheduleId 为字符串，避免雪花ID精度丢失） */
  const handleShowtimeClick = (scheduleId: string) => {
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

  if (!id) return null;

  return (
    <div className="cinema-detail-page">
      {/* 返回 */}
      <div className="page-back">
        <button className="back-btn" onClick={() => navigate('/cinema')}>←</button>
        <span>返回影院列表</span>
      </div>

      {/* 影院信息卡片 */}
      {cinema && (
        <Card className="cinema-info-card">
          <div className="cinema-info-header">
            <Title level={3} style={{ margin: 0, fontWeight: 700 }}>
              {cinema.name}
            </Title>
            <div className="cinema-tags-row">
              {parseTags(cinema.tags).map((tag) => (
                <Tag key={tag} color="red">{tag}</Tag>
              ))}
            </div>
          </div>
          <div className="cinema-info-details">
            <div className="info-item">
              <EnvironmentOutlined style={{ color: '#999', fontSize: 15 }} />
              <Text>{cinema.address || '暂无地址'}</Text>
            </div>
            {cinema.phone && (
              <div className="info-item">
                <PhoneOutlined style={{ color: '#999', fontSize: 15 }} />
                <a href={`tel:${cinema.phone}`} style={{ color: '#ff4d4f' }}>{cinema.phone}</a>
              </div>
            )}
            {cinema.businessHours && (
              <div className="info-item">
                <ClockCircleOutlined style={{ color: '#999', fontSize: 15 }} />
                <Text>{cinema.businessHours} 营业</Text>
              </div>
            )}
            {cinema.basePrice != null && (
              <div className="info-item">
                <span style={{ fontSize: 15 }}>💰</span>
                <Text>参考价 <span style={{ color: '#ff4d4f', fontWeight: 600 }}>¥{cinema.basePrice}</span> 起</Text>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* 排期列表 */}
      <div className="schedule-section">
        <Title level={4} style={{ fontWeight: 700, marginBottom: 16 }}>
          正在热映
        </Title>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <Spin size="large" />
          </div>
        ) : filmGroups.length === 0 ? (
          <Card><Empty description="暂无排期" style={{ padding: '40px 0' }} /></Card>
        ) : (
          <div className="film-schedule-list">
            {filmGroups.map((group) => (
              <Card key={group.filmId} className="film-schedule-card">
                <div className="film-schedule-body">
                  {/* 影片信息（可点击跳转影片详情） */}
                  <div
                    className="film-info-section"
                    onClick={() => navigate(`/film/${group.filmId}`)}
                  >
                    <Image
                      src={group.filmPoster || ''}
                      width={64}
                      height={90}
                      style={{ borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
                      fallback="https://via.placeholder.com/64x90?text=🎬"
                      preview={false}
                    />
                    <div className="film-info-text">
                      <div className="film-name">{group.filmName}</div>
                      <div className="film-meta">
                        {group.filmType} · {group.filmDuration}分钟
                      </div>
                      {group.filmRating > 0 && (
                        <span className="film-rating-tag">{group.filmRating.toFixed(1)} 分</span>
                      )}
                    </div>
                  </div>

                  {/* 场次列表 */}
                  <div className="schedule-times">
                    {group.schedules.map((s) => (
                      <div
                        key={s.id}
                        className="schedule-item"
                        onClick={() => handleShowtimeClick(String(s.id!))}
                      >
                        <div className="schedule-time">{s.startTime?.substring(0, 5)}</div>
                        <div className="schedule-meta">
                          <span className="schedule-hall">{s.hallName}</span>
                          <span className="schedule-type">{s.hallType}</span>
                        </div>
                        <div className="schedule-price">¥{s.price}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

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

export default CinemaDetailPage;
