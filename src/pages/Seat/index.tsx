import { getSeatMap } from '@/api/seatController';
import { Button, Col, Divider, message, Row, Spin, Tag, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from '@umijs/max';
import type { Seat, SeatMapVO } from '@/api/typings';

const { Text, Title } = Typography;

const SeatPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const scheduleId = searchParams.get('scheduleId') || '';

  const [seatMap, setSeatMap] = useState<SeatMapVO | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);

  useEffect(() => {
    if (!scheduleId) {
      message.error('缺少场次ID');
      navigate('/film');
      return;
    }
    setLoading(true);
    getSeatMap({ scheduleId })
      .then((res) => {
        if (res?.data) setSeatMap(res.data);
        else message.error('座位信息不存在或场次已失效');
      })
      .catch(() => message.error('加载座位失败，请先登录'))
      .finally(() => setLoading(false));
  }, [scheduleId]);

  const handleSeatClick = (seat: Seat) => {
    if (seat.status !== 'available') return;
    setSelectedSeats((prev) => {
      const exists = prev.find((s) => s.id === seat.id);
      if (exists) return prev.filter((s) => s.id !== seat.id);
      return [...prev, seat];
    });
  };

  const getSeatStyle = (seat: Seat): React.CSSProperties => {
    const isSelected = !!selectedSeats.find((s) => s.id === seat.id);

    if (seat.status === 'sold' || seat.status === 'locked') {
      return {
        background: '#e8e8e8',
        border: '1px solid #ddd',
        cursor: 'not-allowed',
        opacity: 0.6,
      };
    }
    if (isSelected && seat.zone === 'vip') {
      return {
        background: 'linear-gradient(135deg, #ffaa00, #ff8c00)',
        border: '2px solid #e6a800',
        transform: 'scale(1.12)',
        boxShadow: '0 0 10px rgba(255,170,0,.4)',
      };
    }
    if (isSelected) {
      return {
        background: 'linear-gradient(135deg, #e53e3e, #ff4d4f)',
        border: '2px solid #c53030',
        transform: 'scale(1.12)',
        boxShadow: '0 0 10px rgba(229,62,62,.35)',
      };
    }
    if (seat.zone === 'vip') {
      return {
        background: '#fff8e1',
        border: '1px solid #ffe082',
        cursor: 'pointer',
      };
    }
    return {
      background: '#e8f4fd',
      border: '1px solid #b3d9f2',
      cursor: 'pointer',
    };
  };

  const totalPrice = selectedSeats.reduce((sum, seat) => {
    const price = seat.zone === 'vip' && seatMap?.vipPrice ? seatMap.vipPrice : seatMap?.price || 0;
    return sum + price;
  }, 0);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
        <div style={{ color: '#999', marginTop: 12 }}>加载座位图...</div>
      </div>
    );
  }

  if (!seatMap) return null;

  const seatsByRow: Record<number, Seat[]> = {};
  seatMap.seats?.forEach((seat) => {
    if (!seatsByRow[seat.rowNum!]) seatsByRow[seat.rowNum!] = [];
    seatsByRow[seat.rowNum!].push(seat);
  });

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      {/* 返回按钮 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 0 16px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            width: 32, height: 32, borderRadius: '50%', background: '#f5f5f5',
            border: 'none', color: '#666', cursor: 'pointer', fontSize: '1rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          ←
        </button>
        <span style={{ fontSize: '.8125rem', color: '#999' }}>返回选择场次</span>
      </div>

      <Row gutter={24}>
        {/* 座位图 */}
        <Col xs={24} lg={17}>
          <div
            style={{
              background: '#fff',
              borderRadius: 10,
              border: '1px solid #f0f0f0',
              padding: 28,
              textAlign: 'center',
            }}
          >
            <div style={{ marginBottom: 16 }}>
              <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
                {seatMap.hallName}
              </Title>
              <Text type="secondary" style={{ fontSize: 13 }}>
                {seatMap.hallType}厅 · {seatMap.rowCount}排{seatMap.colCount}座
              </Text>
            </div>

            {/* 屏幕 */}
            <div
              style={{
                width: '55%',
                margin: '0 auto 28px',
                height: 6,
                background: 'linear-gradient(90deg, transparent, rgba(255,77,79,.15), transparent)',
                borderRadius: '3px 3px 0 0',
                textAlign: 'center',
                position: 'relative',
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  color: '#FF4D4F',
                  position: 'absolute',
                  top: -20,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  letterSpacing: 6,
                }}
              >
                银 幕
              </Text>
            </div>

            {/* 座位网格 */}
            <div style={{ overflowX: 'auto', padding: '0 8px' }}>
              {Object.entries(seatsByRow).map(([rowNum, rowSeats]) => (
                <div
                  key={rowNum}
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 5,
                    marginBottom: 5,
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      width: 24,
                      textAlign: 'right',
                      fontSize: 11,
                      color: '#999',
                      marginRight: 6,
                    }}
                  >
                    {rowNum}
                  </span>
                  {rowSeats
                    .sort((a, b) => (a.colNum || 0) - (b.colNum || 0))
                    .map((seat) => (
                      <div
                        key={seat.id}
                        onClick={() => handleSeatClick(seat)}
                        title={seat.seatLabel}
                        style={{
                          width: 32,
                          height: 30,
                          borderRadius: '4px 4px 3px 3px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 10,
                          color: '#999',
                          transition: 'all .12s',
                          ...getSeatStyle(seat),
                        }}
                      >
                        {seat.colNum}
                      </div>
                    ))}
                  <span
                    style={{
                      width: 24,
                      textAlign: 'left',
                      fontSize: 11,
                      color: '#999',
                      marginLeft: 6,
                    }}
                  >
                    {rowNum}
                  </span>
                </div>
              ))}
            </div>

            {/* 图例 */}
            <Divider />
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, fontSize: 12 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    width: 16,
                    height: 14,
                    borderRadius: 2,
                    background: '#e8f4fd',
                    border: '1px solid #b3d9f2',
                  }}
                />
                可选
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    width: 16,
                    height: 14,
                    borderRadius: 2,
                    background: '#e53e3e',
                  }}
                />
                已选
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    width: 16,
                    height: 14,
                    borderRadius: 2,
                    background: '#e8e8e8',
                    border: '1px solid #ddd',
                  }}
                />
                已售
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    width: 16,
                    height: 14,
                    borderRadius: 2,
                    background: '#fff8e1',
                    border: '1px solid #ffe082',
                  }}
                />
                VIP
              </span>
            </div>
          </div>
        </Col>

        {/* 选座面板 */}
        <Col xs={24} lg={7}>
          <div
            style={{
              background: '#fff',
              borderRadius: 10,
              border: '1px solid #f0f0f0',
              padding: 22,
              position: 'sticky',
              top: 84,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>
              💺 已选座位
            </div>

            {selectedSeats.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#bbb', fontSize: 13 }}>
                点击座位图选座
                <br />
                <span style={{ fontSize: 11 }}>点几个座位就是几张票</span>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 240, overflowY: 'auto' }}>
                  {selectedSeats.map((s) => (
                    <div
                      key={s.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        background: '#fafafa',
                        borderRadius: 6,
                        fontSize: 13,
                      }}
                    >
                      <span>
                        {s.seatLabel}
                        {s.zone === 'vip' && (
                          <Tag color="gold" style={{ marginLeft: 6, fontSize: 10, padding: '0 4px' }}>
                            VIP
                          </Tag>
                        )}
                      </span>
                      <span
                        style={{ color: '#999', cursor: 'pointer', fontSize: 16 }}
                        onClick={() =>
                          setSelectedSeats((prev) => prev.filter((x) => x.id !== s.id))
                        }
                      >
                        ×
                      </span>
                    </div>
                  ))}
                </div>

                <Divider style={{ margin: '14px 0' }} />

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 16,
                  }}
                >
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    {selectedSeats.length} 张
                  </Text>
                  <Text strong style={{ fontSize: 24, color: '#FF4D4F' }}>
                    ¥{totalPrice.toFixed(2)}
                  </Text>
                </div>

                <Button
                  type="primary"
                  size="large"
                  block
                  onClick={() => {
                    const seatIdStr = selectedSeats.map((s) => s.id).join(',');
                    navigate(`/order/confirm?scheduleId=${scheduleId}&seatIds=${seatIdStr}`);
                  }}
                  style={{
                    borderRadius: 8,
                    height: 46,
                    fontWeight: 600,
                    fontSize: 15,
                  }}
                >
                  确认选座
                </Button>

                <Button
                  block
                  onClick={() => setSelectedSeats([])}
                  style={{ marginTop: 8, borderRadius: 8, height: 40 }}
                >
                  清空重选
                </Button>
              </>
            )}
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default SeatPage;
