// 运行时配置

import { getLoginUserUsingGet } from '@/api/userController';

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
    const res = await getLoginUserUsingGet();
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
    logo: 'https://img.alicdn.com/tfs/TB1YHEpwUT1gK0jSZFhXXaAtVXa-28-27.svg',
    menu: {
      locale: false,
    },
  };
};
