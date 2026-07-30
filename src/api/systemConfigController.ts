// @ts-ignore
/* eslint-disable */
import request from '@/libs/request';

/** 此处后端没有提供注释 GET /systemConfig/getByKey/${param0} */
export async function getByKey(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getByKeyParams,
  options?: { [key: string]: any },
) {
  const { configKey: param0, ...queryParams } = params;
  return request<API.BaseResponseSystemConfig>(
    `/systemConfig/getByKey/${param0}`,
    {
      method: 'GET',
      params: { ...queryParams },
      ...(options || {}),
    },
  );
}

/** 此处后端没有提供注释 GET /systemConfig/getInfo/${param0} */
export async function getInfo1(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getInfo1Params,
  options?: { [key: string]: any },
) {
  const { id: param0, ...queryParams } = params;
  return request<API.SystemConfig>(`/systemConfig/getInfo/${param0}`, {
    method: 'GET',
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 GET /systemConfig/list */
export async function list1(options?: { [key: string]: any }) {
  return request<API.SystemConfig[]>('/systemConfig/list', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 GET /systemConfig/page */
export async function page5(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.page5Params,
  options?: { [key: string]: any },
) {
  return request<API.PageSystemConfig>('/systemConfig/page', {
    method: 'GET',
    params: {
      ...params,
      page: undefined,
      ...params['page'],
    },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 DELETE /systemConfig/remove/${param0} */
export async function remove1(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.remove1Params,
  options?: { [key: string]: any },
) {
  const { id: param0, ...queryParams } = params;
  return request<API.BaseResponseBoolean>(`/systemConfig/remove/${param0}`, {
    method: 'DELETE',
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 POST /systemConfig/save */
export async function save1(
  body: API.SystemConfig,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean>('/systemConfig/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 PUT /systemConfig/update */
export async function update1(
  body: API.SystemConfig,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean>('/systemConfig/update', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 PUT /systemConfig/updateByKey */
export async function updateByKey(
  body: API.SystemConfig,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean>('/systemConfig/updateByKey', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
