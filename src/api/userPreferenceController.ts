// @ts-ignore
/* eslint-disable */
import request from '@/libs/request';

/** 前台 - 获取我的偏好 GET /userPreference/my */
export async function getMyPreference(options?: { [key: string]: any }) {
  return request<API.UserPreference>('/userPreference/my', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 前台 - 保存我的偏好 POST /userPreference/my */
export async function saveMyPreference(
  body: API.UserPreference,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean>('/userPreference/my', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 GET /userPreference/getInfo/${param0} */
export async function getInfo(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getInfoParams,
  options?: { [key: string]: any },
) {
  const { id: param0, ...queryParams } = params;
  return request<API.UserPreference>(`/userPreference/getInfo/${param0}`, {
    method: 'GET',
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 GET /userPreference/list */
export async function list(options?: { [key: string]: any }) {
  return request<API.UserPreference[]>('/userPreference/list', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 GET /userPreference/page */
export async function page4(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.page4Params,
  options?: { [key: string]: any },
) {
  return request<API.PageUserPreference>('/userPreference/page', {
    method: 'GET',
    params: {
      ...params,
      page: undefined,
      ...params['page'],
    },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 DELETE /userPreference/remove/${param0} */
export async function remove(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.removeParams,
  options?: { [key: string]: any },
) {
  const { id: param0, ...queryParams } = params;
  return request<API.BaseResponseBoolean>(`/userPreference/remove/${param0}`, {
    method: 'DELETE',
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 POST /userPreference/save */
export async function save(
  body: API.UserPreference,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean>('/userPreference/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 PUT /userPreference/update */
export async function update(
  body: API.UserPreference,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean>('/userPreference/update', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
