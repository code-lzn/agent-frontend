import { getOrderDetail, payOrder, refundOrder } from '@/api/orderController';
import { PageContainer } from '@ant-design/pro-components';
import { Button, Card, Descriptions, Divider, Modal, Spin, Statistic, Tag, message } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import React, { useEffect, useState } from 'react';
import { history, useParams } from '@umijs/max';
import type { OrderVO } from '@/api/typings';

const { confirm } = Modal;

const statusMap: Record<string, { color: string; text: string }> = {
  pending: { color: 'orange', text: '待支付' },
  paid: { color: 'green', text: '已支付' },
  cancelled: { color: 'default', text: '已取消' },
  completed: { color: 'blue', text: '已完成' },
  refunded: { color: 'red', text: '已退款' },
};

const OrderDetailPage: React.FC = () => {
  const { id } = useParams();
  const [order, setOrder] = useState<OrderVO | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [refunding, setRefunding] = useState(false);

  const loadOrder = () => {
    if (!id) return;
    setLoading(true);
    // 注意：id 可能为 Long 值，不能 Number() 转换以免精度丢失
    const rawId = String(id);
    console.log('[OrderDetail] loading order, raw id from URL:', rawId);
    getOrderDetail({ id: rawId as any })
      .then((res) => {
        console.log('[OrderDetail] response:', res);
        if (res?.data) setOrder(res.data);
        else message.error(`订单 ${rawId} 不存在或已失效，请刷新列表重试`);
      })
      .catch((e: any) => {
        console.error('[OrderDetail] error:', e);
        message.error(e?.message || '加载订单失败');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOrder();
  }, [id]);

  const handlePay = async () => {
    if (!order?.id) return;
    setPaying(true);
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
      setPaying(false);
    }
  };

  const handleRefund = () => {
    if (!order?.id) return;
    confirm({
      title: '确认退款？',
      icon: <ExclamationCircleOutlined />,
      content: `确定要申请退款吗？退款金额 ¥${order.totalPrice?.toFixed(2)} 将原路返回。`,
      okText: '确认退款',
      cancelText: '我再想想',
      okButtonProps: { danger: true },
      onOk: async () => {
        setRefunding(true);
        try {
          await refundOrder({ id: order.id! });
          message.success('退款申请已提交，退款将原路返回');
          loadOrder();
        } catch (e: any) {
          message.error('退款失败：' + (e?.message || ''));
        } finally {
          setRefunding(false);
        }
      },
    });
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

  if (!order) return null;

  const st = statusMap[order.status!] || { color: 'default', text: order.status };

  return (
    <PageContainer header={{ title: '订单详情' }}>
      <Card>
        <Descriptions column={{ xs: 1, sm: 2 }}>
          <Descriptions.Item label="订单号">{order.orderNo}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={st.color}>{st.text}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="影片">{order.filmName}</Descriptions.Item>
          <Descriptions.Item label="影院">{order.cinemaName}</Descriptions.Item>
          <Descriptions.Item label="影厅">{order.hallName}</Descriptions.Item>
          <Descriptions.Item label="放映时间">{order.scheduleTime}</Descriptions.Item>
          <Descriptions.Item label="座位">
            {order.seatLabels?.join('、')}
          </Descriptions.Item>
          <Descriptions.Item label="数量">{order.count}张</Descriptions.Item>
          <Descriptions.Item label="总价">
            <span style={{ color: '#ff4d4f', fontSize: 18, fontWeight: 'bold' }}>
              ¥{order.totalPrice?.toFixed(2)}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="下单时间">{order.createTime}</Descriptions.Item>
          {order.paidAt && (
            <Descriptions.Item label="支付时间">{order.paidAt}</Descriptions.Item>
          )}
          {order.cancelReason && (
            <Descriptions.Item label="取消原因">
              {order.cancelReason === 'timeout' ? '超时未支付' : order.cancelReason}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {order.status === 'pending' && (
        <Card style={{ marginTop: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <Statistic title="待支付" value={order.totalPrice} precision={2} prefix="¥" />
            <Divider />
            <Button
              type="primary"
              size="large"
              loading={paying}
              onClick={handlePay}
            >
              去支付（支付宝沙箱）
            </Button>
          </div>
        </Card>
      )}

      {order.status === 'paid' && (
        <Card style={{ marginTop: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <Statistic title="已支付" value={order.totalPrice} precision={2} prefix="¥" />
            <Divider />
            <Button
              type="default"
              size="large"
              danger
              loading={refunding}
              onClick={handleRefund}
            >
              申请退款
            </Button>
          </div>
        </Card>
      )}

      {order.status === 'refunded' && (
        <Card style={{ marginTop: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <Statistic title="已退款" value={order.totalPrice} precision={2} prefix="¥" />
            <Divider />
            <span style={{ color: '#999' }}>退款已原路返回，座位已释放</span>
          </div>
        </Card>
      )}

      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <Button onClick={() => history.push('/order/list')}>返回订单列表</Button>
      </div>
    </PageContainer>
  );
};

export default OrderDetailPage;
