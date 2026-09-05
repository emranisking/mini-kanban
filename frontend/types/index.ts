export type BoardRole = 'OWNER' | 'EDITOR' | 'VIEWER';

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Board {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface BoardMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: BoardRole;
}

export interface Column {
  id: string;
  boardId: string;
  name: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  boardId: string;
  columnId: string;
  title: string;
  description: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
}
