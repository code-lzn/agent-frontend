import { listOrders, cancelOrder, payOrder, refundOrder } from '@/api/orderController';
import { Badge, Button, Card, Col, Empty, Row, Segmented, Spin, Tag, Typography, message, Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import React, { useEffect, useState } from 'react';
import { history } from '@umijs/max';
import type { OrderVO } from '@/api/typings';

const { Text } = Typography;
const { confirm } = Modal;

const statusMap: Record<string, { color: string; text: string }> = {
  pending: { color: 'orange', text: '待支付' },
  paid: { color: 'green', text: '已支付' },
  cancelled: { color: 'default', text: '已取消' },
  completed: { color: 'blue', text: '已完成' },
  refunded: { color: 'red', text: '已退款' },
};

const statusTabs = [
  { label: '全部', value: '' },
  { label: '待支付', value: 'pending' },
  { label: '已支付', value: 'paid' },
  { label: '已退款', value: 'refunded' },
  { label: '已取消', value: 'cancelled' },
];

const OrderListPage: React.FC = () => {
  const [orders, setOrders] = useState<OrderVO[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');

  const loadOrders = async (pageNum = 1, status?: string) => {
    setLoading(true);
    try {
      const res = await listOrders({
        pageNum,
        pageSize: 10,
        status: status || undefined,
      });
      if (res.data) {
        setOrders(res.data.records || []);
        setTotal(res.data.totalRow || 0);
        setPage(pageNum);
      }
    } catch (e: any) {
      message.error(e?.message || '加载订单失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders(1, statusFilter);
  }, [statusFilter]);

  const handleCancelOrder = (orderId: number | string) => {
    confirm({
      title: '确认取消订单？',
      icon: <ExclamationCircleOutlined />,
      content: '取消后不可恢复，请确认',
      okText: '确认取消',
      cancelText: '我再想想',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await cancelOrder({ id: orderId as any });
          message.success('订单已取消');
          loadOrders(page, statusFilter);
        } catch (e: any) {
          message.error('取消失败：' + (e?.message || ''));
        }
      },
    });
  };

  const handleStatusChange = (value: string | number) => {
    setStatusFilter(value as string);
  };

  const handlePay = async (orderId: number | string) => {
    try {
      const res = await payOrder({ orderId: orderId as any });
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
      message.error('支付失败：' + (e?.message || ''));
    }
  };

  const handleRefundOrder = (orderId: number | string, totalPrice?: number) => {
    confirm({
      title: '确认退款？',
      icon: <ExclamationCircleOutlined />,
      content: `确定要申请退款吗？退款金额 ¥${Number(totalPrice || 0).toFixed(2)} 将原路返回。`,
      okText: '确认退款',
      cancelText: '我再想想',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await refundOrder({ id: orderId as any });
          message.success('退款申请已提交，退款将原路返回');
          loadOrders(page, statusFilter);
        } catch (e: any) {
          message.error('退款失败：' + (e?.message || ''));
        }
      },
    });
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <Segmented
          options={statusTabs}
          value={statusFilter}
          onChange={handleStatusChange}
        />
      </div>

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
                  bodyStyle={{ padding: '16px 20px' }}
                >
                  <Row justify="space-between" align="middle">
                    <Col flex="auto">
                      <Text strong style={{ fontSize: 16 }}>
                        {order.filmName}
                      </Text>
                      <div style={{ marginTop: 4 }}>
                        <Text type="secondary" style={{ fontSize: 13 }}>
                          {order.cinemaName} · {order.hallName}
                        </Text>
                      </div>
                      <div style={{ marginTop: 4 }}>
                        <Text type="secondary" style={{ fontSize: 13 }}>
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
                    <Col style={{ textAlign: 'right', minWidth: 120 }}>
                      <Tag color={st.color} style={{ marginBottom: 8 }}>
                        {st.text}
                      </Tag>
                      <div>
                        <Text strong style={{ color: '#e53e3e', fontSize: 20 }}>
                          ¥{order.totalPrice?.toFixed(2)}
                        </Text>
                      </div>
                      <div style={{ marginTop: 2 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {order.count}张
                        </Text>
                      </div>
                      {order.status === 'pending' && (
                        <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                          <Button
                            type="primary"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePay(order.id!);
                            }}
                            style={{ background: '#e53e3e', borderColor: '#e53e3e', borderRadius: 6 }}
                          >
                            去支付
                          </Button>
                          <Button
                            type="link"
                            danger
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelOrder(order.id!);
                            }}
                          >
                            取消
                          </Button>
                        </div>
                      )}
                      {order.status === 'paid' && (
                        <div style={{ marginTop: 8 }}>
                          <Button
                            type="link"
                            danger
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRefundOrder(order.id!, order.totalPrice);
                            }}
                          >
                            申请退款
                          </Button>
                        </div>
                      )}
                    </Col>
                  </Row>
                </Card>
              </Col>
            );
          })}
          {total > 10 && (
            <Col span={24} style={{ textAlign: 'center', marginTop: 16 }}>
              <Button
                loading={loading}
                onClick={() => loadOrders(page + 1, statusFilter)}
              >
                加载更多
              </Button>
            </Col>
          )}
        </Row>
      )}
    </div>
  );
};

export default OrderListPage;
