import { cancelOrder, listOrders, payOrder } from '@/api/orderController';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { history } from '@umijs/max';
import { Button, Empty, message, Modal, Pagination, Spin } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import type { OrderVO } from '@/api/typings';
import './list.css';

const { confirm } = Modal;

const statusTabs = [
  { label: '全部', value: '' },
  { label: '待支付', value: 'pending' },
  { label: '已支付', value: 'paid' },
  { label: '已取消', value: 'cancelled' },
];

const PAGE_SIZE = 8;

const OrderListPage: React.FC = () => {
  const [orders, setOrders] = useState<OrderVO[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');

  const loadOrders = useCallback(async (pageNum = 1, status?: string) => {
    setLoading(true);
    try {
      const res = await listOrders({
        pageNum,
        pageSize: PAGE_SIZE,
        status: status || undefined,
      } as any);
      const data = (res as any)?.data;
      if (data) {
        setOrders(data.records || []);
        setTotal(data.totalRow || 0);
        setPage(pageNum);
      }
    } catch (e: any) {
      message.error(e?.message || '加载订单失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders(1, statusFilter);
  }, [statusFilter, loadOrders]);

  const handleCancelOrder = (orderId: number | string) => {
    confirm({
      title: '确认取消订单？',
      icon: <ExclamationCircleOutlined />,
      content: '取消后座位将释放，不可恢复',
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

  const handlePay = async (orderId: number | string) => {
    try {
      const res = await payOrder({ orderId: orderId as any });
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
    }
  };

  const statusText: Record<string, string> = {
    pending: '待支付',
    paid: '已支付',
    cancelled: '已取消',
    completed: '已完成',
    refunded: '已退款',
  };

  const renderOrder = (order: OrderVO) => {
    const st = order.status || 'pending';
    return (
      <div
        key={order.id}
        className="order-row"
        onClick={() => history.push(`/order/${order.id}`)}
      >
        {/* 影片 */}
        <div className="order-film-cell">
          <div className="order-poster">
            {(order as any).posterUrl ? (
              <img src={(order as any).posterUrl} alt={order.filmName} />
            ) : (
              order.filmName?.slice(0, 1) || '🎬'
            )}
          </div>
          <div className="order-film-name">{order.filmName}</div>
        </div>

        {/* 影院 / 场次 */}
        <div className="order-meta-cell">
          {order.cinemaName} {order.hallName && `· ${order.hallName}`}
          <br />
          {order.scheduleTime}
        </div>

        {/* 座位 */}
        <div className="order-seats-cell">
          {order.seatLabels?.join('、') || '-'}
        </div>

        {/* 金额 */}
        <div>
          <div className="order-price">¥{order.totalPrice?.toFixed(2)}</div>
          <div className="order-count">{order.count} 张</div>
        </div>

        {/* 状态 */}
        <div>
          <span className={`order-status ${st}`}>{statusText[st] || st}</span>
        </div>

        {/* 操作 */}
        <div>
          {order.status === 'pending' ? (
            <button
              className="order-action-link"
              onClick={(e) => {
                e.stopPropagation();
                handlePay(order.id!);
              }}
            >
              去支付
            </button>
          ) : (
            <button
              className="order-action-link gray"
              onClick={(e) => {
                e.stopPropagation();
                history.push(`/order/${order.id}`);
              }}
            >
              查看
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="order-list-page">
      {/* 筛选 Tab（分段控制器） */}
      <div className="order-tabs">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            className={`order-tab ${statusFilter === tab.value ? 'active' : ''}`}
            onClick={() => setStatusFilter(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Spin size="large" />
        </div>
      ) : orders.length === 0 ? (
        <div className="order-empty">
          <Empty description="暂无订单">
            <Button type="primary" onClick={() => history.push('/film')}>
              去购票
            </Button>
          </Empty>
        </div>
      ) : (
        <>
          <div className="order-table-head">
            <span>影片</span>
            <span>影院 / 场次</span>
            <span>座位</span>
            <span>金额</span>
            <span>状态</span>
            <span>操作</span>
          </div>
          {orders.map(renderOrder)}
          <div className="order-pagination">
            <Pagination
              current={page}
              pageSize={PAGE_SIZE}
              total={total}
              showSizeChanger={false}
              onChange={(p) => loadOrders(p, statusFilter)}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default OrderListPage;
