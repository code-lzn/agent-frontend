// @ts-ignore
/* eslint-disable */
import request from '@/libs/request';

/** 此处后端没有提供注释 GET /seat/getInfo/${param0} */
export async function getInfo2(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getInfo2Params,
  options?: { [key: string]: any },
) {
  const { id: param0, ...queryParams } = params;
  return request<API.BaseResponseSeat>(`/seat/getInfo/${param0}`, {
    method: 'GET',
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 GET /seat/listAll */
export async function listAll(options?: { [key: string]: any }) {
  return request<API.BaseResponseListSeat>('/seat/listAll', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 POST /seat/page */
export async function page(
  body: API.PageSeat,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponsePageSeat>('/seat/page', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 DELETE /seat/remove/${param0} */
export async function remove2(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.remove2Params,
  options?: { [key: string]: any },
) {
  const { id: param0, ...queryParams } = params;
  return request<API.BaseResponseBoolean>(`/seat/remove/${param0}`, {
    method: 'DELETE',
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 POST /seat/save */
export async function save2(body: API.Seat, options?: { [key: string]: any }) {
  return request<API.BaseResponseLong>('/seat/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 GET /seat/seatmap/${param0} */
export async function getSeatMap(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getSeatMapParams,
  options?: { [key: string]: any },
) {
  const { scheduleId: param0, ...queryParams } = params;
  return request<API.BaseResponseSeatMapVO>(`/seat/seatmap/${param0}`, {
    method: 'GET',
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 PUT /seat/update */
export async function update2(
  body: API.Seat,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean>('/seat/update', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
