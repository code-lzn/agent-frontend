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
    return config;
  },
  function (error) {
    return Promise.reject(error);
  },
);

// 响应拦截器
myAxios.interceptors.response.use(
  function (response) {
    const { data } = response;
    // 未登录
    if (data.code === 40100) {
      // getLoginUser 和 Profile 页面自身：直接返回让调用方自行判断
      if (
        response.request.responseURL.includes('user/get/login') ||
        window.location.pathname.includes('/user/profile')
      ) {
        return data;
      }
      // 其他接口：跳转登录页，并 reject Promise 防止调用方 .then() 误报错误
      window.location.href = `/user/profile?redirect=${encodeURIComponent(
        window.location.pathname + window.location.search,
      )}`;
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
