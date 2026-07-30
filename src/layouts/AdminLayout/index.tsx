import {
  BarChartOutlined,
  CalendarOutlined,
  FileTextOutlined,
  HomeOutlined,
  LogoutOutlined,
  OrderedListOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { history, Outlet, useLocation } from '@umijs/max';
import { Layout, Menu } from 'antd';
import React from 'react';
import './index.css';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: '/admin/dashboard', icon: <BarChartOutlined />, label: '数据看板' },
  { key: '/admin/film', icon: <FileTextOutlined />, label: '影片管理' },
  { key: '/admin/cinema', icon: <HomeOutlined />, label: '影院管理' },
  { key: '/admin/schedule', icon: <CalendarOutlined />, label: '场次管理' },
  { key: '/admin/order', icon: <OrderedListOutlined />, label: '订单管理' },
  { key: '/admin/user', icon: <UserOutlined />, label: '用户管理' },
  { key: '/admin/config', icon: <SettingOutlined />, label: '系统配置' },
];

const pageTitleMap: Record<string, string> = {
  '/admin/dashboard': '数据看板',
  '/admin/film': '影片管理',
  '/admin/cinema': '影院管理',
  '/admin/schedule': '场次管理',
  '/admin/order': '订单管理',
  '/admin/user': '用户管理',
  '/admin/config': '系统配置',
};

const AdminLayout: React.FC = () => {
  const location = useLocation();
  const selectedKey = '/' + location.pathname.split('/').slice(1, 3).join('/');
  const pageTitle = pageTitleMap[selectedKey] || '后台管理';

  const today = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  return (
    <Layout className="admin-layout">
      {/* 侧边栏 */}
      <Sider width={240} className="admin-sider">
        {/* Logo */}
        <div className="sider-brand">
          <div className="brand-icon">🎬</div>
          <div className="brand-text">
            <span className="brand-title">电影票智能体</span>
            <span className="brand-badge">管理</span>
          </div>
        </div>

        {/* 菜单 */}
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => history.push(key)}
          className="sider-menu"
        />

        {/* 底部用户 */}
        <div className="sider-footer">
          <div className="sider-user">
            <div className="user-avatar">管</div>
            <div className="user-meta">
              <div className="user-name">管理员</div>
              <div className="user-role">后台管理</div>
            </div>
            <LogoutOutlined className="user-logout" />
          </div>
        </div>
      </Sider>

      {/* 右侧主体 */}
      <Layout>
        {/* 顶部栏 */}
        <Header className="admin-header">
          <h1 className="header-title">{pageTitle}</h1>
          <span className="header-date">{today}</span>
        </Header>

        {/* 内容区 */}
        <Content className="admin-content">
          <div className="admin-content-inner">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
