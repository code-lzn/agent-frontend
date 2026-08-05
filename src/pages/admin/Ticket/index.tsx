import { query, checkin } from '@/api/ticketController';
import { AuditOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Descriptions, Input, message, Tag, Typography } from 'antd';
import React, { useState } from 'react';

const { Text } = Typography;

/** 票状态映射 */
const TICKET_STATUS_MAP: Record<number, { text: string; color: string }> = {
  0: { text: '未使用', color: 'success' },
  1: { text: '已核销', color: 'default' },
  2: { text: '已退票', color: 'warning' },
  3: { text: '已过期', color: 'error' },
};

/**
 * 票务核销页：输入取票码 → 查询 → 核销单张票（每座位一票，可分次核销）。
 */
const TicketCheckinPage: React.FC = () => {
  const [code, setCode] = useState('');
  const [ticket, setTicket] = useState<API.TicketVO | null>(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [checkinLoading, setCheckinLoading] = useState(false);

  const handleQuery = async () => {
    const tc = code.trim();
    if (!tc) {
      message.warning('请输入取票码');
      return;
    }
    setQueryLoading(true);
    try {
      const res = await query({ ticketCode: tc });
      setTicket((res as any)?.data || null);
    } catch (e: any) {
      setTicket(null);
      message.error(e?.message || '查询失败');
    } finally {
      setQueryLoading(false);
    }
  };

  const handleCheckin = async () => {
    if (!ticket?.ticketCode) return;
    setCheckinLoading(true);
    try {
      const res = await checkin({ ticketCode: ticket.ticketCode });
      setTicket((res as any)?.data);
      message.success('核销成功');
    } catch (e: any) {
      message.error(e?.message || '核销失败');
    } finally {
      setCheckinLoading(false);
    }
  };

  const statusInfo = ticket ? (TICKET_STATUS_MAP[ticket.status || 0] || TICKET_STATUS_MAP[0]) : null;
  const canCheckin = ticket?.status === 0;

  return (
    <div>
      <Card title="票务核销" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <Input
            placeholder="请输入 8 位取票码"
            maxLength={8}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onPressEnter={handleQuery}
            style={{ width: 300 }}
            allowClear
          />
          <Button type="primary" icon={<SearchOutlined />} loading={queryLoading} onClick={handleQuery}>
            查询
          </Button>
          {statusInfo && ticket && (
            <Tag color={statusInfo.color} style={{ fontSize: 13 }}>
              {statusInfo.text}
            </Tag>
          )}
        </div>
      </Card>

      {ticket && (
        <Card
          title="票信息"
          extra={
            <Button
              type="primary"
              icon={<AuditOutlined />}
              loading={checkinLoading}
              disabled={!canCheckin}
              onClick={handleCheckin}
            >
              {ticket.status === 1
                ? '已核销'
                : ticket.status === 2
                  ? '已退票'
                  : ticket.status === 3
                    ? '已过期'
                    : '核销'}
            </Button>
          }
        >
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="影片">{ticket.filmName || '-'}</Descriptions.Item>
            <Descriptions.Item label="场次">{ticket.scheduleTime || '-'}</Descriptions.Item>
            <Descriptions.Item label="影院">{ticket.cinemaName || '-'}</Descriptions.Item>
            <Descriptions.Item label="影厅">{ticket.hallName || '-'}</Descriptions.Item>
            <Descriptions.Item label="座位">{ticket.seatLabel || '-'}</Descriptions.Item>
            <Descriptions.Item label="订单号">{ticket.orderNo || '-'}</Descriptions.Item>
            <Descriptions.Item label="取票码">
              <Text code strong style={{ fontSize: 16, letterSpacing: 3 }}>
                {ticket.ticketCode}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              {statusInfo && <Tag color={statusInfo.color}>{statusInfo.text}</Tag>}
            </Descriptions.Item>
            {ticket.status === 1 && (
              <Descriptions.Item label="核销时间" span={2}>
                {ticket.checkedInAt || '-'}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      )}
    </div>
  );
};

export default TicketCheckinPage;
