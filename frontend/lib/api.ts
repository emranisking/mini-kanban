import { getToken, clearSession } from './auth';
import type { ApiError } from '../types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export class ApiRequestError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (response.status === 401) {
    clearSession();
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
    throw new ApiRequestError(401, 'Session expired. Please sign in again.');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const err = body as ApiError;
    const message = Array.isArray(err.message) ? err.message.join(', ') : err.message;
    throw new ApiRequestError(response.status, message || 'Something went wrong');
  }

  return body as T;
}

export const api = {
  auth: {
    register: (data: { name: string; email: string; password: string }) =>
      request<{ accessToken: string; user: { id: string; name: string; email: string } }>(
        '/auth/register',
        { method: 'POST', body: JSON.stringify(data) },
      ),
    login: (data: { email: string; password: string }) =>
      request<{ accessToken: string; user: { id: string; name: string; email: string } }>(
        '/auth/login',
        { method: 'POST', body: JSON.stringify(data) },
      ),
    me: () => request<{ id: string; name: string; email: string }>('/auth/me'),
  },
  boards: {
    list: () => request<import('../types').Board[]>('/boards'),
    create: (data: { name: string; description?: string }) =>
      request<import('../types').Board>('/boards', { method: 'POST', body: JSON.stringify(data) }),
    get: (boardId: string) => request<import('../types').Board>(`/boards/${boardId}`),
    update: (boardId: string, data: { name?: string; description?: string }) =>
      request<import('../types').Board>(`/boards/${boardId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    remove: (boardId: string) => request<void>(`/boards/${boardId}`, { method: 'DELETE' }),
    listMembers: (boardId: string) =>
      request<import('../types').BoardMember[]>(`/boards/${boardId}/members`),
    addMember: (boardId: string, data: { email: string; role: string }) =>
      request<import('../types').BoardMember>(`/boards/${boardId}/members`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateMember: (boardId: string, userId: string, data: { role: string }) =>
      request<import('../types').BoardMember>(`/boards/${boardId}/members/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    removeMember: (boardId: string, userId: string) =>
      request<void>(`/boards/${boardId}/members/${userId}`, { method: 'DELETE' }),
  },
  columns: {
    list: (boardId: string) => request<import('../types').Column[]>(`/boards/${boardId}/columns`),
    create: (boardId: string, data: { name: string; position?: number }) =>
      request<import('../types').Column>(`/boards/${boardId}/columns`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (boardId: string, columnId: string, data: { name?: string; position?: number }) =>
      request<import('../types').Column>(`/boards/${boardId}/columns/${columnId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    remove: (boardId: string, columnId: string) =>
      request<void>(`/boards/${boardId}/columns/${columnId}`, { method: 'DELETE' }),
  },
  tasks: {
    list: (boardId: string) => request<import('../types').Task[]>(`/boards/${boardId}/tasks`),
    create: (boardId: string, data: { columnId: string; title: string; description?: string }) =>
      request<import('../types').Task>(`/boards/${boardId}/tasks`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (boardId: string, taskId: string, data: { title?: string; description?: string }) =>
      request<import('../types').Task>(`/boards/${boardId}/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    remove: (boardId: string, taskId: string) =>
      request<void>(`/boards/${boardId}/tasks/${taskId}`, { method: 'DELETE' }),
    move: (boardId: string, taskId: string, data: { targetColumnId: string; targetPosition: number }) =>
      request<import('../types').Task>(`/boards/${boardId}/tasks/${taskId}/move`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },
};
