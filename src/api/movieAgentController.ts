// @ts-ignore
/* eslint-disable */
import request from '@/libs/request';

/** 电影票 Agent 对话 POST /movie-agent/chat */
export async function movieAgentChat(
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

/** 电影票 Agent 流式对话 GET /movie-agent/chat-stream */
export async function movieAgentChatStream(
  params: { message: string; conversationId: string; userId?: number },
  options?: { [key: string]: any },
) {
  return request<string>('/movie-agent/chat-stream', {
    method: 'GET',
    params: { ...params },
    ...(options || {}),
  });
}

/** 重置会话 POST /movie-agent/reset */
export async function resetConversation(
  params: { conversationId: string },
  options?: { [key: string]: any },
) {
  return request<string>('/movie-agent/reset', {
    method: 'POST',
    params: { ...params },
    ...(options || {}),
  });
}
