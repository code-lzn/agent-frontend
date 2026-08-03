import { listAll2, remove6, updateStatus } from '@/api/filmController';
import { ExclamationCircleOutlined, FileTextOutlined, PlusOutlined, ReloadOutlined, SettingOutlined } from '@ant-design/icons';
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

/** 影片状态映射 */
const FILM_STATUS_RECORD: Record<string, { status: 'success' | 'default' | 'warning' | 'error'; text: string }> = {
  published: { status: 'success', text: '已发布' },
  draft: { status: 'default', text: '草稿' },
  offline: { status: 'warning', text: '已下线' },
};

/** 影片管理页面 */
const FilmListPage: React.FC = () => {
  const [films, setFilms] = useState<API.Film[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await listAll2();
      setFilms(res.data || []);
    } catch {
      message.error('加载影片列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /** 切换状态 */
  const handleStatus = (id: number, status: string) => {
    confirm({
      title: '确认操作',
      icon: <ExclamationCircleOutlined />,
      content: `确定将影片${status === 'published' ? '发布' : status === 'offline' ? '下线' : '切换'}吗？`,
      onOk: async () => {
        try {
          await updateStatus({ id, status });
          message.success('状态更新成功');
          loadData();
        } catch (e: any) {
          message.error('操作失败：' + (e.message || '未知错误'));
        }
      },
    });
  };

  /** 删除 */
  const handleDelete = (id: number, name: string) => {
    confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除《${name}》吗？删除后不可恢复。`,
      onOk: async () => {
        try {
          await remove6({ id });
          message.success('删除成功');
          loadData();
        } catch (e: any) {
          message.error('删除失败：' + (e.message || '未知错误'));
        }
      },
    });
  };

  /** 表格列定义 */
  const columns: ColumnsType<API.Film> = [
    {
      title: '影片名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: true,
      fixed: 'left',
      render: (text: string, record) => (
        <span className="film-name-cell">
          {record.posterUrl && (
            <img
              src={record.posterUrl}
              alt={text}
              className="film-thumb"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
          <span className="film-name-text">{text}</span>
        </span>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 180,
      render: (type: string) =>
        type?.split(',').map((t) => (
          <Tag key={t} color="blue" style={{ marginBottom: 2, fontSize: 12 }}>
            {t}
          </Tag>
        )),
    },
    {
      title: '评分',
      dataIndex: 'rating',
      key: 'rating',
      width: 90,
      sorter: (a, b) => (a.rating || 0) - (b.rating || 0),
      showSorterTooltip: false,
      render: (val: number) =>
        val ? <span className="film-rating">{val.toFixed(1)}</span> : '-',
    },
    {
      title: '时长',
      dataIndex: 'duration',
      key: 'duration',
      width: 90,
      render: (val: number) => (val ? `${val}分钟` : '-'),
    },
    {
      title: '上映日期',
      dataIndex: 'releaseDate',
      key: 'releaseDate',
      width: 120,
      sorter: (a, b) => {
        if (!a.releaseDate) return -1;
        if (!b.releaseDate) return 1;
        return a.releaseDate.localeCompare(b.releaseDate);
      },
      showSorterTooltip: false,
    },
    {
      title: '导演',
      dataIndex: 'director',
      key: 'director',
      width: 120,
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: string) => {
        const s = FILM_STATUS_RECORD[status] || FILM_STATUS_RECORD.draft;
        return <Badge status={s.status} text={s.text} />;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 260,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small" className="action-btns">
          <Button type="link" size="small" onClick={() => history.push(`/admin/film/${record.id}`)}>
            编辑
          </Button>
          {record.status === 'draft' && (
            <Button type="link" size="small" onClick={() => handleStatus(record.id!, 'published')}>
              发布
            </Button>
          )}
          {record.status === 'published' && (
            <Button type="link" size="small" onClick={() => handleStatus(record.id!, 'offline')}>
              下线
            </Button>
          )}
          {record.status === 'offline' && (
            <Button type="link" size="small" onClick={() => handleStatus(record.id!, 'published')}>
              重新发布
            </Button>
          )}
          <Button type="link" size="small" danger onClick={() => handleDelete(record.id!, record.name!)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="film-page">
      {/* 主体卡片 */}
      <Card
        className="film-card"
        title={
          <div className="card-header">
            <span className="card-title">影片列表</span>
            <span className="card-count">共 {films.length} 部</span>
          </div>
        }
        extra={
          <Space size={8}>
            <Tooltip title="刷新">
              <Button icon={<ReloadOutlined />} onClick={loadData} />
            </Tooltip>
            <Tooltip title="设置">
              <Button icon={<SettingOutlined />} />
            </Tooltip>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => history.push('/admin/film/add')}
            >
              新增影片
            </Button>
          </Space>
        }
      >
        <Table<API.Film>
          columns={columns}
          dataSource={films}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            pageSizeOptions: ['10', '20', '50'],
          }}
          scroll={{ x: 1200 }}
          locale={{
            emptyText: (
              <div className="empty-state">
                <div className="empty-icon">
                  <FileTextOutlined style={{ fontSize: 48 }} />
                </div>
                <p className="empty-text">暂无数据</p>
                <Button type="primary" onClick={() => history.push('/admin/film/add')}>
                  新增影片
                </Button>
              </div>
            ),
          }}
        />
      </Card>
    </div>
  );
};

export default FilmListPage;
