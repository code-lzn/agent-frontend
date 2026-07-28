// @ts-ignore
/* eslint-disable */
import request from '@/libs/request';

/** health GET /api/health */
export async function healthUsingGet(options?: { [key: string]: any }) {
  return request<API.BaseResponseString_>('/api/health', {
    method: 'GET',
    ...(options || {}),
  });
}

/** health PUT /api/health */
export async function healthUsingPut(options?: { [key: string]: any }) {
  return request<API.BaseResponseString_>('/api/health', {
    method: 'PUT',
    ...(options || {}),
  });
}

/** health POST /api/health */
export async function healthUsingPost(options?: { [key: string]: any }) {
  return request<API.BaseResponseString_>('/api/health', {
    method: 'POST',
    ...(options || {}),
  });
}

/** health DELETE /api/health */
export async function healthUsingDelete(options?: { [key: string]: any }) {
  return request<API.BaseResponseString_>('/api/health', {
    method: 'DELETE',
    ...(options || {}),
  });
}

/** health PATCH /api/health */
export async function healthUsingPatch(options?: { [key: string]: any }) {
  return request<API.BaseResponseString_>('/api/health', {
    method: 'PATCH',
    ...(options || {}),
  });
}
