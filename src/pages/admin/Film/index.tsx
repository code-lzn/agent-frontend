import { listAll2, remove6, updateStatus } from '@/api/filmController';
import { ExclamationCircleOutlined, FileTextOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { history } from '@umijs/max';
import {
  Badge,
  Button,
  Card,
  Input,
  message,
  Modal,
  Space,
  Table,
  Tag,
  Tooltip,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import React, { useEffect, useMemo, useState } from 'react';
import './index.css';

const { confirm } = Modal;

/** 影片五态映射：草稿 / 准备上映 / 热映 / 正在上映 / 已下线 */
const FILM_STATUS_RECORD: Record<string, { status: 'success' | 'default' | 'warning' | 'error' | 'processing'; text: string }> = {
  draft: { status: 'default', text: '草稿' },
  upcoming: { status: 'warning', text: '准备上映' },
  hot: { status: 'processing', text: '热映' },
  published: { status: 'success', text: '正在上映' },
  offline: { status: 'default', text: '已下线' },
};

/** 影片管理页面 */
const FilmListPage: React.FC = () => {
  const [films, setFilms] = useState<API.Film[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await listAll2();
      const list = (res as any)?.data || [];
      // 新增的影片放最前面（按 id 倒序，雪花/自增 id 均按创建时间递增；雪花 id 不可 Number()）
      (list as API.Film[]).sort((a: API.Film, b: API.Film) => {
        const aid = String(a.id), bid = String(b.id);
        if (aid.length !== bid.length) return bid.length - aid.length;
        return bid.localeCompare(aid);
      });
      setFilms(list);
    } catch {
      message.error('加载影片列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 名称模糊搜索（客户端过滤，全量数据量小）
  const filteredFilms = useMemo(() => {
    if (!keyword.trim()) return films;
    const kw = keyword.trim().toLowerCase();
    return films.filter((f) => (f.name || '').toLowerCase().includes(kw));
  }, [films, keyword]);

  useEffect(() => {
    loadData();
  }, []);

  /** 切换状态 */
  const handleStatus = (id: string, status: string) => {
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
  const handleDelete = (id: string, name: string) => {
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
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 150,
      sorter: (a, b) => {
        if (!a.createTime) return -1;
        if (!b.createTime) return 1;
        return String(a.createTime).localeCompare(String(b.createTime));
      },
      showSorterTooltip: false,
      render: (val: string) => (val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-'),
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
          {(record.status === 'published' || record.status === 'hot' || record.status === 'upcoming') && (
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
          dataSource={filteredFilms}
          rowKey="id"
          loading={loading}
          title={() => (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Input.Search
                allowClear
                placeholder="搜索影片名称"
                style={{ width: 260 }}
                onSearch={(v) => setKeyword(v)}
                onChange={(e) => !e.target.value && setKeyword('')}
              />
              <span style={{ fontSize: 13, color: '#999' }}>共 {filteredFilms.length} 部</span>
            </div>
          )}
          pagination={{
            defaultPageSize: 10,
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
