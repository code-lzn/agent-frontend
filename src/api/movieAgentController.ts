// @ts-ignore
/* eslint-disable */
import request from '@/libs/request';

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
export async function doChatStream1(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.doChatStream1Params,
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
export async function resetConversation1(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.resetConversation1Params,
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

/** 此处后端没有提供注释 GET /movie-agent/smart-stream */
export async function doSmartStream(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.doSmartStreamParams,
  options?: { [key: string]: any },
) {
  return request<API.ServerSentEventString[]>('/movie-agent/smart-stream', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}
