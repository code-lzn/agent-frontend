// @ts-ignore
/* eslint-disable */
import request from '@/libs/request';

/** 此处后端没有提供注释 POST /payment/alipay/notify */
export async function notify(options?: { [key: string]: any }) {
  return request<string>('/payment/alipay/notify', {
    method: 'POST',
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 GET /payment/alipay/pay */
export async function payPage(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.payPageParams,
  options?: { [key: string]: any },
) {
  return request<string>('/payment/alipay/pay', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}
