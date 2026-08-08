import { cancelOrder, getOrderDetail, payOrder, refundOrder } from '@/api/orderController';
import { Button, Card, Divider, message, Modal, Spin, Statistic, Tag } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { history, useParams } from '@umijs/max';
import React, { useEffect, useState } from 'react';
import type { OrderVO } from '@/api/typings';
import './detail.css';

const { confirm } = Modal;

const statusMap: Record<string, { color: string; text: string }> = {
  pending: { color: 'orange', text: '待支付' },
  paid: { color: 'green', text: '已支付' },
  cancelled: { color: 'default', text: '已取消' },
  completed: { color: 'blue', text: '已完成' },
  refunded: { color: 'red', text: '已退款' },
};

/** 格式化剩余时间 mm:ss */
function formatRemain(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

/** 票状态映射 */
const TICKET_STATUS_MAP: Record<number, { text: string; color: string }> = {
  0: { text: '未使用', color: 'success' },
  1: { text: '已核销', color: 'default' },
  2: { text: '已退票', color: 'warning' },
  3: { text: '已过期', color: 'error' },
};

const OrderDetailPage: React.FC = () => {
  const { id } = useParams();
  const [order, setOrder] = useState<OrderVO | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [remain, setRemain] = useState<number>(900);

  const loadOrder = () => {
    if (!id) return;
    setLoading(true);
    getOrderDetail({ id: id as any })
      .then((res) => {
        const data = (res as any)?.data;
        if (data) setOrder(data);
        else message.error('订单不存在或已失效，请刷新列表重试');
      })
      .catch((e: any) => message.error(e?.message || '加载订单失败'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // 待支付订单倒计时（15分钟，基于 expireAt）
  useEffect(() => {
    if (order?.status !== 'pending') return;
    const end = order.expireAt
      ? new Date(order.expireAt).getTime()
      : Date.now() + 15 * 60 * 1000;
    const tick = () => {
      const left = Math.max(0, Math.floor((end - Date.now()) / 1000));
      setRemain(left);
      if (left <= 0) {
        clearInterval(timer);
        setOrder((prev) => (prev ? { ...prev, status: 'cancelled' } : prev));
      }
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [order?.status, order?.expireAt]);

  const handlePay = async () => {
    if (!order?.id) return;
    setPaying(true);
    try {
      // 支付成功回跳地址由后端根据前端 origin 动态生成（web 端无 payment-success 页，交由 H5 页展示）
      const res = await payOrder({ orderId: order.id as any });
      if ((res as any)?.data?.payForm) {
        const div = document.createElement('div');
        div.innerHTML = (res as any).data.payForm;
        document.body.appendChild(div);
        const form = div.querySelector('form');
        if (form) {
          form.submit();
        }
      }
    } catch (e: any) {
      message.error('支付失败：' + (e?.message || ''));
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

  const handleCancel = () => {
    if (!order?.id) return;
    confirm({
      title: '确认取消订单？',
      icon: <ExclamationCircleOutlined />,
      content: '取消后座位将释放，不可恢复',
      okText: '确认取消',
      cancelText: '我再想想',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await cancelOrder({ id: order.id as any });
          message.success('订单已取消');
          loadOrder();
        } catch (e: any) {
          message.error('取消失败：' + (e?.message || ''));
        }
      },
    });
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!order) return null;

  const st = order.status || 'pending';
  const tickets = order.tickets || [];
  // 有任一票已核销 → 整单禁止退款
  const hasCheckedTicket = tickets.some((t) => t.status === 1);

  return (
    <div className="order-detail-layout">
      {/* 主区 */}
      <div>
        <div className="page-nav">
          <button className="back-btn" onClick={() => history.push('/order/list')}>←</button>
          <span className="nav-label">返回订单列表</span>
        </div>

        {/* 状态横幅 */}
        {st === 'pending' && (
          <div className="order-banner pending">
            <div className="ob-icon">⏳</div>
            <div>
              <div className="ob-title">等待支付</div>
              <div className="ob-sub">请在倒计时结束前完成支付</div>
            </div>
            <div className="ob-timer">{formatRemain(remain)}</div>
          </div>
        )}
        {st === 'paid' && (
          <div className="order-banner paid">
            <div className="ob-icon">✅</div>
            <div>
              <div className="ob-title">支付成功</div>
              <div className="ob-sub">电子票已生成，凭取票码取票</div>
            </div>
          </div>
        )}
        {st === 'cancelled' && (
          <div className="order-banner cancelled">
            <div className="ob-icon">⛔</div>
            <div>
              <div className="ob-title">已取消</div>
              <div className="ob-sub">
                {order.cancelReason === 'timeout'
                  ? '超时未支付，系统自动取消'
                  : order.cancelReason === 'user_cancelled'
                    ? '用户主动取消'
                    : order.cancelReason || '订单已取消'}
              </div>
            </div>
          </div>
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

        {/* 订单信息 */}
        <div className="order-detail-card">
          <div className="orow"><span className="ol">影片</span><span>{order.filmName}</span></div>
          <div className="orow">
            <span className="ol">影院</span>
            <span>{order.cinemaName}{order.hallName ? ` ${order.hallName}` : ''}</span>
          </div>
          <div className="orow"><span className="ol">场次</span><span>{order.scheduleTime}</span></div>
          <div className="orow">
            <span className="ol">座位</span>
            <span>{order.seatLabels?.join('、') || '-'}</span>
          </div>
          <div className="orow">
            <span className="ol">订单号</span>
            <span style={{ fontSize: 12, color: '#909399' }}>{order.orderNo}</span>
          </div>
          <div className="osum">
            <div className="sub">¥{Number(order.totalPrice || 0).toFixed(2)} × {order.count} 张</div>
            <div className="total">¥{Number(order.totalPrice || 0).toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* 右侧操作面板 */}
      <div className="order-side">
        <div className="os-title">操作</div>
        {st === 'pending' ? (
          <div className="os-actions">
            <button className="os-btn pay" onClick={handlePay} disabled={paying}>
              {paying ? '处理中...' : '立即支付'}
            </button>
            <button className="os-btn danger" onClick={handleCancel}>
              取消订单
            </button>
          </div>
        ) : st === 'paid' ? (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {tickets.length > 0 ? (
                tickets.map((t) => {
                  const ts = TICKET_STATUS_MAP[t.status || 0] || TICKET_STATUS_MAP[0];
                  const used = t.status === 1;
                  return (
                    <div
                      key={t.ticketCode || t.seatId}
                      className="ticket-box"
                      style={used ? { opacity: 0.55 } : undefined}
                    >
                      <div className="tl">
                        {t.seatLabel}
                        <Tag color={ts.color} style={{ marginLeft: 6 }}>
                          {ts.text}
                        </Tag>
                      </div>
                      <div className="tc">{t.ticketCode}</div>
                    </div>
                  );
                })
              ) : (
                <div className="ticket-box">
                  <div className="tl">取票码</div>
                  <div className="tc">票生成中，请稍后刷新</div>
                </div>
              )}
            </div>
            <div className="os-actions">
              <button className="os-btn sec" onClick={() => history.push('/order/list')}>
                查看订单列表
              </button>
            </div>
          </>
        ) : (
          <div className="os-actions">
            <button className="os-btn sec" onClick={() => history.push('/order/list')}>
              返回订单列表
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetailPage;
