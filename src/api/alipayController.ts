// @ts-ignore
/* eslint-disable */
import request from '@/libs/request';

/** 此处后端没有提供注释 POST /payment/alipay/notify */
export async function notify(options?: { [key: string]: any }) {
  return request<any>('/payment/alipay/notify', {
    method: 'POST',
    ...(options || {}),
  });
}
