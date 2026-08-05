// @ts-ignore
/* eslint-disable */
import request from '@/libs/request';

/** 此处后端没有提供注释 POST /ticket/admin/checkin */
export async function checkin(
  body: API.TicketQueryRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseTicketVO>('/ticket/admin/checkin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 POST /ticket/admin/query */
export async function query(
  body: API.TicketQueryRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseTicketVO>('/ticket/admin/query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
