import { cancelOrder, getOrderDetail, payOrder } from '@/api/orderController';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { history, useParams } from '@umijs/max';
import { message, Modal, Spin } from 'antd';
import React, { useEffect, useState } from 'react';
import type { OrderVO } from '@/api/typings';
import './detail.css';

const { confirm } = Modal;

const statusText: Record<string, string> = {
  pending: '待支付',
  paid: '已支付',
  cancelled: '已取消',
  completed: '已完成',
  refunded: '已退款',
};

/** 格式化剩余时间 mm:ss */
function formatRemain(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

/** 从订单号生成取票码（取后12位数字，4位一组） */
function makeTicketCode(orderNo?: string) {
  const digits = (orderNo || '').replace(/\D/g, '').slice(-12);
  return (digits.match(/.{1,4}/g) || []).join(' ') || orderNo || '-';
}

const OrderDetailPage: React.FC = () => {
  const { id } = useParams();
  const [order, setOrder] = useState<OrderVO | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
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
  const ticketCode = makeTicketCode(order.orderNo);

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
            <div className="ticket-box">
              <div className="tl">取票码</div>
              <div className="tc">{ticketCode}</div>
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
