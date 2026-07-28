// @ts-ignore
/* eslint-disable */
import request from '@/libs/request';

/** bindPhone POST /api/account/bindPhone */
export async function bindPhoneUsingPost(
  body: API.BindPhoneRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/account/bindPhone', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** changePassword POST /api/account/changePassword */
export async function changePasswordUsingPost(
  body: API.ChangePasswordRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/account/changePassword', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** getLoginLogs GET /api/account/loginLogs */
export async function getLoginLogsUsingGet(options?: { [key: string]: any }) {
  return request<API.BaseResponseListLoginLogVO_>('/api/account/loginLogs', {
    method: 'GET',
    ...(options || {}),
  });
}
