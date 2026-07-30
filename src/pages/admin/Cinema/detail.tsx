import { getInfo7 } from '@/api/cinemaController';
import { listByCinema, remove5, save5 } from '@/api/hallController';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from '@umijs/max';
import {
  Badge,
  Button,
  Card,
  Descriptions,
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
import React, { useEffect, useState } from 'react';
import './index.css';

const HALL_TYPES = ['IMAX', '杜比', '普通', '4DX', 'VIP'];

const CinemaDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cinema, setCinema] = useState<API.Cinema | null>(null);
  const [halls, setHalls] = useState<API.Hall[]>([]);
  const [loading, setLoading] = useState(true);
  const [hallLoading, setHallLoading] = useState(false);
  const [hallFormOpen, setHallFormOpen] = useState(false);
  const [hallForm] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    try {
      const cinemaRes = await getInfo7({ id: Number(id) });
      setCinema(cinemaRes.data);
      // 用新 API 按影院查询影厅
      const hallRes = await listByCinema({ cinemaId: Number(id) });
      setHalls((hallRes.data as any)?.data || hallRes.data || []);
    } catch {
      message.error('加载影院信息失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleAddHall = async () => {
    try {
      const values = await hallForm.validateFields();
      await save5({
        ...values,
        cinemaId: Number(id),
        seatTemplate: JSON.stringify({ rows: values.rowCount, cols: values.colCount }),
      });
      message.success('影厅创建成功');
      hallForm.resetFields();
      setHallFormOpen(false);
      loadData();
    } catch (e: any) {
      if (e.errorFields) return;
      message.error('创建失败');
    }
  };

  const handleDeleteHall = async (hallId: number) => {
    await remove5({ id: hallId });
    message.success('删除成功');
    loadData();
  };

  const statusBadge = (status?: string) => {
    const m: Record<string, ['success' | 'default' | 'warning' | 'error', string]> = {
      published: ['success', '营业中'],
      draft: ['default', '未营业'],
      offline: ['warning', '已停业'],
    };
    const [s, t] = m[status || 'draft'] || ['default', '未知'];
    return <Badge status={s} text={t} />;
  };

  return (
    <div className="cinema-page">
      {/* 基本信息 */}
      <Card
        className="cinema-card"
        style={{ marginBottom: 16 }}
        title={<span className="card-title">基本信息</span>}
        extra={
          <Button onClick={() => navigate('/admin/cinema')}>返回列表</Button>
        }
      >
        <Descriptions column={2} style={{ padding: '8px 0' }}>
          <Descriptions.Item label="影院名称">{cinema?.name}</Descriptions.Item>
          <Descriptions.Item label="状态">{statusBadge(cinema?.status)}</Descriptions.Item>
          <Descriptions.Item label="地址">{cinema?.address || '-'}</Descriptions.Item>
          <Descriptions.Item label="联系电话">{cinema?.phone || '-'}</Descriptions.Item>
          <Descriptions.Item label="营业时间">{cinema?.businessHours || '-'}</Descriptions.Item>
          <Descriptions.Item label="基准票价">{cinema?.basePrice ? `¥${cinema.basePrice}` : '-'}</Descriptions.Item>
          <Descriptions.Item label="特色标签" span={2}>
            {cinema?.tags
              ? cinema.tags.split(',').map((t) => (
                  <Tag key={t} color="orange">
                    {t}
                  </Tag>
                ))
              : '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 影厅管理 */}
      <Card
        className="cinema-card"
        title={<span className="card-title">影厅管理</span>}
        extra={
          <Space size={8}>
            <Tooltip title="刷新">
              <Button icon={<ReloadOutlined />} onClick={loadData} />
            </Tooltip>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setHallFormOpen(true)}>
              新增影厅
            </Button>
          </Space>
        }
      >
        <Table
          dataSource={halls}
          rowKey="id"
          loading={hallLoading}
          pagination={false}
          columns={[
            { title: '影厅名称', dataIndex: 'name', width: 150 },
            {
              title: '厅型',
              dataIndex: 'hallType',
              width: 120,
              render: (t) => <Tag color="blue">{t}</Tag>,
            },
            {
              title: '座位布局',
              width: 200,
              render: (_, r) =>
                r.rowCount && r.colCount
                  ? `${r.rowCount}行×${r.colCount}列（共${r.rowCount * r.colCount}座）`
                  : '-',
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
      </Card>

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

export default CinemaDetailPage;
