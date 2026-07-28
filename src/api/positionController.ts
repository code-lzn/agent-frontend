// @ts-ignore
/* eslint-disable */
import request from '@/libs/request';

/** addPosition POST /api/positions/add */
export async function addPositionUsingPost(
  body: API.PositionAddRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseMapStringLong_>('/api/positions/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** deletePosition POST /api/positions/delete */
export async function deletePositionUsingPost(
  body: API.DeleteRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/positions/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** listPositions GET /api/positions/list */
export async function listPositionsUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.listPositionsUsingGETParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseListPositionVO_>('/api/positions/list', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** getSequences GET /api/positions/sequences */
export async function getSequencesUsingGet(options?: { [key: string]: any }) {
  return request<API.BaseResponseListSequenceLevelVO_>(
    '/api/positions/sequences',
    {
      method: 'GET',
      ...(options || {}),
    },
  );
}

/** updatePosition PUT /api/positions/update */
export async function updatePositionUsingPut(
  body: API.PositionUpdateRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/positions/update', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
