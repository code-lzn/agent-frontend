// @ts-ignore
/* eslint-disable */
import request from '@/libs/request';

/** 此处后端没有提供注释 GET /cinema/getInfo/${param0} */
export async function getInfo7(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getInfo7Params,
  options?: { [key: string]: any },
) {
  const { id: param0, ...queryParams } = params;
  return request<API.BaseResponseCinema>(`/cinema/getInfo/${param0}`, {
    method: 'GET',
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 GET /cinema/list */
export async function list4(options?: { [key: string]: any }) {
  return request<API.BaseResponseListCinema>('/cinema/list', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 GET /cinema/page */
export async function page8(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.page8Params,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponsePageCinema>('/cinema/page', {
    method: 'GET',
    params: {
      ...params,
      page: undefined,
      ...params['page'],
    },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 DELETE /cinema/remove/${param0} */
export async function remove7(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.remove7Params,
  options?: { [key: string]: any },
) {
  const { id: param0, ...queryParams } = params;
  return request<API.BaseResponseBoolean>(`/cinema/remove/${param0}`, {
    method: 'DELETE',
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 POST /cinema/save */
export async function save7(
  body: API.Cinema,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean>('/cinema/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 PUT /cinema/update */
export async function update7(
  body: API.Cinema,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean>('/cinema/update', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
