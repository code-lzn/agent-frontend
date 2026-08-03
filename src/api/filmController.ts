// @ts-ignore
/* eslint-disable */
import request from '@/libs/request';

/** 此处后端没有提供注释 GET /film/${param0} */
export async function getFilm(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getFilmParams,
  options?: { [key: string]: any },
) {
  const { id: param0, ...queryParams } = params;
  return request<API.BaseResponseFilm>(`/film/${param0}`, {
    method: 'GET',
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 GET /film/getInfo/${param0} */
export async function getInfo6(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getInfo6Params,
  options?: { [key: string]: any },
) {
  const { id: param0, ...queryParams } = params;
  return request<API.BaseResponseFilm>(`/film/getInfo/${param0}`, {
    method: 'GET',
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 GET /film/list */
export async function listFilm(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.listFilmParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponsePageFilm>('/film/list', {
    method: 'GET',
    params: {
      ...params,
      filmQueryRequest: undefined,
      ...params['filmQueryRequest'],
    },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 GET /film/listAll */
export async function listAll2(options?: { [key: string]: any }) {
  return request<API.BaseResponseListFilm>('/film/listAll', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 GET /film/now-showing */
export async function nowShowing(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.nowShowingParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseListFilm>('/film/now-showing', {
    method: 'GET',
    params: {
      // limit has a default value: 8
      limit: '8',
      ...params,
    },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 POST /film/page */
export async function page2(
  body: API.FilmQueryRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponsePageFilm>('/film/page', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 GET /film/recommended */
export async function recommended(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.recommendedParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseListFilm>('/film/recommended', {
    method: 'GET',
    params: {
      // limit has a default value: 4
      limit: '4',
      ...params,
    },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 DELETE /film/remove/${param0} */
export async function remove6(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.remove6Params,
  options?: { [key: string]: any },
) {
  const { id: param0, ...queryParams } = params;
  return request<API.BaseResponseBoolean>(`/film/remove/${param0}`, {
    method: 'DELETE',
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 POST /film/save */
export async function save6(body: API.Film, options?: { [key: string]: any }) {
  return request<API.BaseResponseLong>('/film/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 GET /film/search */
export async function search(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.searchParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponsePageFilm>('/film/search', {
    method: 'GET',
    params: {
      // pageNum has a default value: 1
      pageNum: '1',
      // pageSize has a default value: 10
      pageSize: '10',
      ...params,
    },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 PUT /film/status/${param0} */
export async function updateStatus(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.updateStatusParams,
  options?: { [key: string]: any },
) {
  const { id: param0, ...queryParams } = params;
  return request<API.BaseResponseBoolean>(`/film/status/${param0}`, {
    method: 'PUT',
    params: {
      ...queryParams,
    },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 PUT /film/update */
export async function update6(
  body: API.Film,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean>('/film/update', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
