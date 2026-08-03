import { getInfo7 } from '@/api/cinemaController';
import { ReloadOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from '@umijs/max';
import {
  Badge, Button, Card, Descriptions, message, Space, Tag, Tooltip,
} from 'antd';
import React, { useEffect, useState } from 'react';
import HallManager from './HallManager';
import './index.css';

const CinemaDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cinema, setCinema] = useState<API.Cinema | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const cinemaRes = await getInfo7({ id: id as any });
      setCinema(cinemaRes.data);
    } catch {
      message.error('加载影院信息失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

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
          <Tooltip title="刷新">
            <Button icon={<ReloadOutlined />} onClick={loadData} />
          </Tooltip>
        }
      >
        {id && <HallManager cinemaId={id} cinemaName={cinema?.name} />}
      </Card>
    </div>
  );
};

export default CinemaDetailPage;
