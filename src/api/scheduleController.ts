// @ts-ignore
/* eslint-disable */
import request from '@/libs/request';

/** 此处后端没有提供注释 POST /schedule/batchSave */
export async function batchSave(
  body: API.Schedule[],
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseInteger>('/schedule/batchSave', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 POST /schedule/checkConflict */
export async function checkConflict(
  body: API.ConflictCheckRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean>('/schedule/checkConflict', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 GET /schedule/getInfo/${param0} */
export async function getInfo3(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getInfo3Params,
  options?: { [key: string]: any },
) {
  const { id: param0, ...queryParams } = params;
  return request<API.BaseResponseSchedule>(`/schedule/getInfo/${param0}`, {
    method: 'GET',
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 GET /schedule/list */
export async function listSchedule(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.listScheduleParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseListScheduleVO>('/schedule/list', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 GET /schedule/listAll */
export async function listAll1(options?: { [key: string]: any }) {
  return request<API.BaseResponseListSchedule>('/schedule/listAll', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 POST /schedule/page */
export async function page1(
  body: API.PageSchedule,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponsePageSchedule>('/schedule/page', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 DELETE /schedule/remove/${param0} */
export async function remove3(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.remove3Params,
  options?: { [key: string]: any },
) {
  const { id: param0, ...queryParams } = params;
  return request<API.BaseResponseBoolean>(`/schedule/remove/${param0}`, {
    method: 'DELETE',
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 POST /schedule/save */
export async function save3(
  body: API.Schedule,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseLong>('/schedule/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 PUT /schedule/update */
export async function update3(
  body: API.Schedule,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean>('/schedule/update', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
