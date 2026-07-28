// @ts-ignore
/* eslint-disable */
import request from '@/libs/request';

/** apply POST /api/attendance/makeup/apply */
export async function applyUsingPost1(
  body: API.MakeupPunchApplyRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseMakeupPunchVO_>(
    '/api/attendance/makeup/apply',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      data: body,
      ...(options || {}),
    },
  );
}

/** approve POST /api/attendance/makeup/approve */
export async function approveUsingPost2(
  body: API.ApprovalRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseMakeupPunchVO_>(
    '/api/attendance/makeup/approve',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      data: body,
      ...(options || {}),
    },
  );
}

/** getMyMakeupPunches GET /api/attendance/makeup/my */
export async function getMyMakeupPunchesUsingGet(options?: {
  [key: string]: any;
}) {
  return request<API.BaseResponseListMakeupPunchVO_>(
    '/api/attendance/makeup/my',
    {
      method: 'GET',
      ...(options || {}),
    },
  );
}
