// @ts-ignore
/* eslint-disable */
import request from '@/libs/request';

/** getSalarySlipDetail POST /api/salary/slip/${param0} */
export async function getSalarySlipDetailUsingPost(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getSalarySlipDetailUsingPOSTParams,
  body: API.VerifyPasswordRequest,
  options?: { [key: string]: any },
) {
  const { id: param0, ...queryParams } = params;
  return request<API.BaseResponseSalarySlipDetailVO_>(
    `/api/salary/slip/${param0}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      params: { ...queryParams },
      data: body,
      ...(options || {}),
    },
  );
}

/** getMySalarySlips GET /api/salary/slips */
export async function getMySalarySlipsUsingGet(options?: {
  [key: string]: any;
}) {
  return request<API.BaseResponseListSalarySlipVO_>('/api/salary/slips', {
    method: 'GET',
    ...(options || {}),
  });
}

/** getMySalaryTrend GET /api/salary/trend */
export async function getMySalaryTrendUsingGet(options?: {
  [key: string]: any;
}) {
  return request<API.BaseResponseListSalaryTrendVO_>('/api/salary/trend', {
    method: 'GET',
    ...(options || {}),
  });
}
