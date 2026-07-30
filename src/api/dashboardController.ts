// @ts-ignore
/* eslint-disable */
import request from '@/libs/request';

/** 此处后端没有提供注释 GET /dashboard/stats */
export async function getStats(options?: { [key: string]: any }) {
  return request<API.BaseResponseDashboardVO>('/dashboard/stats', {
    method: 'GET',
    ...(options || {}),
  });
}
