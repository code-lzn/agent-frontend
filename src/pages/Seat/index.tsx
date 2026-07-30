import { getSeatMap } from '@/api/seatController';
import { PageContainer } from '@ant-design/pro-components';
import { Button, Card, Col, Divider, message, Row, Spin, Tag, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from '@umijs/max';
import type { Seat, SeatMapVO } from '@/api/typings';

const { Text, Title } = Typography;

const SeatPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const scheduleId = Number(searchParams.get('scheduleId'));

  const [seatMap, setSeatMap] = useState<SeatMapVO | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);

  useEffect(() => {
    if (!scheduleId || isNaN(scheduleId)) {
      message.error('缺少场次ID');
      navigate('/film');
      return;
    }
    setLoading(true);
    getSeatMap({ scheduleId })
      .then((res) => {
        if (res.data) setSeatMap(res.data);
        else message.error('座位信息不存在');
      })
      .catch(() => message.error('加载座位失败'))
      .finally(() => setLoading(false));
  }, [scheduleId]);

  const handleSeatClick = (seat: Seat) => {
    if (seat.status !== 'available') return;
    setSelectedSeats((prev) => {
      const exists = prev.find((s) => s.id === seat.id);
      if (exists) {
        return prev.filter((s) => s.id !== seat.id);
      }
      return [...prev, seat];
    });
  };

  const getSeatColor = (seat: Seat) => {
    if (seat.status === 'sold' || seat.status === 'locked') return '#d9d9d9';
    if (selectedSeats.find((s) => s.id === seat.id)) return '#1677ff';
    return seat.zone === 'vip' ? '#f6ffed' : '#fff';
  };

  const getSeatBorder = (seat: Seat) => {
    if (seat.status === 'sold' || seat.status === 'locked') return '1px solid #bbb';
    if (selectedSeats.find((s) => s.id === seat.id)) return '2px solid #1677ff';
    return seat.zone === 'vip' ? '1px solid #52c41a' : '1px solid #d9d9d9';
  };

  // 计算总价
  const totalPrice = selectedSeats.reduce((sum, seat) => {
    const price = seat.zone === 'vip' && seatMap?.vipPrice ? seatMap.vipPrice : seatMap?.price || 0;
    return sum + price;
  }, 0);

  if (loading) {
    return (
      <PageContainer>
        <div style={{ textAlign: 'center', padding: 80 }}>
          <Spin size="large" />
        </div>
      </PageContainer>
    );
  }

  if (!seatMap) return null;

  const seatsByRow: Record<number, Seat[]> = {};
  seatMap.seats?.forEach((seat) => {
    if (!seatsByRow[seat.rowNum!]) seatsByRow[seat.rowNum!] = [];
    seatsByRow[seat.rowNum!].push(seat);
  });

  return (
    <PageContainer>
      <Card>
        {/* 影厅信息 */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <Title level={4} style={{ margin: 0 }}>
            {seatMap.hallName}
          </Title>
          <Text type="secondary">
            {seatMap.hallType}厅 · {seatMap.rowCount}排{seatMap.colCount}座
          </Text>
        </div>

        {/* 屏幕 */}
        <div
          style={{
            width: '60%',
            height: 8,
            background: '#d9d9d9',
            borderRadius: '4px 4px 0 0',
            margin: '0 auto 24px',
            textAlign: 'center',
          }}
        >
          <Text type="secondary" style={{ fontSize: 12, position: 'relative', top: -16 }}>
            银幕
          </Text>
        </div>

        {/* 座位图 */}
        <div style={{ overflowX: 'auto', padding: '0 16px' }}>
          {Object.entries(seatsByRow).map(([rowNum, rowSeats]) => (
            <Row
              key={rowNum}
              justify="center"
              gutter={[6, 6]}
              style={{ marginBottom: 4 }}
            >
              <Col flex="30px">
                <Text type="secondary" style={{ fontSize: 12, lineHeight: '32px' }}>
                  {rowNum}排
                </Text>
              </Col>
              {rowSeats
                .sort((a, b) => (a.colNum || 0) - (b.colNum || 0))
                .map((seat) => {
                  const isDisabled = seat.status === 'sold' || seat.status === 'locked';
                  return (
                    <Col key={seat.id}>
                      <div
                        onClick={() => handleSeatClick(seat)}
                        style={{
                          width: 28,
                          height: 28,
                          background: getSeatColor(seat),
                          border: getSeatBorder(seat),
                          borderRadius: 4,
                          cursor: isDisabled ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 10,
                          color: isDisabled ? '#bbb' : '#666',
                          transition: 'all 0.2s',
                        }}
                        title={seat.seatLabel}
                      >
                        {seat.colNum}
                      </div>
                    </Col>
                  );
                })}
              <Col flex="30px" />
            </Row>
          ))}
        </div>

        {/* 图例 */}
        <Divider />
        <Row justify="center" gutter={24}>
          <Col>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 20, height: 20, background: '#fff', border: '1px solid #d9d9d9', borderRadius: 3 }} />
              <Text style={{ fontSize: 12 }}>可选</Text>
            </div>
          </Col>
          <Col>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 20, height: 20, background: '#1677ff', border: '2px solid #1677ff', borderRadius: 3 }} />
              <Text style={{ fontSize: 12 }}>已选</Text>
            </div>
          </Col>
          <Col>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 20, height: 20, background: '#d9d9d9', border: '1px solid #bbb', borderRadius: 3 }} />
              <Text style={{ fontSize: 12 }}>已售/锁定</Text>
            </div>
          </Col>
          <Col>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 20, height: 20, background: '#f6ffed', border: '1px solid #52c41a', borderRadius: 3 }} />
              <Text style={{ fontSize: 12 }}>VIP区</Text>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 底部操作栏 */}
      <Card style={{ marginTop: 16, position: 'sticky', bottom: 0 }}>
        <Row justify="space-between" align="middle">
          <Col>
            {selectedSeats.length > 0 && (
              <div>
                <Text>
                  已选 <Text strong>{selectedSeats.length}</Text> 座：
                </Text>
                {selectedSeats.map((s) => (
                  <Tag key={s.id} color="blue" style={{ margin: '0 2px' }}>
                    {s.seatLabel}
                  </Tag>
                ))}
              </div>
            )}
          </Col>
          <Col>
            <Text style={{ fontSize: 18, marginRight: 16 }}>
              合计：<Text strong style={{ color: '#ff4d4f', fontSize: 24 }}>¥{totalPrice.toFixed(2)}</Text>
            </Text>
            <Button
              type="primary"
              size="large"
              disabled={selectedSeats.length === 0}
              onClick={() => {
                const seatIds = selectedSeats.map((s) => s.id).join(',');
                navigate(`/order/confirm?scheduleId=${scheduleId}&seatIds=${seatIds}`);
              }}
            >
              确认选座
            </Button>
          </Col>
        </Row>
      </Card>
    </PageContainer>
  );
};

export default SeatPage;
