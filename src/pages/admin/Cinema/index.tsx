import { list4, remove7, save7, update7 } from '@/api/cinemaController';
import { geocode, placeSearch } from '@/api/geoController';
import { DeleteOutlined, EnvironmentOutlined, ExclamationCircleOutlined, EyeOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  AutoComplete, Badge, Button, Card, Form, Input, InputNumber, message, Modal, Select, Space, Spin, Table, Tag, Tooltip,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import HallManager from './HallManager';
import './index.css';

const { confirm } = Modal;

const STATUS_MAP: Record<string, { status: 'success' | 'default' | 'warning'; text: string }> = {
  published: { status: 'success', text: '营业中' },
  draft: { status: 'default', text: '未营业' },
  offline: { status: 'warning', text: '已停业' },
};

/** 联系电话格式：手机号（如 13800138000）或带区号座机（如 020-88888888） */
const validateContactPhone = (_: any, value: string) => {
  const v = (value || '').trim();
  if (!v) return Promise.resolve(); // 空值由 required 规则拦截
  if (/^1[3-9]\d{9}$/.test(v) || /^0\d{2,3}-?\d{7,8}$/.test(v)) {
    return Promise.resolve();
  }
  return Promise.reject(new Error('手机号格式不正确（如 13800138000），座机需带区号（如 020-88888888）'));
};

const CinemaListPage: React.FC = () => {
  const [cinemas, setCinemas] = useState<API.Cinema[]>([]);
  const [loading, setLoading] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [editingCinema, setEditingCinema] = useState<API.Cinema | null>(null);
  const [cinemaForm] = Form.useForm();

  // 监听坐标字段，用于展示定位状态（选中 POI 或反查后自动更新）
  const watchedLng = Form.useWatch('longitude', cinemaForm);
  const watchedLat = Form.useWatch('latitude', cinemaForm);
  const geoLocated = watchedLng != null && watchedLat != null;

  // 地址搜索（高德 POI）
  const [addressOptions, setAddressOptions] = useState<{ value: string; label: React.ReactNode; poi?: any }[]>([]);
  const [addressSearchLoading, setAddressSearchLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const addressSearchTimer = useRef<ReturnType<typeof setTimeout>>();

  // 影厅管理弹窗
  const [hallModalOpen, setHallModalOpen] = useState(false);
  const [currentCinema, setCurrentCinema] = useState<API.Cinema | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await list4();
      const list = (res as any)?.data || [];
      // 新增的影院放最前面（按 id 倒序；雪花 id 不可 Number()，用长度+字典序比较保证数值序）
      list.sort((a: API.Cinema, b: API.Cinema) => {
        const aid = String(a.id), bid = String(b.id);
        if (aid.length !== bid.length) return bid.length - aid.length;
        return bid.localeCompare(aid);
      });
      setCinemas(list);
    } catch {
      message.error('加载影院列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 名称模糊搜索（客户端过滤，参照影片列表）
  const [keyword, setKeyword] = useState('');
  const filteredCinemas = useMemo(() => {
    if (!keyword.trim()) return cinemas;
    const kw = keyword.trim().toLowerCase();
    return cinemas.filter((c) => (c.name || '').toLowerCase().includes(kw));
  }, [cinemas, keyword]);

  useEffect(() => {
    loadData();
  }, []);

  // 组件卸载时清理地址搜索防抖定时器
  useEffect(() => {
    return () => {
      if (addressSearchTimer.current) clearTimeout(addressSearchTimer.current);
    };
  }, []);

  const openHalls = (cinema: API.Cinema) => {
    setCurrentCinema(cinema);
    setHallModalOpen(true);
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

  const handleDelete = (id: string) => {
    confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: '确定要删除该影院吗？',
      onOk: async () => {
        try {
          await remove7({ id });
          message.success('删除成功');
          loadData();
        } catch (e: any) {
          // 后端禁止删除（如存在未放映场次）时展示具体原因
          message.error(e?.message || '删除失败');
        }
      },
    });
  };

  const handleFormSubmit = async (values: any) => {
    if (values.longitude == null || values.latitude == null) {
      message.error('请先通过地址搜索或「反查坐标」获取影院坐标，才能保存');
      return;
    }
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
    setAddressOptions([]);
    loadData();
  };

  // 高德 POI 地址搜索（防抖 300ms）
  const handleAddressSearch = (keyword: string) => {
    if (addressSearchTimer.current) clearTimeout(addressSearchTimer.current);
    const kw = keyword?.trim();
    if (!kw) {
      setAddressOptions([]);
      return;
    }
    setAddressSearchLoading(true);
    addressSearchTimer.current = setTimeout(async () => {
      try {
        const res = await placeSearch({ keyword: kw, page: 1, pageSize: 10 });
        const pois: any[] = (res as any)?.data || [];
        setAddressOptions(
          pois.map((p) => ({
            value: p.address ? `${p.name} ${p.address}` : p.name,
            label: (
              <div>
                <div>{p.name}</div>
                <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
                  {p.address || ''} · {p.city || ''}
                </div>
              </div>
            ),
            poi: p,
          })),
        );
      } catch {
        setAddressOptions([]);
      } finally {
        setAddressSearchLoading(false);
      }
    }, 300);
  };

  // 选中 POI 后自动回填地址/城市/坐标
  const handleAddressSelect = (_value: string, option: any) => {
    const poi = option?.poi;
    if (!poi) return;
    cinemaForm.setFieldsValue({
      address: poi.address ? `${poi.name} ${poi.address}` : poi.name,
      city: poi.city || cinemaForm.getFieldValue('city'),
      longitude: poi.longitude,
      latitude: poi.latitude,
    });
  };

  // 手动输入地址后反查坐标
  const handleReverseGeocode = async () => {
    const address = cinemaForm.getFieldValue('address');
    if (!address || !address.trim()) {
      message.warning('请先输入影院地址');
      return;
    }
    setGeoLoading(true);
    try {
      const res = await geocode({ address: address.trim() });
      const data = (res as any)?.data;
      if (data?.found) {
        cinemaForm.setFieldsValue({
          city: data.city || cinemaForm.getFieldValue('city'),
          longitude: data.longitude,
          latitude: data.latitude,
        });
        message.success('坐标获取成功');
      } else {
        message.error(data?.message || '地址解析失败，请尝试输入更详细的地址');
      }
    } catch {
      message.error('坐标获取失败，请稍后重试');
    } finally {
      setGeoLoading(false);
    }
  };

  const columns: ColumnsType<API.Cinema> = [
    { title: '影院名称', dataIndex: 'name', key: 'name', width: 180, ellipsis: true },
    { title: '地址', dataIndex: 'address', key: 'address', width: 280, ellipsis: true },
    {
      title: '坐标',
      key: 'coordinate',
      width: 170,
      render: (_: any, record: API.Cinema) =>
        record.longitude != null && record.latitude != null ? (
          `${record.longitude}, ${record.latitude}`
        ) : (
          <span style={{ color: '#ff4d4f' }}>未设置</span>
        ),
    },
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
            <span className="card-count">共 {filteredCinemas.length} 家</span>
            <Input.Search
              allowClear
              placeholder="搜索影院名称"
              style={{ width: 240 }}
              onSearch={(v) => setKeyword(v)}
              onChange={(e) => !e.target.value && setKeyword('')}
            />
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
          dataSource={filteredCinemas}
          rowKey="id"
          loading={loading}
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
            pageSizeOptions: ['10', '20', '50'],
          }}
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
        width={620}
      >
        <Form form={cinemaForm} layout="vertical" onFinish={handleFormSubmit}>
          <Form.Item name="name" label="影院名称" rules={[{ required: true, message: '请输入影院名称' }]}>
            <Input placeholder="请输入影院名称" />
          </Form.Item>
          <Form.Item name="address" label="影院地址" rules={[{ required: true, message: '请输入影院地址' }]}>
            <AutoComplete
              options={addressOptions}
              onSearch={handleAddressSearch}
              onSelect={handleAddressSelect}
              placeholder="输入地址关键字选择，或手动输入后点「反查坐标」"
              notFoundContent={addressSearchLoading ? <Spin size="small" /> : null}
              filterOption={false}
            />
          </Form.Item>
          <Form.Item label="坐标定位">
            <Space>
              <Button icon={<EnvironmentOutlined />} onClick={handleReverseGeocode} loading={geoLoading}>
                反查坐标
              </Button>
              <span style={{ fontSize: 12, color: geoLocated ? '#1677ff' : 'rgba(0,0,0,0.45)' }}>
                {geoLocated ? `已定位：${watchedLng}, ${watchedLat}` : '未获取坐标'}
              </span>
            </Space>
            <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginTop: 4 }}>
              从上方地址下拉选中可自动定位；或手动输入完整地址后点「反查坐标」
            </div>
          </Form.Item>
          <Form.Item name="city" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="longitude" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="latitude" hidden>
            <Input />
          </Form.Item>
          <Form.Item
            name="phone"
            label="联系电话"
            rules={[{ required: true, message: '请输入联系电话' }, { validator: validateContactPhone }]}
          >
            <Input placeholder="联系电话" />
          </Form.Item>
          <Form.Item name="businessHours" label="营业时间">
            <Input placeholder="如 09:00-23:00" />
          </Form.Item>
          <Form.Item name="tags" label="特色标签">
            <Select
              mode="multiple"
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
        open={hallModalOpen}
        onCancel={() => {
          setHallModalOpen(false);
          setCurrentCinema(null);
        }}
        footer={null}
        width={620}
      >
        {currentCinema && (
          <HallManager cinemaId={currentCinema.id!} cinemaName={currentCinema.name} />
        )}
      </Modal>
    </div>
  );
};

export default CinemaListPage;
