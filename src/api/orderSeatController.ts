// @ts-ignore
/* eslint-disable */
import request from '@/libs/request';

/** 此处后端没有提供注释 GET /orderSeat/getInfo/${param0} */
export async function getInfo4(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getInfo4Params,
  options?: { [key: string]: any },
) {
  const { id: param0, ...queryParams } = params;
  return request<API.OrderSeat>(`/orderSeat/getInfo/${param0}`, {
    method: 'GET',
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 GET /orderSeat/list */
export async function list2(options?: { [key: string]: any }) {
  return request<API.OrderSeat[]>('/orderSeat/list', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 GET /orderSeat/page */
export async function page6(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.page6Params,
  options?: { [key: string]: any },
) {
  return request<API.PageOrderSeat>('/orderSeat/page', {
    method: 'GET',
    params: {
      ...params,
      page: undefined,
      ...params['page'],
    },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 DELETE /orderSeat/remove/${param0} */
export async function remove4(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.remove4Params,
  options?: { [key: string]: any },
) {
  const { id: param0, ...queryParams } = params;
  return request<API.BaseResponseBoolean>(`/orderSeat/remove/${param0}`, {
    method: 'DELETE',
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 POST /orderSeat/save */
export async function save4(
  body: API.OrderSeat,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean>('/orderSeat/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 PUT /orderSeat/update */
export async function update4(
  body: API.OrderSeat,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean>('/orderSeat/update', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
