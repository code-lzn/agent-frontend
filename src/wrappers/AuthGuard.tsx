import { history, useLocation, useModel } from '@umijs/max';
import { useEffect } from 'react';
import { Outlet } from '@umijs/max';

/**
 * 登录守卫：未登录跳转统一登录页，登录后按身份跳转由登录页处理。
 * 用于需要登录的购票流程路由（选座 / 订单）。
 */
const AuthGuard: React.FC = () => {
  const { initialState, loading } = useModel('@@initialState');
  const location = useLocation();
  const loggedIn = !!initialState?.currentUser;

  useEffect(() => {
    if (loading) return; // 等待全局初始化完成，避免已登录用户闪跳登录页
    if (!loggedIn) {
      const target = `${location.pathname}${location.search}`;
      history.replace(`/user/login?redirect=${encodeURIComponent(target)}`);
    }
  }, [loading, loggedIn, location.pathname, location.search]);

  if (loading || !loggedIn) return null;
  return <Outlet />;
};

export default AuthGuard;
