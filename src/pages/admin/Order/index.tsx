import { adminCancel, adminList, adminRefund } from '@/api/orderController';
import { ExclamationCircleOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Badge, Button, Card, Descriptions, message, Modal, Space, Tooltip } from 'antd';
import dayjs from 'dayjs';
import React, { useRef, useState } from 'react';
import './index.css';

const { confirm } = Modal;

const statusMap: Record<string, { status: 'processing' | 'success' | 'default' | 'error'; text: string }> = {
  pending: { status: 'processing', text: '待支付' },
  paid: { status: 'success', text: '已支付' },
  cancelled: { status: 'default', text: '已取消' },
  completed: { status: 'success', text: '已完成' },
  refunded: { status: 'error', text: '已退款' },
};

const OrderListPage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState<API.Order | null>(null);

  const columns: ProColumns<API.Order>[] = [
    { title: '订单号', dataIndex: 'orderNo', width: 180, ellipsis: true, copyable: true },
    { title: '用户ID', dataIndex: 'userId', width: 80 },
    { title: '影片', dataIndex: 'filmName', width: 150, ellipsis: true },
    { title: '影院', dataIndex: 'cinemaName', width: 150, ellipsis: true },
    { title: '影厅', dataIndex: 'hallName', width: 100 },
    { title: '放映时间', dataIndex: 'scheduleTime', width: 150 },
    {
      title: '金额',
      dataIndex: 'totalPrice',
      width: 90,
      render: (v) => (v ? <span style={{ color: '#cf1322', fontWeight: 600 }}>¥{Number(v).toFixed(2)}</span> : '-'),
    },
    { title: '数量', dataIndex: 'count', width: 60 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      valueEnum: {
        pending: { text: '待支付', status: 'Processing' },
        paid: { text: '已支付', status: 'Success' },
        cancelled: { text: '已取消', status: 'Default' },
        completed: { text: '已完成', status: 'Success' },
        refunded: { text: '已退款', status: 'Error' },
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
      render: (v) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-'),
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
          {record.status === 'paid' && (
            <Button type="link" size="small" danger onClick={() => handleRefund(record)}>
              退款
            </Button>
          )}
        </Space>
      ),
    },
  ];

  /** 查看详情 */
  const handleDetail = (record: API.Order) => {
    setDetailData(record);
    setDetailOpen(true);
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
        } catch (e: any) {
          message.error('操作失败：' + (e.message || ''));
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
        } catch (e: any) {
          message.error('操作失败：' + (e.message || ''));
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
        extra={
          <Tooltip title="刷新">
            <Button icon={<ReloadOutlined />} onClick={() => actionRef.current?.reload()} />
          </Tooltip>
        }
      >
        <ProTable<API.Order>
          actionRef={actionRef}
          columns={columns}
          request={async (params) => {
            const res = await adminList({
              pageNum: params.current || 1,
              pageSize: params.pageSize || 10,
              status: params.status as string | undefined,
            });
            return {
              data: (res.data as any)?.records || [],
              total: (res.data as any)?.totalRow || 0,
              success: true,
            };
          }}
          rowKey="id"
          search={{
            filterType: 'light',
          }}
          pagination={{
            pageSize: 10,
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
      <Modal
        title="订单详情"
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={null}
        width={640}
      >
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
            <Descriptions.Item label="放映时间">{detailData.scheduleTime || '-'}</Descriptions.Item>
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
            {detailData.cancelReason && (
              <Descriptions.Item label="取消原因" span={2}>
                {detailData.cancelReason === 'timeout' ? '超时未支付，系统自动取消' : detailData.cancelReason === 'user_cancelled' ? '用户主动取消' : detailData.cancelReason}
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
