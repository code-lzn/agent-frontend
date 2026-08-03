// 运行时配置

import { getLoginUser } from '@/api/userController';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

// Hash 路由修正：非 / 路径（如 /admin/film）说明用户直接访问了非 hash 路由，
// 自动将 pathname 转为 hash 路由格式，防止管理员页显示用户端内容
(function fixHashRoute() {
  if (typeof window === 'undefined') return;
  const { pathname, hash } = window.location;
  if (pathname !== '/' && pathname !== '/index.html' && !pathname.startsWith('/api')) {
    // 用 pathname 作为目标路由（忽略可能错误的 hash）
    window.location.replace('/#/' + pathname.slice(1) + window.location.search);
  }
})();

dayjs.locale('zh-cn');

// 抑制 findDOMNode 弃用警告（来自 @ant-design/pro-components 内部依赖 rc-resize-observer）
// React 18 开发模式下该警告通过 console.error 输出
const originalError = console.error;
console.error = (...args: any[]) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('findDOMNode') || args[0].includes('destroyOnClose'))
  ) {
    return;
  }
  originalError.apply(console, args);
};

// 全局初始化数据配置，用于 Layout 用户信息和权限初始化
// 更多信息见文档：https://umijs.org/docs/api/runtime-config#getinitialstate
export async function getInitialState() {
  const initialState = {
    name: '@umijs/max',
    currentUser: undefined as API.LoginUserVO | undefined,
  };
  try {
    const res = await getLoginUser();
    if (res.data) {
      initialState.currentUser = res.data;
    }
  } catch (error) {
    // 未登录，保持 currentUser 为空
  }
  return initialState;
}

export const layout = () => {
  return {
    title: '妙语购票',
    logo: '🎬',
    menu: {
      locale: false,
    },
  };
};
