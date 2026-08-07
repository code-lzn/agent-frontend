import { listByCinema, remove5, save5, update5 } from '@/api/hallController';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Form, Input, message, Modal, Select, Space, Table, Tag } from 'antd';
import React, { useEffect, useState } from 'react';
import SeatGridEditor from './SeatGridEditor';

const HALL_TYPES = ['IMAX', '杜比', '普通', '4DX', 'VIP'];

interface HallManagerProps {
  cinemaId: number | string;
  cinemaName?: string;
}

interface HallFormValues {
  name: string;
  hallType: string;
  rowCount: number;
  colCount: number;
  seatTemplate: string;
}

const HallManager: React.FC<HallManagerProps> = ({ cinemaId }) => {
  const [halls, setHalls] = useState<API.Hall[]>([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingHall, setEditingHall] = useState<API.Hall | null>(null);
  const [form] = Form.useForm<HallFormValues>();

  // 可视化编辑器当前值
  const [gridRowCount, setGridRowCount] = useState(10);
  const [gridColCount, setGridColCount] = useState(10);
  const [gridTemplate, setGridTemplate] = useState('{}');

  const loadHalls = async () => {
    setLoading(true);
    try {
      const res = await listByCinema({ cinemaId: cinemaId as any });
      setHalls((res.data as any)?.data || res.data || []);
    } catch {
      message.error('加载影厅列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHalls();
  }, [cinemaId]);

  const openAddForm = () => {
    setEditingHall(null);
    form.resetFields();
    setGridRowCount(10);
    setGridColCount(10);
    setGridTemplate(JSON.stringify({ rows: 10, cols: 10 }));
    setFormOpen(true);
  };

  const openEditForm = (hall: API.Hall) => {
    setEditingHall(hall);
    const tmpl = hall.seatTemplate || JSON.stringify({ rows: hall.rowCount, cols: hall.colCount });
    form.setFieldsValue({
      name: hall.name,
      hallType: hall.hallType,
    });
    // 同步网格
    const parsed = parseTemplate(tmpl);
    setGridRowCount(parsed.rows);
    setGridColCount(parsed.cols);
    setGridTemplate(tmpl);
    setFormOpen(true);
  };

  const handleGridChange = (rows: number, cols: number, template: string) => {
    setGridRowCount(rows);
    setGridColCount(cols);
    setGridTemplate(template);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const hallData = {
        name: values.name,
        hallType: values.hallType,
        rowCount: gridRowCount,
        colCount: gridColCount,
        cinemaId,
        seatTemplate: gridTemplate,
      };

      if (editingHall) {
        await update5({ id: editingHall.id, ...hallData } as any);
        message.success('影厅更新成功');
      } else {
        await save5(hallData as any);
        message.success('影厅创建成功');
      }

      form.resetFields();
      setFormOpen(false);
      setEditingHall(null);
      loadHalls();
    } catch (e: any) {
      if (e.errorFields) {
        message.warning('请完善必填项后再保存');
        return;
      }
      console.error('[HallManager] 保存影厅失败:', e);
      message.error(editingHall ? '更新失败' : '创建失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await remove5({ id });
      message.success('删除成功');
      setHalls((prev) => prev.filter((h) => h.id !== id));
    } catch {
      message.error('删除失败');
    }
  };

  const columns = [
    { title: '影厅名称', dataIndex: 'name', width: 120 },
    {
      title: '厅型',
      dataIndex: 'hallType',
      width: 100,
      render: (t: string) => <Tag color="blue">{t}</Tag>,
    },
    {
      title: '座位布局',
      width: 220,
      render: (_: any, r: API.Hall) => {
        const tmpl = parseTemplate(r.seatTemplate || '{}');
        const vipCount = tmpl.vipRows?.length || 0;
        return (
          <span>
            {r.rowCount}行×{r.colCount}列 ({r.rowCount && r.colCount ? r.rowCount * r.colCount : '?'}座)
            {vipCount > 0 && <Tag color="gold" style={{ marginLeft: 6 }}>{vipCount}行VIP</Tag>}
          </span>
        );
      },
    },
    {
      title: '操作',
      width: 140,
      render: (_: any, record: API.Hall) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => openEditForm(record)}>
            编辑
          </Button>
          <Button type="link" size="small" danger onClick={() => handleDelete(record.id!)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div style={{ marginBottom: 16, textAlign: 'right' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAddForm}>
          新增影厅
        </Button>
      </div>

      <Table
        dataSource={halls}
        rowKey="id"
        loading={loading}
        pagination={false}
        columns={columns}
        locale={{
          emptyText: (
            <div className="empty-state" style={{ padding: '24px 0' }}>
              <p className="empty-text">暂无影厅，请新增</p>
            </div>
          ),
        }}
      />

      <Modal
        title={editingHall ? '编辑影厅' : '新增影厅'}
        open={formOpen}
        onCancel={() => {
          setFormOpen(false);
          setEditingHall(null);
          form.resetFields();
        }}
        onOk={handleSubmit}
        width={780}
        styles={{ body: { maxHeight: 600, overflowY: 'auto' } }}
      >
        {/* 基本信息 */}
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="影厅名称" rules={[{ required: true, message: '请输入影厅名称' }]}>
            <Input placeholder="如 IMAX厅、2号厅" />
          </Form.Item>
          <Form.Item name="hallType" label="厅型" rules={[{ required: true, message: '请选择厅型' }]}>
            <Select options={HALL_TYPES.map((t) => ({ label: t, value: t }))} />
          </Form.Item>

          {/* 可视化座位网格编辑器 */}
          <Form.Item label="座位设计" style={{ marginBottom: 0 }}>
            <SeatGridEditor
              rowCount={gridRowCount}
              colCount={gridColCount}
              seatTemplate={gridTemplate}
              onChange={handleGridChange}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

/** 解析 seatTemplate JSON（统一处理 vipCells / vipRows 旧格式） */
function parseTemplate(template: string): { rows: number; cols: number; vipRows: number[]; rowOverrides?: Record<string, number> } {
  try {
    const parsed = JSON.parse(template || '{}');
    let vipRows: number[] = [];
    if (parsed.vipCells?.length) {
      // 从 vipCells 中提取有 VIP 座的行号（去重）
      const rowSet = new Set<number>();
      for (const cell of parsed.vipCells) {
        const [r] = cell.split(',').map(Number);
        if (r) rowSet.add(r);
      }
      vipRows = [...rowSet].sort((a, b) => a - b);
    } else if (parsed.vipRows?.length) {
      vipRows = [...parsed.vipRows];
    }
    return {
      rows: parsed.rows || 10,
      cols: parsed.cols || 10,
      vipRows,
      rowOverrides: parsed.rowOverrides,
    };
  } catch {
    return { rows: 10, cols: 10, vipRows: [] };
  }
}

export default HallManager;
