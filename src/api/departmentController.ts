// @ts-ignore
/* eslint-disable */
import request from '@/libs/request';

/** addDepartment POST /api/departments/add */
export async function addDepartmentUsingPost(
  body: API.DepartmentAddRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseMapStringLong_>('/api/departments/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** deleteDepartment POST /api/departments/delete */
export async function deleteDepartmentUsingPost(
  body: API.DeleteRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/departments/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** mergeDepartments POST /api/departments/merge */
export async function mergeDepartmentsUsingPost(
  body: API.DepartmentMergeRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseDepartmentMergeResultVO_>(
    '/api/departments/merge',
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

/** getDepartmentTree GET /api/departments/tree */
export async function getDepartmentTreeUsingGet(options?: {
  [key: string]: any;
}) {
  return request<API.BaseResponseListDepartmentTreeVO_>(
    '/api/departments/tree',
    {
      method: 'GET',
      ...(options || {}),
    },
  );
}

/** updateDepartment PUT /api/departments/update */
export async function updateDepartmentUsingPut(
  body: API.DepartmentUpdateRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/departments/update', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
