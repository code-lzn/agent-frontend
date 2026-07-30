// @ts-ignore
/* eslint-disable */
import request from '@/libs/request';

/** 此处后端没有提供注释 GET /chatSession/getInfo/${param0} */
export async function getInfo8(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getInfo8Params,
  options?: { [key: string]: any },
) {
  const { id: param0, ...queryParams } = params;
  return request<API.ChatSession>(`/chatSession/getInfo/${param0}`, {
    method: 'GET',
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 GET /chatSession/list */
export async function list5(options?: { [key: string]: any }) {
  return request<API.ChatSession[]>('/chatSession/list', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 GET /chatSession/page */
export async function page9(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.page9Params,
  options?: { [key: string]: any },
) {
  return request<API.PageChatSession>('/chatSession/page', {
    method: 'GET',
    params: {
      ...params,
      page: undefined,
      ...params['page'],
    },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 DELETE /chatSession/remove/${param0} */
export async function remove8(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.remove8Params,
  options?: { [key: string]: any },
) {
  const { id: param0, ...queryParams } = params;
  return request<API.BaseResponseBoolean>(`/chatSession/remove/${param0}`, {
    method: 'DELETE',
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 POST /chatSession/save */
export async function save8(
  body: API.ChatSession,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean>('/chatSession/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 PUT /chatSession/update */
export async function update8(
  body: API.ChatSession,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean>('/chatSession/update', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
