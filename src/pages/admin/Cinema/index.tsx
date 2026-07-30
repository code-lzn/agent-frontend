import { list4, remove7, save7, update7 } from '@/api/cinemaController';
import { listByCinema, remove5, save5 } from '@/api/hallController';
import {
  DeleteOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import {
  Badge,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useEffect, useState } from 'react';
import './index.css';

const { confirm } = Modal;

const STATUS_MAP: Record<string, { status: 'success' | 'default' | 'warning'; text: string }> = {
  published: { status: 'success', text: '营业中' },
  draft: { status: 'default', text: '未营业' },
  offline: { status: 'warning', text: '已停业' },
};

const HALL_TYPES = ['IMAX', '杜比', '普通', '4DX', 'VIP'];

const CinemaListPage: React.FC = () => {
  const [cinemas, setCinemas] = useState<API.Cinema[]>([]);
  const [loading, setLoading] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [editingCinema, setEditingCinema] = useState<API.Cinema | null>(null);
  const [cinemaForm] = Form.useForm();

  // 影厅抽屉
  const [hallDrawerOpen, setHallDrawerOpen] = useState(false);
  const [currentCinema, setCurrentCinema] = useState<API.Cinema | null>(null);
  const [halls, setHalls] = useState<API.Hall[]>([]);
  const [hallLoading, setHallLoading] = useState(false);
  const [hallFormOpen, setHallFormOpen] = useState(false);
  const [hallForm] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await list4();
      setCinemas(res.data || []);
    } catch {
      message.error('加载影院列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 打开影厅抽屉
  const openHalls = async (cinema: API.Cinema) => {
    setCurrentCinema(cinema);
    setHallDrawerOpen(true);
    setHallLoading(true);
    try {
      const res = await listByCinema({ cinemaId: cinema.id! });
      setHalls((res.data as any)?.data || res.data || []);
    } catch {
      message.error('加载影厅列表失败');
    } finally {
      setHallLoading(false);
    }
  };

  const handleAddHall = async () => {
    try {
      const values = await hallForm.validateFields();
      await save5({
        ...values,
        cinemaId: currentCinema?.id,
        seatTemplate: JSON.stringify({ rows: values.rowCount, cols: values.colCount }),
      });
      message.success('影厅创建成功');
      hallForm.resetFields();
      setHallFormOpen(false);
      // 刷新影厅列表
      const res = await listByCinema({ cinemaId: currentCinema!.id! });
      setHalls((res.data as any)?.data || res.data || []);
    } catch (e: any) {
      if (e.errorFields) return;
      message.error('创建失败');
    }
  };

  const handleDeleteHall = async (id: number) => {
    await remove5({ id });
    message.success('删除成功');
    setHalls((prev) => prev.filter((h) => h.id !== id));
  };

  // 影院表单
  const handleEdit = (cinema: API.Cinema) => {
    setEditingCinema(cinema);
    cinemaForm.setFieldsValue({
      ...cinema,
      tags: cinema.tags?.split(',').filter(Boolean) || [],
    });
    setFormVisible(true);
  };

  const handleDelete = (id: number) => {
    confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: '确定要删除该影院吗？',
      onOk: async () => {
        await remove7({ id });
        message.success('删除成功');
        loadData();
      },
    });
  };

  const handleFormSubmit = async (values: any) => {
    const params = {
      ...values,
      tags: Array.isArray(values.tags) ? values.tags.join(',') : values.tags,
    };
    if (editingCinema) {
      await update7({ id: editingCinema.id, ...params });
      message.success('更新成功');
    } else {
      await save7(params);
      message.success('创建成功');
    }
    setFormVisible(false);
    setEditingCinema(null);
    cinemaForm.resetFields();
    loadData();
  };

  const columns: ColumnsType<API.Cinema> = [
    { title: '影院名称', dataIndex: 'name', key: 'name', width: 180, ellipsis: true },
    { title: '地址', dataIndex: 'address', key: 'address', width: 280, ellipsis: true },
    {
      title: '特色标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 200,
      render: (tags: string) =>
        tags?.split(',').map((t) => (
          <Tag key={t} color="orange" style={{ marginBottom: 2 }}>
            {t}
          </Tag>
        )),
    },
    { title: '联系电话', dataIndex: 'phone', key: 'phone', width: 130 },
    { title: '营业时间', dataIndex: 'businessHours', key: 'businessHours', width: 120 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (s: string) => {
        const m = STATUS_MAP[s] || STATUS_MAP.draft;
        return <Badge status={m.status} text={m.text} />;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 240,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openHalls(record)}>
            影厅
          </Button>
          <Button type="link" size="small" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id!)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="cinema-page">
      <Card
        className="cinema-card"
        title={
          <div className="card-header">
            <span className="card-title">影院列表</span>
            <span className="card-count">共 {cinemas.length} 家</span>
          </div>
        }
        extra={
          <Space size={8}>
            <Tooltip title="刷新">
              <Button icon={<ReloadOutlined />} onClick={loadData} />
            </Tooltip>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingCinema(null);
                cinemaForm.resetFields();
                setFormVisible(true);
              }}
            >
              新增影院
            </Button>
          </Space>
        }
      >
        <Table<API.Cinema>
          columns={columns}
          dataSource={cinemas}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
          scroll={{ x: 1100 }}
          locale={{
            emptyText: (
              <div className="empty-state">
                <div className="empty-icon">🏢</div>
                <p className="empty-text">暂无影院数据</p>
                <Button
                  type="primary"
                  onClick={() => {
                    setEditingCinema(null);
                    cinemaForm.resetFields();
                    setFormVisible(true);
                  }}
                >
                  新增影院
                </Button>
              </div>
            ),
          }}
        />
      </Card>

      {/* 新增/编辑影院弹窗 */}
      <Modal
        title={editingCinema ? '编辑影院' : '新增影院'}
        open={formVisible}
        onCancel={() => {
          setFormVisible(false);
          setEditingCinema(null);
        }}
        onOk={() => cinemaForm.submit()}
        width={560}
      >
        <Form form={cinemaForm} layout="vertical" onFinish={handleFormSubmit}>
          <Form.Item name="name" label="影院名称" rules={[{ required: true, message: '请输入影院名称' }]}>
            <Input placeholder="请输入影院名称" />
          </Form.Item>
          <Form.Item name="address" label="地址" rules={[{ required: true, message: '请输入影院地址' }]}>
            <Input placeholder="详细地址" />
          </Form.Item>
          <Form.Item name="phone" label="联系电话" rules={[{ required: true, message: '请输入联系电话' }]}>
            <Input placeholder="联系电话" />
          </Form.Item>
          <Form.Item name="businessHours" label="营业时间">
            <Input placeholder="如 09:00-23:00" />
          </Form.Item>
          <Form.Item name="tags" label="特色标签">
            <Select
              mode="tags"
              placeholder="选择特色标签"
              options={['IMAX', '杜比', '4K', '巨幕', '4DX', 'VIP'].map((t) => ({ label: t, value: t }))}
            />
          </Form.Item>
          <Form.Item name="basePrice" label="基准票价(元)">
            <InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="基准票价" />
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue="draft">
            <Select
              options={[
                { label: '未营业', value: 'draft' },
                { label: '营业中', value: 'published' },
                { label: '已停业', value: 'offline' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 影厅管理弹窗 */}
      <Modal
        title={`影厅管理 - ${currentCinema?.name || ''}`}
        open={hallDrawerOpen}
        onCancel={() => {
          setHallDrawerOpen(false);
          setCurrentCinema(null);
        }}
        footer={null}
        width={600}
      >
        <div style={{ marginBottom: 16, textAlign: 'right' }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setHallFormOpen(true)}>
            新增影厅
          </Button>
        </div>
        <Table
          dataSource={halls}
          rowKey="id"
          loading={hallLoading}
          pagination={false}
          columns={[
            { title: '影厅名称', dataIndex: 'name', width: 120 },
            {
              title: '厅型',
              dataIndex: 'hallType',
              width: 100,
              render: (t) => <Tag color="blue">{t}</Tag>,
            },
            {
              title: '座位布局',
              width: 180,
              render: (_, r) =>
                r.rowCount && r.colCount ? `${r.rowCount}行×${r.colCount}列 (${r.rowCount * r.colCount}座)` : '-',
            },
            {
              title: '操作',
              width: 80,
              render: (_, record) => (
                <Button type="link" size="small" danger onClick={() => handleDeleteHall(record.id!)}>
                  删除
                </Button>
              ),
            },
          ]}
          locale={{
            emptyText: (
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <p className="empty-text">暂无影厅，请新增</p>
              </div>
            ),
          }}
        />
      </Modal>

      {/* 新增影厅弹窗 */}
      <Modal
        title="新增影厅"
        open={hallFormOpen}
        onCancel={() => {
          setHallFormOpen(false);
          hallForm.resetFields();
        }}
        onOk={handleAddHall}
      >
        <Form form={hallForm} layout="vertical">
          <Form.Item name="name" label="影厅名称" rules={[{ required: true, message: '请输入影厅名称' }]}>
            <Input placeholder="如 IMAX厅、2号厅" />
          </Form.Item>
          <Form.Item name="hallType" label="厅型" rules={[{ required: true, message: '请选择厅型' }]}>
            <Select options={HALL_TYPES.map((t) => ({ label: t, value: t }))} />
          </Form.Item>
          <Space>
            <Form.Item name="rowCount" label="行数" rules={[{ required: true }]}>
              <InputNumber min={1} max={20} placeholder="行" />
            </Form.Item>
            <Form.Item name="colCount" label="列数" rules={[{ required: true }]}>
              <InputNumber min={1} max={20} placeholder="列" />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  );
};

export default CinemaListPage;
