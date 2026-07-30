import { listOrders } from '@/api/orderController';
import { PageContainer } from '@ant-design/pro-components';
import { Button, Card, Col, Empty, Row, Spin, Tag, Typography, message } from 'antd';
import React, { useEffect, useState } from 'react';
import { history } from '@umijs/max';
import type { OrderVO } from '@/api/typings';

const { Text } = Typography;

const statusMap: Record<string, { color: string; text: string }> = {
  pending: { color: 'orange', text: '待支付' },
  paid: { color: 'green', text: '已支付' },
  cancelled: { color: 'default', text: '已取消' },
  completed: { color: 'blue', text: '已完成' },
};

const OrderListPage: React.FC = () => {
  const [orders, setOrders] = useState<OrderVO[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const loadOrders = async (pageNum = 1) => {
    setLoading(true);
    try {
      const res = await listOrders({ pageNum, pageSize: 10 });
      if (res.data) {
        setOrders(res.data.records || []);
        setTotal(res.data.total || 0);
        setPage(pageNum);
      }
    } catch (e: any) {
      message.error('加载订单失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  return (
    <PageContainer header={{ title: '我的订单' }}>
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Spin size="large" />
        </div>
      ) : orders.length === 0 ? (
        <Empty description="暂无订单">
          <Button type="primary" onClick={() => history.push('/film')}>
            去购票
          </Button>
        </Empty>
      ) : (
        <Row gutter={[0, 12]}>
          {orders.map((order) => {
            const st = statusMap[order.status!] || { color: 'default', text: order.status };
            return (
              <Col span={24} key={order.id}>
                <Card
                  hoverable
                  onClick={() => history.push(`/order/${order.id}`)}
                >
                  <Row justify="space-between" align="middle">
                    <Col>
                      <Text strong style={{ fontSize: 16 }}>
                        {order.filmName}
                      </Text>
                      <div style={{ marginTop: 4 }}>
                        <Text type="secondary">{order.cinemaName}</Text>
                        <Text type="secondary" style={{ marginLeft: 8 }}>
                          {order.scheduleTime}
                        </Text>
                      </div>
                      <div style={{ marginTop: 4 }}>
                        {order.seatLabels?.map((label) => (
                          <Tag key={label} style={{ marginBottom: 2 }}>
                            {label}
                          </Tag>
                        ))}
                      </div>
                    </Col>
                    <Col style={{ textAlign: 'right' }}>
                      <Tag color={st.color}>{st.text}</Tag>
                      <div style={{ marginTop: 4 }}>
                        <Text strong style={{ color: '#ff4d4f', fontSize: 18 }}>
                          ¥{order.totalPrice?.toFixed(2)}
                        </Text>
                      </div>
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {order.count}张
                        </Text>
                      </div>
                    </Col>
                  </Row>
                </Card>
              </Col>
            );
          })}
          {total > 10 && (
            <Col span={24} style={{ textAlign: 'center' }}>
              <Button
                loading={loading}
                onClick={() => loadOrders(page + 1)}
              >
                加载更多
              </Button>
            </Col>
          )}
        </Row>
      )}
    </PageContainer>
  );
};

export default OrderListPage;
