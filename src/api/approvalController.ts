// @ts-ignore
/* eslint-disable */
import request from '@/libs/request';

/** approve POST /api/approval/approve */
export async function approveUsingPost(
  body: API.ApprovalActionRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/approval/approve', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** createDelegation POST /api/approval/delegation */
export async function createDelegationUsingPost(
  body: API.DelegationRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseLong_>('/api/approval/delegation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** cancelDelegation POST /api/approval/delegation/cancel/${param0} */
export async function cancelDelegationUsingPost(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.cancelDelegationUsingPOSTParams,
  options?: { [key: string]: any },
) {
  const { id: param0, ...queryParams } = params;
  return request<API.BaseResponseBoolean_>(
    `/api/approval/delegation/cancel/${param0}`,
    {
      method: 'POST',
      params: { ...queryParams },
      ...(options || {}),
    },
  );
}

/** getMyDelegations GET /api/approval/delegation/my */
export async function getMyDelegationsUsingGet(options?: {
  [key: string]: any;
}) {
  return request<API.BaseResponseListApprovalDelegationVO_>(
    '/api/approval/delegation/my',
    {
      method: 'GET',
      ...(options || {}),
    },
  );
}

/** getApprovalDetail GET /api/approval/detail/${param0} */
export async function getApprovalDetailUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getApprovalDetailUsingGETParams,
  options?: { [key: string]: any },
) {
  const { recordId: param0, ...queryParams } = params;
  return request<API.BaseResponseApprovalDetailVO_>(
    `/api/approval/detail/${param0}`,
    {
      method: 'GET',
      params: { ...queryParams },
      ...(options || {}),
    },
  );
}

/** getPendingList GET /api/approval/pending */
export async function getPendingListUsingGet(options?: { [key: string]: any }) {
  return request<API.BaseResponseListApprovalPendingVO_>(
    '/api/approval/pending',
    {
      method: 'GET',
      ...(options || {}),
    },
  );
}

/** reject POST /api/approval/reject */
export async function rejectUsingPost(
  body: API.ApprovalActionRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/approval/reject', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** transfer POST /api/approval/transfer */
export async function transferUsingPost(
  body: API.ApprovalActionRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/approval/transfer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
