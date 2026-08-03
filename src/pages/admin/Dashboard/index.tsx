import { getStats } from '@/api/dashboardController';
import { ReloadOutlined } from '@ant-design/icons';
import { StatisticCard } from '@ant-design/pro-components';
import { Button, Card, Col, message, Row, Tooltip } from 'antd';
import * as echarts from 'echarts';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import './index.css';

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
  const barChartRef = useRef<HTMLDivElement>(null);
  const pieChartRef = useRef<HTMLDivElement>(null);
  const barInstance = useRef<echarts.ECharts>();
  const pieInstance = useRef<echarts.ECharts>();

  useEffect(() => {
    loadData();
    return () => {
      barInstance.current?.dispose();
      pieInstance.current?.dispose();
    };
  }, []);

  useEffect(() => {
    if (data) {
      initCharts();
    }
  }, [data]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getStats();
      if (res.data) {
        setData(res.data as DashboardData);
      }
    } catch (e) {
      message.error('加载看板数据失败');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const initCharts = useCallback(() => {
    if (barChartRef.current) {
      barInstance.current?.dispose();
      const bar = echarts.init(barChartRef.current);
      barInstance.current = bar;
      bar.setOption({
        tooltip: { trigger: 'axis' },
        grid: { left: 60, right: 60, top: 40, bottom: 30 },
        xAxis: {
          type: 'category',
          data: ['今日订单', '今日场次', '上架影片', '影院总数', '注册用户'],
          axisLabel: { color: '#8c8c8c' },
        },
        yAxis: [
          {
            type: 'value',
            name: '数量',
            axisLabel: { color: '#8c8c8c' },
            splitLine: { lineStyle: { color: '#f0f0f0' } },
          },
          {
            type: 'value',
            name: '收入(元)',
            axisLabel: { color: '#8c8c8c' },
            splitLine: { show: false },
          },
        ],
        series: [
          {
            name: '数量',
            type: 'bar',
            data: [
              data?.todayOrders ?? 0,
              data?.todaySchedules ?? 0,
              data?.totalFilms ?? 0,
              data?.totalCinemas ?? 0,
              data?.totalUsers ?? 0,
            ],
            itemStyle: {
              borderRadius: [4, 4, 0, 0],
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#1677ff' },
                { offset: 1, color: '#69b1ff' },
              ]),
            },
            barWidth: 36,
          },
          {
            name: '今日收入',
            type: 'bar',
            yAxisIndex: 1,
            data: [
              Math.round(Number(data?.todayRevenue ?? 0) * 100) / 100,
              null,
              null,
              null,
              null,
            ],
            itemStyle: {
              borderRadius: [4, 4, 0, 0],
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#52c41a' },
                { offset: 1, color: '#95de64' },
              ]),
            },
            barWidth: 36,
          },
        ],
      });
    }

    if (pieChartRef.current) {
      pieInstance.current?.dispose();
      const pie = echarts.init(pieChartRef.current);
      pieInstance.current = pie;
      const pieData = [
        { name: '今日订单', value: data?.todayOrders ?? 0 },
        { name: '今日场次', value: data?.todaySchedules ?? 0 },
        { name: '上架影片', value: data?.totalFilms ?? 0 },
        { name: '影院总数', value: data?.totalCinemas ?? 0 },
      ].filter((item) => item.value > 0);

      pie.setOption({
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        series: [
          {
            type: 'pie',
            radius: ['40%', '65%'],
            center: ['50%', '50%'],
            avoidLabelOverlap: true,
            itemStyle: {
              borderRadius: 6,
              borderColor: '#fff',
              borderWidth: 2,
            },
            label: {
              show: true,
              formatter: '{b}\n{d}%',
              color: '#595959',
              fontSize: 12,
            },
            emphasis: {
              label: { show: true, fontSize: 14, fontWeight: 'bold' },
            },
            data: pieData,
            color: ['#1677ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1', '#13c2c2'],
          },
        ],
      });
    }
  }, [data, barChartRef, pieChartRef]);

  return (
    <div className="dashboard-page">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={4}>
          <StatisticCard
            className="dashboard-stat-card"
            loading={loading}
            statistic={{
              title: '今日订单',
              value: data?.todayOrders ?? 0,
              suffix: '单',
            }}
          />
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <StatisticCard
            className="dashboard-stat-card"
            loading={loading}
            statistic={{
              title: '今日收入',
              value: data?.todayRevenue ?? 0,
              prefix: '¥',
              precision: 2,
            }}
          />
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <StatisticCard
            className="dashboard-stat-card"
            loading={loading}
            statistic={{
              title: '今日场次',
              value: data?.todaySchedules ?? 0,
              suffix: '场',
            }}
          />
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <StatisticCard
            className="dashboard-stat-card"
            loading={loading}
            statistic={{
              title: '上架影片',
              value: data?.totalFilms ?? 0,
              suffix: '部',
            }}
          />
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <StatisticCard
            className="dashboard-stat-card"
            loading={loading}
            statistic={{
              title: '影院总数',
              value: data?.totalCinemas ?? 0,
              suffix: '家',
            }}
          />
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <StatisticCard
            className="dashboard-stat-card"
            loading={loading}
            statistic={{
              title: '注册用户',
              value: data?.totalUsers ?? 0,
              suffix: '人',
            }}
          />
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col xs={24} lg={14}>
          <Card
            className="dashboard-chart-card"
            title="运营概览"
            extra={
              <Tooltip title="刷新">
                <Button icon={<ReloadOutlined />} size="small" onClick={loadData} />
              </Tooltip>
            }
          >
            <div ref={barChartRef} style={{ height: 320 }} />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card
            className="dashboard-chart-card"
            title="数据分布"
            extra={
              <Tooltip title="刷新">
                <Button icon={<ReloadOutlined />} size="small" onClick={loadData} />
              </Tooltip>
            }
          >
            <div ref={pieChartRef} style={{ height: 320 }} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;
