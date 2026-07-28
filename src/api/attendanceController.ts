// @ts-ignore
/* eslint-disable */
import request from '@/libs/request';

/** getCalendar GET /api/attendance/calendar */
export async function getCalendarUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getCalendarUsingGETParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseAttendanceCalendarVO_>(
    '/api/attendance/calendar',
    {
      method: 'GET',
      params: {
        ...params,
      },
      ...(options || {}),
    },
  );
}

/** punch POST /api/attendance/punch */
export async function punchUsingPost(
  body: API.PunchRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseAttendanceVO_>('/api/attendance/punch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** getMonthRecords GET /api/attendance/records */
export async function getMonthRecordsUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getMonthRecordsUsingGETParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseListAttendanceVO_>('/api/attendance/records', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** getTodayStatus GET /api/attendance/today */
export async function getTodayStatusUsingGet(options?: { [key: string]: any }) {
  return request<API.BaseResponseAttendanceVO_>('/api/attendance/today', {
    method: 'GET',
    ...(options || {}),
  });
}
