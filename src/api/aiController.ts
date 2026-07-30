// @ts-ignore
/* eslint-disable */
import request from '@/libs/request';

/** 此处后端没有提供注释 GET /ai/chat */
export async function doChat1(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.doChat1Params,
  options?: { [key: string]: any },
) {
  return request<string>('/ai/chat', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 GET /ai/chat-stream */
export async function doChatStream1(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.doChatStream1Params,
  options?: { [key: string]: any },
) {
  return request<string[]>('/ai/chat-stream', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}
