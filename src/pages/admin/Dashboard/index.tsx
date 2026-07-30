import { getStats } from '@/api/dashboardController';
import { StatisticCard } from '@ant-design/pro-components';
import { Col, Row } from 'antd';
import React, { useEffect, useState } from 'react';

const { Statistic } = StatisticCard;

interface DashboardData {
  todayOrders: number;
  todayRevenue: number;
  totalFilms: number;
  totalCinemas: number;
  totalUsers: number;
  todaySchedules: number;
}

const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getStats();
      if (res.data) {
        setData(res.data as DashboardData);
      }
    } catch (e) {
      console.error('加载看板数据失败', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <StatisticCard
            loading={loading}
            statistic={{
              title: '今日订单数',
              value: data?.todayOrders ?? 0,
              suffix: '单',
            }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatisticCard
            loading={loading}
            statistic={{
              title: '今日收入',
              value: data?.todayRevenue ?? 0,
              prefix: '¥',
              precision: 2,
            }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatisticCard
            loading={loading}
            statistic={{
              title: '总影片数',
              value: data?.totalFilms ?? 0,
              suffix: '部',
            }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatisticCard
            loading={loading}
            statistic={{
              title: '总影院数',
              value: data?.totalCinemas ?? 0,
              suffix: '家',
            }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatisticCard
            loading={loading}
            statistic={{
              title: '注册用户',
              value: data?.totalUsers ?? 0,
              suffix: '人',
            }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatisticCard
            loading={loading}
            statistic={{
              title: '今日场次',
              value: data?.todaySchedules ?? 0,
              suffix: '场',
            }}
          />
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;
