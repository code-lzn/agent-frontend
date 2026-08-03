import { getSeatMap } from '@/api/seatController';
import { createOrder, payOrder } from '@/api/orderController';
import { getFilm } from '@/api/filmController';
import { getInfo3 as getSchedule } from '@/api/scheduleController';
import { getInfo7 as getCinema } from '@/api/cinemaController';
import { Button, Card, Col, Descriptions, Divider, message, Row, Spin, Statistic, Tag, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from '@umijs/max';
import type { OrderVO, SeatMapVO, Film, Schedule } from '@/api/typings';

const { Text, Title } = Typography;

const OrderConfirmPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const scheduleId = searchParams.get('scheduleId') || '';
  const seatIds = (searchParams.get('seatIds') || '').split(',').filter(Boolean);

  const [seatMap, setSeatMap] = useState<SeatMapVO | null>(null);
  const [film, setFilm] = useState<Film | null>(null);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [cinemaName, setCinemaName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState<OrderVO | null>(null);

  useEffect(() => {
    if (!scheduleId || seatIds.length === 0) {
      message.error('参数无效');
      navigate('/film');
      return;
    }
    setLoading(true);
    // 并行加载所有需要的数据
    Promise.all([
      getSeatMap({ scheduleId }),
      getSchedule({ id: scheduleId }).catch(() => null as any),
    ])
      .then(([seatMapRes, scheduleRes]) => {
        if (seatMapRes?.data) setSeatMap(seatMapRes.data);
        const schedData = scheduleRes?.data;
        if (schedData) {
          setSchedule(schedData);
          // 获取影片信息
          if (schedData.filmId) {
            getFilm({ id: schedData.filmId })
              .then((res) => {
                if (res?.data) setFilm(res.data);
              })
              .catch(() => {});
          }
          // 获取影院名称
          if (schedData.cinemaId) {
            getCinema({ id: schedData.cinemaId })
              .then((res: any) => {
                if (res?.data?.name) setCinemaName(res.data.name);
                else if (res?.name) setCinemaName(res.name);
              })
              .catch(() => {});
          }
        }
      })
      .catch(() => message.error('加载信息失败'))
      .finally(() => setLoading(false));
  }, [scheduleId]);

  // 找到选中的座位信息（用字符串比较，兼容后端 Long → JSON string 的情况）
  const seatIdSet = new Set(seatIds.map(String));
  const selectedSeats = seatMap?.seats?.filter((s) => s.id != null && seatIdSet.has(String(s.id))) || [];

  // 计算价格
  const vipCount = selectedSeats.filter((s) => s.zone === 'vip').length;
  const regularCount = selectedSeats.length - vipCount;
  const vipTotal = (seatMap?.vipPrice || 0) * vipCount;
  const regularTotal = (seatMap?.price || 0) * regularCount;
  const totalPrice = vipTotal + regularTotal;

  const handleCreateOrder = async () => {
    setSubmitting(true);
    try {
      const res = await createOrder({ scheduleId, seatIds });
      if (res.data) {
        setOrder(res.data);
        message.success('订单创建成功');
      }
    } catch (e: any) {
      message.error('创建订单失败：' + (e.message || ''));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePay = async () => {
    if (!order?.id) return;
    setSubmitting(true);
    try {
      const res = await payOrder({ orderId: order.id });
      if (res.data?.payForm) {
        const div = document.createElement('div');
        div.innerHTML = res.data.payForm;
        document.body.appendChild(div);
        const form = div.querySelector('form');
        if (form) {
          form.submit();
        }
      }
    } catch (e: any) {
      message.error('支付失败：' + (e.message || ''));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  // 构建场次描述
  const scheduleDesc = schedule
    ? `${schedule.showDate || ''} ${schedule.startTime || ''}`
    : `场次 ID: ${scheduleId}`;

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
        <span style={{ fontSize: '.8125rem', color: '#999' }}>返回选座</span>
      </div>

      <Row gutter={24}>
        <Col xs={24} lg={16}>
          <Card title="确认订单信息">
            <Descriptions column={1} size="small" labelStyle={{ color: '#999', width: 60 }}>
              <Descriptions.Item label="影片">
                <Text strong>{film?.name || '加载中...'}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="影院">
                {cinemaName || (schedule?.cinemaId ? `影院ID: ${schedule.cinemaId}` : '-')}
              </Descriptions.Item>
              <Descriptions.Item label="影厅">
                {seatMap?.hallName} ({seatMap?.hallType}厅)
              </Descriptions.Item>
              <Descriptions.Item label="场次">{scheduleDesc}</Descriptions.Item>
              <Descriptions.Item label="座位">
                {selectedSeats.map((s) => (
                  <Tag key={s.id} color="blue" style={{ marginBottom: 2 }}>
                    {s.seatLabel}
                    {s.zone === 'vip' ? '(VIP)' : ''}
                  </Tag>
                ))}
              </Descriptions.Item>
              <Descriptions.Item label="数量">
                <Text strong>{selectedSeats.length}</Text> 张
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Title level={5}>价格明细</Title>
            {regularCount > 0 && (
              <Row justify="space-between" style={{ marginBottom: 8 }}>
                <Col>普通区 × {regularCount}</Col>
                <Col>¥{(seatMap?.price || 0).toFixed(2)}</Col>
              </Row>
            )}
            {vipCount > 0 && (
              <Row justify="space-between" style={{ marginBottom: 8 }}>
                <Col>VIP区 × {vipCount}</Col>
                <Col>¥{(seatMap?.vipPrice || 0).toFixed(2)}</Col>
              </Row>
            )}
            <Divider />
            <Row justify="space-between">
              <Col>
                <Text strong style={{ fontSize: 16 }}>
                  合计：
                </Text>
              </Col>
              <Col>
                <Text strong style={{ color: '#FF4D4F', fontSize: 24 }}>
                  ¥{totalPrice.toFixed(2)}
                </Text>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card>
            {!order ? (
              <div style={{ textAlign: 'center' }}>
                <Statistic title="应付金额" value={totalPrice} precision={2} prefix="¥" />
                <Divider />
                <Button
                  type="primary"
                  size="large"
                  block
                  loading={submitting}
                  onClick={handleCreateOrder}
                  style={{ borderRadius: 8 }}
                >
                  确认下单
                </Button>
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    请在15分钟内完成支付，超时订单将自动取消
                  </Text>
                </div>
              </div>
            ) : order.status === 'pending' ? (
              <div style={{ textAlign: 'center' }}>
                <Statistic title="待支付" value={totalPrice} precision={2} prefix="¥" />
                <Tag color="orange" style={{ marginTop: 8 }}>
                  订单号：{order.orderNo}
                </Tag>
                <Divider />
                <Button
                  type="primary"
                  size="large"
                  block
                  loading={submitting}
                  onClick={handlePay}
                  style={{ borderRadius: 8 }}
                >
                  去支付（支付宝沙箱）
                </Button>
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    测试环境直接支付成功
                  </Text>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <Statistic
                  title="支付状态"
                  value={
                    order.status === 'paid'
                      ? '支付成功'
                      : order.status === 'cancelled'
                      ? '已取消'
                      : order.status
                  }
                  valueStyle={{
                    color: order.status === 'paid' ? '#52c41a' : '#e53e3e',
                  }}
                />
                <Divider />
                <Button
                  type="primary"
                  block
                  onClick={() => navigate(`/order/${order.id}`)}
                  style={{ borderRadius: 8 }}
                >
                  查看订单详情
                </Button>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default OrderConfirmPage;
