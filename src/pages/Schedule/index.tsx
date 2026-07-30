import { listSchedule } from '@/api/scheduleController';
import { getFilm } from '@/api/filmController';
import { PageContainer } from '@ant-design/pro-components';
import { Button, Card, Col, Descriptions, Divider, Image, Radio, Row, Spin, Tag, Typography, message, Empty } from 'antd';
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from '@umijs/max';
import type { Film, ScheduleVO } from '@/api/typings';

const { Text, Title } = Typography;

const SchedulePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const filmId = Number(searchParams.get('filmId'));

  const [film, setFilm] = useState<Film | null>(null);
  const [schedules, setSchedules] = useState<ScheduleVO[]>([]);
  const [loading, setLoading] = useState(true);

  // 生成未来7天的日期
  const today = new Date();
  const dateOptions = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return {
      label: i === 0 ? '今天' : `${d.getMonth() + 1}/${d.getDate()}`,
      value: d.toISOString().split('T')[0],
    };
  });
  const [selectedDate, setSelectedDate] = useState(dateOptions[0].value);

  useEffect(() => {
    if (!filmId || isNaN(filmId)) {
      message.error('缺少影片ID');
      navigate('/film');
      return;
    }
    // 加载影片信息
    getFilm({ id: filmId }).then((res) => {
      if (res.data) setFilm(res.data);
    });
  }, [filmId]);

  useEffect(() => {
    if (!filmId || isNaN(filmId)) return;
    setLoading(true);
    listSchedule({ filmId, showDate: selectedDate })
      .then((res) => {
        setSchedules(res.data || []);
      })
      .catch(() => message.error('加载排期失败'))
      .finally(() => setLoading(false));
  }, [filmId, selectedDate]);

  // 按影院分组
  const cinemaGroups = schedules.reduce<Record<number, { name: string; address: string; schedules: ScheduleVO[] }>>(
    (groups, s) => {
      if (!groups[s.cinemaId!]) {
        groups[s.cinemaId!] = { name: s.cinemaName || '', address: s.cinemaAddress || '', schedules: [] };
      }
      groups[s.cinemaId!].schedules.push(s);
      return groups;
    },
    {},
  );

  return (
    <PageContainer>
      {/* 影片信息 */}
      {film && (
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={16} align="middle">
            <Col>
              <Image
                src={film.posterUrl || ''}
                alt={film.name}
                width={80}
                style={{ borderRadius: 4 }}
                fallback="https://via.placeholder.com/80x110?text=No"
              />
            </Col>
            <Col flex="auto">
              <Title level={4} style={{ margin: 0 }}>
                {film.name}
              </Title>
              <Text type="secondary">
                {film.type} / {film.duration}分钟
              </Text>
              <div style={{ marginTop: 4 }}>
                <Tag color="blue">{film.rating?.toFixed(1)} 分</Tag>
                <Tag>{film.releaseDate}</Tag>
              </div>
            </Col>
          </Row>
        </Card>
      )}

      {/* 日期选择 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Radio.Group
          optionType="button"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          options={dateOptions}
        />
      </Card>

      {/* 排期列表 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Spin size="large" />
        </div>
      ) : Object.keys(cinemaGroups).length === 0 ? (
        <Empty description="该日期暂无排期" />
      ) : (
        Object.entries(cinemaGroups).map(([cinemaId, group]) => (
          <Card key={cinemaId} title={group.name} style={{ marginBottom: 12 }}>
            {group.address && (
              <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
                📍 {group.address}
              </Text>
            )}
            <Row gutter={[12, 12]}>
              {group.schedules.map((s) => (
                <Col key={s.id}>
                  <Card
                    size="small"
                    hoverable
                    style={{ width: 160, textAlign: 'center', cursor: 'pointer' }}
                    onClick={() => navigate(`/seat?scheduleId=${s.id}`)}
                  >
                    <Text strong style={{ fontSize: 18, color: '#1890ff' }}>
                      {s.startTime?.substring(0, 5)}
                    </Text>
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {s.endTime?.substring(0, 5)} 散场
                      </Text>
                    </div>
                    <Divider style={{ margin: '8px 0' }} />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {s.hallName}
                    </Text>
                    <div>
                      <Text strong style={{ color: '#ff4d4f', fontSize: 16 }}>
                        ¥{s.price}
                      </Text>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        ))
      )}
    </PageContainer>
  );
};

export default SchedulePage;
