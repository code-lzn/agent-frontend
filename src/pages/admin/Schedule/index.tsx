import { listAll2 } from '@/api/filmController';
import { list4 } from '@/api/cinemaController';
import { list3 } from '@/api/hallController';
import { listAll1, remove3 } from '@/api/scheduleController';
import { DeleteOutlined, ExclamationCircleOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { history } from '@umijs/max';
import {
  Badge,
  Button,
  Card,
  message,
  Modal,
  Space,
  Table,
  Tag,
  Tooltip,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useEffect, useState } from 'react';
import './index.css';

const { confirm } = Modal;

const STATUS_MAP: Record<string, { status: 'success' | 'default' | 'warning' | 'error'; text: string }> = {
  published: { status: 'success', text: '已发布' },
  draft: { status: 'default', text: '草稿' },
  offline: { status: 'warning', text: '已下线' },
  soldOut: { status: 'error', text: '已售罄' },
};

const ScheduleListPage: React.FC = () => {
  const [schedules, setSchedules] = useState<API.Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [filmMap, setFilmMap] = useState<Record<number, API.Film>>({});
  const [cinemaMap, setCinemaMap] = useState<Record<number, API.Cinema>>({});
  const [hallMap, setHallMap] = useState<Record<number, API.Hall>>({});

  const loadData = async () => {
    setLoading(true);
    try {
      const [scheduleRes, filmRes, cinemaRes] = await Promise.all([
        listAll1(),
        listAll2(),
        list4(),
      ]);
      setSchedules(scheduleRes.data || []);

      const fMap: Record<number, API.Film> = {};
      (filmRes.data || []).forEach((f) => { if (f.id) fMap[f.id] = f; });
      setFilmMap(fMap);

      const cMap: Record<number, API.Cinema> = {};
      (cinemaRes.data || []).forEach((c) => { if (c.id) cMap[c.id] = c; });
      setCinemaMap(cMap);

      // 加载所有影厅
      const hallRes = await list3();
      const allHalls = (hallRes.data as any)?.data || hallRes.data || [];
      const hMap: Record<number, API.Hall> = {};
      (allHalls as API.Hall[]).forEach((h) => { if (h.id) hMap[h.id] = h; });
      setHallMap(hMap);
    } catch {
      message.error('加载场次列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = (id: number) => {
    confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: '确定要删除该场次吗？',
      onOk: async () => {
        try {
          await remove3({ id });
          message.success('删除成功');
          loadData();
        } catch (e: any) {
          message.error('删除失败');
        }
      },
    });
  };

  const columns: ColumnsType<API.Schedule> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    {
      title: '影片',
      key: 'filmName',
      width: 150,
      ellipsis: true,
      render: (_, r) => filmMap[r.filmId!]?.name || `ID:${r.filmId}`,
    },
    {
      title: '影院',
      key: 'cinemaName',
      width: 150,
      ellipsis: true,
      render: (_, r) => cinemaMap[r.cinemaId!]?.name || `ID:${r.cinemaId}`,
    },
    {
      title: '影厅',
      key: 'hallName',
      width: 100,
      render: (_, r) => {
        const hall = hallMap[r.hallId!];
        return hall ? <Tag>{hall.name}</Tag> : `ID:${r.hallId}`;
      },
    },
    { title: '日期', dataIndex: 'showDate', key: 'showDate', width: 110 },
    { title: '开场', dataIndex: 'startTime', key: 'startTime', width: 80 },
    { title: '散场', dataIndex: 'endTime', key: 'endTime', width: 80 },
    {
      title: '票价',
      dataIndex: 'price',
      key: 'price',
      width: 80,
      render: (v) => (v ? `¥${Number(v).toFixed(2)}` : '-'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (s) => {
        const m = STATUS_MAP[s || 'draft'];
        return <Badge status={m.status} text={m.text} />;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id!)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="schedule-page">
      <Card
        className="schedule-card"
        title={
          <div className="card-header">
            <span className="card-title">场次列表</span>
            <span className="card-count">共 {schedules.length} 场</span>
          </div>
        }
        extra={
          <Space size={8}>
            <Tooltip title="刷新">
              <Button icon={<ReloadOutlined />} onClick={loadData} />
            </Tooltip>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => history.push('/admin/schedule/add')}>
              新增场次
            </Button>
          </Space>
        }
      >
        <Table<API.Schedule>
          columns={columns}
          dataSource={schedules}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 15, showTotal: (t) => `共 ${t} 场` }}
          scroll={{ x: 1000 }}
          locale={{
            emptyText: (
              <div className="empty-state">
                <div className="empty-icon">🕐</div>
                <p className="empty-text">暂无场次数据</p>
                <Button type="primary" onClick={() => history.push('/admin/schedule/add')}>
                  新增场次
                </Button>
              </div>
            ),
          }}
        />
      </Card>
    </div>
  );
};

export default ScheduleListPage;
