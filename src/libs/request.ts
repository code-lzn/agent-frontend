import axios from 'axios';

const DEV_BASE_URL = 'http://localhost:8123/api';
const PROD_BASE_URL = 'http://xx.xx.xx.xx';
const myAxios = axios.create({
  baseURL: process.env.NODE_ENV === 'production' ? PROD_BASE_URL : DEV_BASE_URL,
  timeout: 60000,
  withCredentials: true,
});

// 请求拦截器
myAxios.interceptors.request.use(
  function (config) {
    // ★ 从 localStorage 读取 JWT Token，通过 Authorization header 携带
    // 解决微信登录跨域 Cookie 无法传递的问题（替代 Cookie/Session 认证）
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = 'Bearer ' + token;
    }
    return config;
  },
  function (error) {
    return Promise.reject(error);
  },
);

/** 获取当前路由（兼容 hash 路由：从 hash 中解析，否则用 pathname） */
function getCurrentRoute(): string {
  const hash = window.location.hash;
  if (hash && hash.startsWith('#/')) {
    return hash.slice(1);
  }
  return window.location.pathname + window.location.search;
}

// 响应拦截器
myAxios.interceptors.response.use(
  function (response) {
    const { data } = response;
    // 未登录
    if (data.code === 40100) {
      // 清除过期的 JWT Token
      localStorage.removeItem('token');
      const route = getCurrentRoute();
      // getLoginUser 和登录页/个人中心自身：直接返回让调用方自行判断，避免跳转循环
      if (
        response.request.responseURL.includes('user/get/login') ||
        route.includes('/user/login') ||
        route.includes('/user/profile')
      ) {
        return data;
      }
      // 其他接口：统一跳转登录页（带 redirect 回跳），并 reject Promise 防止调用方 .then() 误报错误
      window.location.href = `/user/login?redirect=${encodeURIComponent(route)}`;
      return Promise.reject(new Error('请先登录'));
    }
    // 其他业务错误
    if (data.code !== 0) {
      throw new Error(data.message || '服务器错误');
    }
    return data;
  },
  function (error) {
    return Promise.reject(error);
  },
);

export default myAxios;
