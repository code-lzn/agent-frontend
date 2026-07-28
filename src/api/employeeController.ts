// @ts-ignore
/* eslint-disable */
import request from '@/libs/request';

/** getMyProfile GET /api/employee/profile */
export async function getMyProfileUsingGet(options?: { [key: string]: any }) {
  return request<API.BaseResponseEmpProfileVO_>('/api/employee/profile', {
    method: 'GET',
    ...(options || {}),
  });
}

/** updateMyProfile POST /api/employee/profileUpdate */
export async function updateMyProfileUsingPost(
  body: API.EmpProfileUpdateRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/employee/profileUpdate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
