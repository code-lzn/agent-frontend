// @ts-ignore
/* eslint-disable */
import request from '@/libs/request';

/** 此处后端没有提供注释 GET /movie-graph/chat-stream */
export async function doChatStream(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.doChatStreamParams,
  options?: { [key: string]: any },
) {
  return request<API.ServerSentEventString[]>('/movie-graph/chat-stream', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 POST /movie-graph/reset */
export async function resetConversation(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.resetConversationParams,
  options?: { [key: string]: any },
) {
  return request<string>('/movie-graph/reset', {
    method: 'POST',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}
