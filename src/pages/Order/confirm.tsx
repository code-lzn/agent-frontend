import { getSeatMap } from '@/api/seatController';
import { createOrder, payOrder } from '@/api/orderController';
import { PageContainer } from '@ant-design/pro-components';
import { Button, Card, Col, Descriptions, Divider, Image, message, Row, Spin, Statistic, Tag, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from '@umijs/max';
import type { OrderVO, SeatMapVO } from '@/api/typings';

const { Text, Title } = Typography;

const OrderConfirmPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const scheduleId = Number(searchParams.get('scheduleId'));
  const seatIds = (searchParams.get('seatIds') || '').split(',').map(Number).filter(Boolean);

  const [seatMap, setSeatMap] = useState<SeatMapVO | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState<OrderVO | null>(null);

  useEffect(() => {
    if (!scheduleId || seatIds.length === 0) {
      message.error('参数无效');
      navigate('/film');
      return;
    }
    getSeatMap({ scheduleId })
      .then((res) => {
        if (res.data) setSeatMap(res.data);
      })
      .catch(() => message.error('加载信息失败'))
      .finally(() => setLoading(false));
  }, [scheduleId]);

  // 找到选中的座位信息
  const selectedSeats = seatMap?.seats?.filter((s) => seatIds.includes(s.id!)) || [];

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
        // 将支付宝表单写入页面并自动提交
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
      <PageContainer>
        <div style={{ textAlign: 'center', padding: 80 }}>
          <Spin size="large" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Row gutter={24}>
        <Col xs={24} lg={16}>
          {/* 订单信息 */}
          <Card title="确认订单信息">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="影片">
                {seatMap ? seatMap.seats?.[0]?.id : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="影厅">
                {seatMap?.hallName} ({seatMap?.hallType}厅)
              </Descriptions.Item>
              <Descriptions.Item label="场次">
                {seatMap ? 'ID: ' + scheduleId : '-'}
              </Descriptions.Item>
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

            {/* 价格明细 */}
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
                <Text strong style={{ color: '#ff4d4f', fontSize: 24 }}>
                  ¥{totalPrice.toFixed(2)}
                </Text>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          {/* 操作区 */}
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
                  value={order.status === 'paid' ? '支付成功' : order.status === 'cancelled' ? '已取消' : order.status}
                  valueStyle={{ color: order.status === 'paid' ? '#52c41a' : '#ff4d4f' }}
                />
                <Divider />
                <Button type="primary" block onClick={() => navigate('/order/list')}>
                  查看订单
                </Button>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
};

export default OrderConfirmPage;
