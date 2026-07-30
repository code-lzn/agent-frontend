// @ts-ignore
/* eslint-disable */
import request from '@/libs/request';

/** 此处后端没有提供注释 POST /chatHistory/delete */
export async function deleteUsingPost(
  body: API.DeleteRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean>('/chatHistory/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 GET /chatHistory/getInfo/${param0} */
export async function getInfo9(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getInfo9Params,
  options?: { [key: string]: any },
) {
  const { id: param0, ...queryParams } = params;
  return request<API.BaseResponseChatHistory>(
    `/chatHistory/getInfo/${param0}`,
    {
      method: 'GET',
      params: { ...queryParams },
      ...(options || {}),
    },
  );
}

/** 此处后端没有提供注释 GET /chatHistory/list */
export async function list6(options?: { [key: string]: any }) {
  return request<API.BaseResponseListChatHistory>('/chatHistory/list', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 POST /chatHistory/list/page */
export async function page3(
  body: API.ChatHistoryQueryRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponsePageChatHistory>('/chatHistory/list/page', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 GET /chatHistory/listBySession/${param0} */
export async function listBySession(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.listBySessionParams,
  options?: { [key: string]: any },
) {
  const { sessionId: param0, ...queryParams } = params;
  return request<API.BaseResponseListChatHistory>(
    `/chatHistory/listBySession/${param0}`,
    {
      method: 'GET',
      params: { ...queryParams },
      ...(options || {}),
    },
  );
}

/** 此处后端没有提供注释 DELETE /chatHistory/remove/${param0} */
export async function remove9(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.remove9Params,
  options?: { [key: string]: any },
) {
  const { id: param0, ...queryParams } = params;
  return request<API.BaseResponseBoolean>(`/chatHistory/remove/${param0}`, {
    method: 'DELETE',
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 POST /chatHistory/save */
export async function save9(
  body: API.ChatHistory,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean>('/chatHistory/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 PUT /chatHistory/update */
export async function update9(
  body: API.ChatHistory,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean>('/chatHistory/update', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
