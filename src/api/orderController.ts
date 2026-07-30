// @ts-ignore
/* eslint-disable */
import request from '@/libs/request';

/** 此处后端没有提供注释 GET /order/${param0} */
export async function getOrderDetail(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getOrderDetailParams,
  options?: { [key: string]: any },
) {
  const { id: param0, ...queryParams } = params;
  return request<API.BaseResponseOrderVO>(`/order/${param0}`, {
    method: 'GET',
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 POST /order/admin/cancel/${param0} */
export async function adminCancel(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.adminCancelParams,
  options?: { [key: string]: any },
) {
  const { id: param0, ...queryParams } = params;
  return request<API.BaseResponseBoolean>(`/order/admin/cancel/${param0}`, {
    method: 'POST',
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 GET /order/admin/detail/${param0} */
export async function adminDetail(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.adminDetailParams,
  options?: { [key: string]: any },
) {
  const { id: param0, ...queryParams } = params;
  return request<API.BaseResponseOrderVO>(`/order/admin/detail/${param0}`, {
    method: 'GET',
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 GET /order/admin/list */
export async function adminList(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.adminListParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponsePageOrder>('/order/admin/list', {
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

/** 此处后端没有提供注释 POST /order/create */
export async function createOrder(
  body: API.CreateOrderRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseOrderVO>('/order/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 GET /order/list */
export async function listOrders(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.listOrdersParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponsePageOrderVO>('/order/list', {
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

/** 此处后端没有提供注释 POST /order/lockSeat */
export async function lockSeat(
  body: API.LockSeatRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean>('/order/lockSeat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 POST /order/pay */
export async function payOrder(
  body: API.PayOrderRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponsePayOrderVO>('/order/pay', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
