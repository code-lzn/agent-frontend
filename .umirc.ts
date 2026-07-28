import { defineConfig } from '@umijs/max';

export default defineConfig({
  antd: {},
  access: {},
  model: {},
  initialState: {},
  request: {},
  layout: {
    title: '@umijs/max',
  },
  routes: [
    {
      path: '/',
      redirect: '/home',
    },
    {
      name: '首页',
      path: '/home',
      component: './Home',
    },
    {
      name: '权限演示',
      path: '/access',
      component: './Access',
    },
    {
      name: ' CRUD 示例',
      path: '/table',
      component: './Table',
    },
    {
      name: '用户登录',
      path: '/user/login',
      component: '../app/user/login/page',
    },
    {
      name: '用户注册',
      path: '/user/register',
      component: '../app/user/register/page',
    },
  ],
  npmClient: 'pnpm',
  utoopack: {},
});
