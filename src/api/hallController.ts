// @ts-ignore
/* eslint-disable */
import request from '@/libs/request';

/** 此处后端没有提供注释 GET /hall/getInfo/${param0} */
export async function getInfo5(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getInfo5Params,
  options?: { [key: string]: any },
) {
  const { id: param0, ...queryParams } = params;
  return request<API.Hall>(`/hall/getInfo/${param0}`, {
    method: 'GET',
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 GET /hall/list */
export async function list3(options?: { [key: string]: any }) {
  return request<API.Hall[]>('/hall/list', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 GET /hall/listByCinema/${param0} */
export async function listByCinema(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.listByCinemaParams,
  options?: { [key: string]: any },
) {
  const { cinemaId: param0, ...queryParams } = params;
  return request<API.BaseResponseListHall>(`/hall/listByCinema/${param0}`, {
    method: 'GET',
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 GET /hall/page */
export async function page7(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.page7Params,
  options?: { [key: string]: any },
) {
  return request<API.PageHall>('/hall/page', {
    method: 'GET',
    params: {
      ...params,
      page: undefined,
      ...params['page'],
    },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 DELETE /hall/remove/${param0} */
export async function remove5(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.remove5Params,
  options?: { [key: string]: any },
) {
  const { id: param0, ...queryParams } = params;
  return request<API.BaseResponseBoolean>(`/hall/remove/${param0}`, {
    method: 'DELETE',
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 POST /hall/save */
export async function save5(body: API.Hall, options?: { [key: string]: any }) {
  return request<API.BaseResponseBoolean>('/hall/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 PUT /hall/update */
export async function update5(
  body: API.Hall,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean>('/hall/update', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
