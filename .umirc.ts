import { defineConfig } from '@umijs/max';

export default defineConfig({
  antd: {},
  access: {},
  model: {},
  initialState: {},
  request: {},
  layout: {
    title: 'AI电影票',
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
      name: '影片',
      path: '/film',
      component: './Film',
    },
    {
      name: '影片详情',
      path: '/film/:id',
      component: './Film/Detail',
      hideInMenu: true,
    },
    {
      name: '排期',
      path: '/schedule',
      component: './Schedule',
      hideInMenu: true,
    },
    {
      name: '选座',
      path: '/seat',
      component: './Seat',
      hideInMenu: true,
    },
    {
      name: '确认订单',
      path: '/order/confirm',
      component: './Order/confirm',
      hideInMenu: true,
    },
    {
      name: '订单列表',
      path: '/order/list',
      component: './Order/list',
    },
    {
      name: '订单详情',
      path: '/order/:id',
      component: './Order/detail',
      hideInMenu: true,
    },
    {
      name: 'AI 购票',
      path: '/ai-chat',
      component: './AiChat',
    },
    {
      name: '个人中心',
      path: '/user/profile',
      component: './User/Profile',
    },
    // ===== 后台管理路由 =====
    {
      path: '/admin',
      component: '@/layouts/AdminLayout',
      layout: false,
      routes: [
        { path: '/admin', redirect: '/admin/dashboard' },
        {
          name: '数据看板',
          path: '/admin/dashboard',
          component: './admin/Dashboard',
        },
        {
          name: '影片管理',
          path: '/admin/film',
          component: './admin/Film/index',
        },
        {
          name: '新增影片',
          path: '/admin/film/add',
          component: './admin/Film/form',
          hideInMenu: true,
        },
        {
          name: '影片编辑',
          path: '/admin/film/:id',
          component: './admin/Film/form',
          hideInMenu: true,
        },
        {
          name: '影院管理',
          path: '/admin/cinema',
          component: './admin/Cinema/index',
        },
        {
          name: '影院详情',
          path: '/admin/cinema/:id',
          component: './admin/Cinema/detail',
          hideInMenu: true,
        },
        {
          name: '场次管理',
          path: '/admin/schedule',
          component: './admin/Schedule/index',
        },
        {
          name: '新增场次',
          path: '/admin/schedule/add',
          component: './admin/Schedule/form',
        },
        {
          name: '订单管理',
          path: '/admin/order',
          component: './admin/Order/index',
        },
        {
          name: '用户管理',
          path: '/admin/user',
          component: './admin/User/index',
        },
        {
          name: '系统配置',
          path: '/admin/config',
          component: './admin/Config/index',
        },
      ],
    },
  ],
  npmClient: 'pnpm',
  utoopack: {},
});
