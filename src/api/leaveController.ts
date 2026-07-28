// @ts-ignore
/* eslint-disable */
import request from '@/libs/request';

/** getApprovalProgress GET /api/attendance/leave/${param0}/progress */
export async function getApprovalProgressUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getApprovalProgressUsingGETParams,
  options?: { [key: string]: any },
) {
  const { id: param0, ...queryParams } = params;
  return request<API.BaseResponseLeaveProgressVO_>(
    `/api/attendance/leave/${param0}/progress`,
    {
      method: 'GET',
      params: { ...queryParams },
      ...(options || {}),
    },
  );
}

/** apply POST /api/attendance/leave/apply */
export async function applyUsingPost(
  body: API.LeaveApplyRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseLeaveVO_>('/api/attendance/leave/apply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** approve POST /api/attendance/leave/approve */
export async function approveUsingPost1(
  body: API.ApprovalRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseLeaveVO_>('/api/attendance/leave/approve', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** cancel POST /api/attendance/leave/cancel/${param0} */
export async function cancelUsingPost(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.cancelUsingPOSTParams,
  options?: { [key: string]: any },
) {
  const { id: param0, ...queryParams } = params;
  return request<API.BaseResponseBoolean_>(
    `/api/attendance/leave/cancel/${param0}`,
    {
      method: 'POST',
      params: { ...queryParams },
      ...(options || {}),
    },
  );
}

/** getMyLeaves GET /api/attendance/leave/my */
export async function getMyLeavesUsingGet(options?: { [key: string]: any }) {
  return request<API.BaseResponseListLeaveVO_>('/api/attendance/leave/my', {
    method: 'GET',
    ...(options || {}),
  });
}
