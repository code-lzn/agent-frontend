// @ts-ignore
/* eslint-disable */
import request from '@/libs/request';

/** 此处后端没有提供注释 GET /movie-agent/chat */
export async function doChatGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.doChatGetParams,
  options?: { [key: string]: any },
) {
  return request<string>('/movie-agent/chat', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 POST /movie-agent/chat */
export async function doChat(
  body: API.MovieChatRequest,
  options?: { [key: string]: any },
) {
  return request<string>('/movie-agent/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 GET /movie-agent/chat-stream */
export async function doChatStream(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.doChatStreamParams,
  options?: { [key: string]: any },
) {
  return request<API.ServerSentEventString[]>('/movie-agent/chat-stream', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 POST /movie-agent/reset */
export async function resetConversation(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.resetConversationParams,
  options?: { [key: string]: any },
) {
  return request<string>('/movie-agent/reset', {
    method: 'POST',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}
