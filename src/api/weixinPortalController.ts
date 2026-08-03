// @ts-ignore
/* eslint-disable */
import request from '@/libs/request';

/** 此处后端没有提供注释 GET /v1/weixin/portal/checkLogin */
export async function checkLogin(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.checkLoginParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseMapStringObject>(
    '/v1/weixin/portal/checkLogin',
    {
      method: 'GET',
      params: {
        ...params,
      },
      ...(options || {}),
    },
  );
}

/** 此处后端没有提供注释 GET /v1/weixin/portal/createQrCode */
export async function createQrCode(options?: { [key: string]: any }) {
  return request<API.BaseResponseMapStringString>(
    '/v1/weixin/portal/createQrCode',
    {
      method: 'GET',
      ...(options || {}),
    },
  );
}

/** 此处后端没有提供注释 GET /v1/weixin/portal/receive */
export async function validate(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.validateParams,
  options?: { [key: string]: any },
) {
  return request<string>('/v1/weixin/portal/receive', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 POST /v1/weixin/portal/receive */
export async function post(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.postParams,
  body: string,
  options?: { [key: string]: any },
) {
  return request<string>('/v1/weixin/portal/receive', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    params: {
      ...params,
    },
    data: body,
    ...(options || {}),
  });
}
