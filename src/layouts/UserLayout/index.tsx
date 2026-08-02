import { useModel, useLocation, Outlet, history } from '@umijs/max';
import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import React, { useState } from 'react';
import './index.css';

const pageTitleMap: Record<string, string> = {
  '/home': '首页',
  '/film': '影片',
  '/schedule': '选择场次',
  '/seat': '选座',
  '/order/confirm': '确认订单',
  '/order/list': '我的订单',
  '/ai-chat': 'AI 购票',
  '/user/profile': '个人中心',
};

const navItems = [
  { key: '/home', icon: '🏠', label: '首页' },
  { key: '/film', icon: '🎬', label: '影片' },
  { key: '/order/list', icon: '🎫', label: '订单' },
  { key: '/user/profile', icon: '👤', label: '我的' },
];

const UserLayout: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;
  const location = useLocation();
  const [searchVal, setSearchVal] = useState('');

  // 匹配当前活跃的导航项
  const currentNav = navItems.find((item) =>
    location.pathname.startsWith(item.key),
  );

  const pageTitle =
    pageTitleMap[location.pathname] ||
    Object.entries(pageTitleMap).find(([k]) =>
      location.pathname.startsWith(k),
    )?.[1] ||
    '首页';

  const handleSearch = () => {
    if (searchVal.trim()) {
      history.push(`/film?keyword=${encodeURIComponent(searchVal.trim())}`);
    }
  };

  return (
    <div className="app-layout">
      {/* ===== 侧边栏（对照原型） ===== */}
      <aside className="sidebar">
        <div
          className="sidebar-brand"
          onClick={() => history.push('/home')}
        >
          <div className="logo">🎬</div>
          <div className="brand-text">
            AI<span>电影票</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.key}
              className={`nav-item ${currentNav?.key === item.key ? 'active' : ''}`}
              onClick={() => history.push(item.key)}
            >
              <span className="icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
          <div className="nav-divider" />
          <button
            className="nav-item"
            style={{ color: 'var(--red)' }}
            onClick={() => history.push('/ai-chat')}
          >
            <span className="icon">🤖</span>
            AI 购票
          </button>
        </nav>
        <div className="sidebar-footer">
          <button
            className="user-item"
            onClick={() => history.push('/user/profile')}
          >
            <div className="avatar">
              {currentUser?.userName?.charAt(0)?.toUpperCase() ||
                currentUser?.userAccount?.charAt(0)?.toUpperCase() ||
                'U'}
            </div>
            <div>
              <div className="name">
                {currentUser?.userName || currentUser?.userAccount || '未登录'}
              </div>
              <div className="role">
                {currentUser?.userRole === 'admin' ? '管理员' : '普通用户'}
              </div>
            </div>
          </button>
        </div>
      </aside>

      {/* ===== 主区域 ===== */}
      <div className="main-area">
        {/* 顶部栏 */}
        <header className="top-header">
          <div className="page-title">{pageTitle}</div>
          <div className="spacer" />
          <div className="header-search">
            <span className="icon">🔍</span>
            <input
              type="text"
              placeholder="搜影片、搜影院"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch();
              }}
            />
          </div>
          <div className="header-actions">
            <button
              className="h-btn ai-btn"
              onClick={() => history.push('/ai-chat')}
            >
              🤖 AI 购票
            </button>
          </div>
        </header>

        {/* 内容区 */}
        <div className="content-area">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default UserLayout;
