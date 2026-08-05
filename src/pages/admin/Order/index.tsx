import { adminCancel, adminDetail, adminList, adminRefund } from '@/api/orderController';
import { ExclamationCircleOutlined, EyeOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Badge, Button, Card, Descriptions, message, Modal, Space, Tabs, Tag } from 'antd';
import dayjs from 'dayjs';
import React, { useRef, useState } from 'react';
import './index.css';

const { confirm } = Modal;

const statusMap: Record<string, { status: 'processing' | 'success' | 'default' | 'error' | 'warning'; text: string }> = {
  pending: { status: 'processing', text: '待支付' },
  paid: { status: 'success', text: '已支付' },
  cancelled: { status: 'default', text: '已取消' },
  completed: { status: 'success', text: '已完成' },
  refunded: { status: 'warning', text: '已退款' },
};

/** 票状态映射 */
const TICKET_STATUS_MAP: Record<number, { text: string; color: string }> = {
  0: { text: '未使用', color: 'success' },
  1: { text: '已核销', color: 'default' },
  2: { text: '已退票', color: 'warning' },
  3: { text: '已过期', color: 'error' },
};

const OrderListPage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState<API.Order | null>(null);
  // 状态 Tab：''=全部
  const [statusTab, setStatusTab] = useState('');

  const columns: ProColumns<API.Order>[] = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      width: 180,
      ellipsis: true,
      copyable: true,
    },
    {
      title: '用户ID',
      dataIndex: 'userId',
      width: 80,
    },
    {
      title: '影片',
      dataIndex: 'filmName',
      width: 150,
      ellipsis: true,
    },
    {
      title: '影院',
      dataIndex: 'cinemaName',
      width: 150,
      ellipsis: true,
    },
    {
      title: '影厅',
      dataIndex: 'hallName',
      width: 100,
    },
    {
      title: '放映时间',
      dataIndex: 'scheduleTime',
      width: 150,
      hideInSearch: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      hideInSearch: true, // 状态筛选由顶部 Tab 承担
      valueEnum: {
        pending: { text: '待支付', status: 'Processing' },
        paid: { text: '已支付', status: 'Success' },
        cancelled: { text: '已取消', status: 'Default' },
        completed: { text: '已完成', status: 'Success' },
        refunded: { text: '已退款', status: 'Warning' },
      },
      render: (_, r) => {
        const s = statusMap[r.status || 'pending'];
        return <Badge status={s.status} text={s.text} />;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      width: 160,
      hideInSearch: true,
      render: (v) => (v ? dayjs(v as string).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleDetail(record)}>
            详情
          </Button>
          {record.status === 'pending' && (
            <Button type="link" size="small" danger onClick={() => handleCancel(record.id!)}>
              取消
            </Button>
          )}
          {record.status === 'paid' &&
            ((record as any).hasCheckedTicket ? (
              <Tag color="default">已核销</Tag>
            ) : (
              <Button type="link" size="small" danger onClick={() => handleRefund(record)}>
                退款
              </Button>
            ))}
        </Space>
      ),
    },
  ];

  /** 查看详情 */
  const handleDetail = async (record: API.Order) => {
    // 先显示表格行数据
    setDetailData(record);
    setDetailOpen(true);
    // 异步加载更多详情（座位号等）
    try {
      const res = await adminDetail({ id: record.id! });
      if (res.data) {
        setDetailData(res.data as API.OrderVO);
      }
    } catch {
      // 保持表格行数据，静默失败
    }
  };

  /** 取消订单 */
  const handleCancel = (id: number) => {
    confirm({
      title: '确认取消',
      icon: <ExclamationCircleOutlined />,
      content: '确定要取消该订单并释放座位吗？',
      onOk: async () => {
        try {
          await adminCancel({ id });
          message.success('订单已取消');
          actionRef.current?.reload();
        } catch {
          message.error('取消失败');
        }
      },
    });
  };

  /** 退款 */
  const handleRefund = (record: API.Order) => {
    confirm({
      title: '确认退款',
      icon: <ExclamationCircleOutlined />,
      content: `确定要退款订单「${record.orderNo}」（¥${Number(record.totalPrice).toFixed(2)}）吗？退款后座位将释放。`,
      onOk: async () => {
        try {
          await adminRefund({ id: record.id! });
          message.success('退款成功');
          actionRef.current?.reload();
        } catch {
          message.error('退款失败');
        }
      },
    });
  };

  return (
    <div className="order-page">
      <Card
        className="order-card"
        title={
          <div className="card-header">
            <span className="card-title">订单管理</span>
          </div>
        }
      >
        <ProTable<API.Order>
          actionRef={actionRef}
          columns={columns}
          params={{ status: statusTab || undefined }}
          headerTitle={
            <Tabs
              className="order-status-tabs"
              activeKey={statusTab}
              onChange={(key) => setStatusTab(key)}
              items={[
                { key: '', label: '全部' },
                { key: 'pending', label: '待支付' },
                { key: 'paid', label: '已支付' },
                { key: 'cancelled', label: '已取消' },
                { key: 'completed', label: '已完成' },
                { key: 'refunded', label: '已退款' },
              ]}
            />
          }
          request={async (params) => {
            const res = await adminList({
              pageNum: params.current || 1,
              pageSize: params.pageSize || 10,
              orderNo: params.orderNo as string | undefined,
              status: params.status as string | undefined,
              userId: params.userId ? Number(params.userId) : undefined,
              filmName: params.filmName as string | undefined,
              cinemaName: params.cinemaName as string | undefined,
              hallName: params.hallName as string | undefined,
            });
            return {
              data: (res.data as any)?.records || [],
              total: (res.data as any)?.totalRow || 0,
              success: true,
            };
          }}
          rowKey="id"
          options={{ density: false }}
          search={{
            filterType: 'query',
            labelWidth: 'auto',
            defaultCollapsed: true,
          }}
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            pageSizeOptions: ['10', '20', '50'],
          }}
          scroll={{ x: 1300 }}
          locale={{
            emptyText: (
              <div className="empty-state">
                <div className="empty-icon">🎫</div>
                <p className="empty-text">暂无订单数据</p>
              </div>
            ),
          }}
        />
      </Card>

      {/* 订单详情弹窗 */}
      <Modal title="订单详情" open={detailOpen} onCancel={() => setDetailOpen(false)} footer={null} width={640}>
        {detailData && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="订单号" span={2}>
              <span style={{ fontFamily: 'monospace' }}>{detailData.orderNo}</span>
            </Descriptions.Item>
            <Descriptions.Item label="用户ID">{detailData.userId}</Descriptions.Item>
            <Descriptions.Item label="购票数量">{detailData.count} 张</Descriptions.Item>
            <Descriptions.Item label="影片" span={2}>{detailData.filmName || '-'}</Descriptions.Item>
            <Descriptions.Item label="影院" span={2}>{detailData.cinemaName || '-'}</Descriptions.Item>
            <Descriptions.Item label="影厅">{detailData.hallName || '-'}</Descriptions.Item>
            <Descriptions.Item label="座位号">
              {(detailData as API.OrderVO).seatLabels?.length ? (
                <span>{(detailData as API.OrderVO).seatLabels!.join('、')}</span>
              ) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="放映时间">{detailData.scheduleTime || '-'}</Descriptions.Item>
            <Descriptions.Item label="电子票" span={2}>
              {(detailData as API.OrderVO).tickets?.length ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {(detailData as API.OrderVO).tickets!.map((t) => {
                    const ts = TICKET_STATUS_MAP[t.status || 0] || TICKET_STATUS_MAP[0];
                    return (
                      <div key={t.ticketCode || t.seatId} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontFamily: 'monospace', letterSpacing: 1, fontWeight: 600 }}>{t.ticketCode}</span>
                        <span style={{ color: '#909399' }}>{t.seatLabel}</span>
                        <Tag color={ts.color}>{ts.text}</Tag>
                      </div>
                    );
                  })}
                </div>
              ) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="订单金额">
              <span style={{ color: '#cf1322', fontWeight: 600 }}>
                ¥{Number(detailData.totalPrice).toFixed(2)}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="订单状态">
              <Badge
                status={statusMap[detailData.status || 'pending']?.status}
                text={statusMap[detailData.status || 'pending']?.text}
              />
            </Descriptions.Item>
            {(detailData.status === 'cancelled' || detailData.status === 'refunded') && detailData.cancelReason && (
              <Descriptions.Item label="取消原因" span={2}>
                {detailData.cancelReason === 'timeout'
                  ? '超时未支付，系统自动取消'
                  : detailData.cancelReason === 'user_cancelled'
                    ? '用户主动取消'
                    : detailData.cancelReason === 'admin_cancelled'
                      ? '管理员取消'
                      : detailData.cancelReason === 'admin_refund'
                        ? '管理员退款'
                        : detailData.cancelReason === 'user_refund'
                          ? '用户退款'
                          : detailData.cancelReason}
              </Descriptions.Item>
            )}
            {detailData.alipayTradeNo && (
              <Descriptions.Item label="支付宝交易号" span={2}>
                {detailData.alipayTradeNo}
              </Descriptions.Item>
            )}
            {detailData.paidAt && (
              <Descriptions.Item label="支付时间">
                {dayjs(detailData.paidAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="创建时间">
              {dayjs(detailData.createTime).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default OrderListPage;
