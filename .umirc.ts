import { defineConfig } from '@umijs/max';

export default defineConfig({
  antd: {
    locale: 'zh_CN',
  },
  // hash 路由：直接访问/刷新任意路径不依赖服务器 history 回退
  history: { type: 'hash' },
  access: {},
  model: {},
  initialState: {},
  request: {},
  layout: {
    title: '妙语购票',
  },
  routes: [
    // ===== 根路径：按角色重定向（管理员→后台管理，普通用户/游客→首页） =====
    {
      path: '/',
      component: './Redirect',
      layout: false,
      hideInMenu: true,
    },
    // ===== 登录页（独立全屏，不走 UserLayout） =====
    {
      name: '用户登录',
      path: '/user/login',
      component: '../app/user/login/page',
      layout: false,
      hideInMenu: true,
    },
    // ===== C端主布局（UserLayout 包裹：左侧侧边栏 + 右侧内容区） =====
    {
      path: '/',
      component: '@/layouts/UserLayout',
      layout: false,
      routes: [
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
          name: '影院',
          path: '/cinema',
          exact: true,
          component: './Cinema',
        },
        {
          name: '影院详情',
          path: '/cinema/:id',
          exact: true,
          component: './Cinema/Detail',
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
          wrappers: ['@/wrappers/AuthGuard'],
        },
        {
          name: '确认订单',
          path: '/order/confirm',
          component: './Order/confirm',
          hideInMenu: true,
          wrappers: ['@/wrappers/AuthGuard'],
        },
        {
          name: '订单列表',
          path: '/order/list',
          component: './Order/list',
          wrappers: ['@/wrappers/AuthGuard'],
        },
        {
          name: '订单详情',
          path: '/order/:id',
          component: './Order/detail',
          hideInMenu: true,
          wrappers: ['@/wrappers/AuthGuard'],
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
      ],
    },
    // ===== 后台管理路由 =====
    {
      path: '/admin',
      component: '@/layouts/AdminLayout',
      layout: false,
      access: 'canSeeAdmin',
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
          name: '编辑场次',
          path: '/admin/schedule/edit/:id',
          component: './admin/Schedule/form',
          hideInMenu: true,
        },
        {
          name: '批量新增',
          path: '/admin/schedule/batch',
          component: './admin/Schedule/batch',
          hideInMenu: true,
        },
        {
          name: '订单管理',
          path: '/admin/order',
          component: './admin/Order/index',
        },
        {
          name: '票务核销',
          path: '/admin/ticket',
          component: './admin/Ticket/index',
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
