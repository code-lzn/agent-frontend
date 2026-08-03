// @ts-ignore
/* eslint-disable */
import request from '@/libs/request';

/** 此处后端没有提供注释 GET /geo/ip-locate */
export async function ipLocate(options?: { [key: string]: any }) {
  return request<API.BaseResponseMapStringObject>('/geo/ip-locate', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 GET /geo/reverse */
export async function reverse(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.reverseParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseMapStringObject>('/geo/reverse', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}
