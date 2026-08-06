import { Navigate, useModel } from '@umijs/max';
import { Spin } from 'antd';
import React from 'react';

/** 根路径按角色跳转：管理员进后台管理，普通用户/游客进首页 */
const RedirectPage: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  // getInitialState 完成前 initialState 为 null，先等待，避免先闪首页再跳后台
  if (!initialState) {
    return (
      <div style={{ textAlign: 'center', paddingTop: 80 }}>
        <Spin size="large" />
      </div>
    );
  }
  const userRole = initialState.currentUser?.userRole;
  return <Navigate to={userRole === 'admin' ? '/admin/dashboard' : '/home'} replace />;
};

export default RedirectPage;
