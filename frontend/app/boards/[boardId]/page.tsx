'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { AuthGuard } from '../../../components/auth/AuthGuard';
import { useAuth } from '../../../components/auth/AuthProvider';
import { TopBar } from '../../../components/board/TopBar';
import { ColumnView } from '../../../components/column/ColumnView';
import { AddColumnButton } from '../../../components/column/AddColumnButton';
import { TaskModal } from '../../../components/task/TaskModal';
import { ShareBoardModal } from '../../../components/member/ShareBoardModal';
import { Avatar } from '../../../components/ui/Avatar';
import { Button } from '../../../components/ui/Button';
import { RoleBadge } from '../../../components/ui/Badge';
import { Spinner } from '../../../components/ui/Spinner';
import { useToast } from '../../../components/ui/Toast';
import { api, ApiRequestError } from '../../../lib/api';
import { accentForIndex } from '../../../lib/utils';
import type { Board, Column, Task, BoardMember, BoardRole } from '../../../types';

function renumber(tasks: Task[], columnId: string): Task[] {
  return tasks.map((t, i) => ({ ...t, columnId, position: i }));
}

function BoardPageContent() {
  const params = useParams<{ boardId: string }>();
  const boardId = params.boardId;
  const router = useRouter();
  const { user } = useAuth();
  const { show } = useToast();

  const [board, setBoard] = useState<Board | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [taskModal, setTaskModal] = useState<{ task: Task | null; columnId: string | null } | null>(
    null,
  );
  const [shareOpen, setShareOpen] = useState(false);
  const [activeDragTask, setActiveDragTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const loadAll = useCallback(async () => {
    const [b, c, t, m] = await Promise.all([
      api.boards.get(boardId),
      api.columns.list(boardId),
      api.tasks.list(boardId),
      api.boards.listMembers(boardId),
    ]);
    setBoard(b);
    setColumns(c.sort((a, z) => a.position - z.position));
    setTasks(t);
    setMembers(m);
  }, [boardId]);

  useEffect(() => {
    setIsLoading(true);
    loadAll()
      .catch((err) => {
        setLoadError(err instanceof ApiRequestError ? err.message : 'Could not load board');
      })
      .finally(() => setIsLoading(false));
  }, [loadAll]);

  const currentMembership = members.find((m) => m.userId === user?.id);
  const role: BoardRole = currentMembership?.role ?? 'VIEWER';
  const canEdit = role === 'OWNER' || role === 'EDITOR';
  const isOwner = role === 'OWNER';

  const tasksByColumn = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const col of columns) map[col.id] = [];
    for (const task of tasks) {
      if (!map[task.columnId]) map[task.columnId] = [];
      map[task.columnId].push(task);
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => a.position - b.position);
    }
    return map;
  }, [columns, tasks]);

  async function silentlyResync() {
    try {
      const fresh = await api.tasks.list(boardId);
      setTasks(fresh);
    } catch {
      // Best-effort; the next successful load will fix any drift.
    }
  }

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveDragTask(task ?? null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveDragTask(null);
    if (!over || !canEdit) return;

    const taskId = active.id as string;
    const activeTask = tasks.find((t) => t.id === taskId);
    if (!activeTask) return;

    const overType = (over.data.current as { type?: string } | undefined)?.type;
    const sourceColumnId = activeTask.columnId;
    const sourceList = tasksByColumn[sourceColumnId] ?? [];
    const oldIndex = sourceList.findIndex((t) => t.id === taskId);

    let targetColumnId: string;
    let overIndex: number;

    if (overType === 'column') {
      targetColumnId = over.id as string;
      overIndex = (tasksByColumn[targetColumnId] ?? []).length;
    } else {
      targetColumnId =
        (over.data.current as { columnId?: string } | undefined)?.columnId ?? sourceColumnId;
      const targetList = tasksByColumn[targetColumnId] ?? [];
      overIndex = targetList.findIndex((t) => t.id === over.id);
      if (overIndex === -1) overIndex = targetList.length;
    }

    if (sourceColumnId === targetColumnId && oldIndex === overIndex) return;

    if (sourceColumnId === targetColumnId) {
      const reordered = arrayMove(sourceList, oldIndex, overIndex);
      const targetPosition = reordered.findIndex((t) => t.id === taskId);
      const renumbered = renumber(reordered, sourceColumnId);
      setTasks((prev) => [
        ...prev.filter((t) => t.columnId !== sourceColumnId),
        ...renumbered,
      ]);
      try {
        await api.tasks.move(boardId, taskId, { targetColumnId: sourceColumnId, targetPosition });
      } catch (err) {
        show(err instanceof ApiRequestError ? err.message : 'Could not move task', 'error');
      } finally {
        silentlyResync();
      }
    } else {
      const newSourceList = sourceList.filter((t) => t.id !== taskId);
      const targetList = [...(tasksByColumn[targetColumnId] ?? [])];
      const insertIndex = Math.min(overIndex, targetList.length);
      targetList.splice(insertIndex, 0, { ...activeTask, columnId: targetColumnId });

      setTasks((prev) => [
        ...prev.filter((t) => t.columnId !== sourceColumnId && t.columnId !== targetColumnId),
        ...renumber(newSourceList, sourceColumnId),
        ...renumber(targetList, targetColumnId),
      ]);

      try {
        await api.tasks.move(boardId, taskId, { targetColumnId, targetPosition: insertIndex });
      } catch (err) {
        show(err instanceof ApiRequestError ? err.message : 'Could not move task', 'error');
      } finally {
        silentlyResync();
      }
    }
  }

  async function handleAddColumn(name: string) {
    try {
      const column = await api.columns.create(boardId, { name });
      setColumns((prev) => [...prev, column].sort((a, b) => a.position - b.position));
    } catch (err) {
      show(err instanceof ApiRequestError ? err.message : 'Could not add column', 'error');
    }
  }

  async function handleRenameColumn(columnId: string, name: string) {
    try {
      const updated = await api.columns.update(boardId, columnId, { name });
      setColumns((prev) => prev.map((c) => (c.id === columnId ? updated : c)));
    } catch (err) {
      show(err instanceof ApiRequestError ? err.message : 'Could not rename column', 'error');
    }
  }

  async function handleDeleteColumn(columnId: string) {
    if (!window.confirm('Delete this column and all its tasks?')) return;
    try {
      await api.columns.remove(boardId, columnId);
      setColumns((prev) => prev.filter((c) => c.id !== columnId));
      setTasks((prev) => prev.filter((t) => t.columnId !== columnId));
    } catch (err) {
      show(err instanceof ApiRequestError ? err.message : 'Could not delete column', 'error');
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (loadError || !board) {
    return (
      <div className="min-h-screen">
        <TopBar />
        <div className="mx-auto max-w-md px-6 py-24 text-center">
          <h2 className="text-lg font-semibold text-ink-primary">Can&apos;t open this board</h2>
          <p className="mt-2 text-sm text-ink-secondary">{loadError}</p>
          <Button className="mt-6" variant="secondary" onClick={() => router.push('/boards')}>
            Back to boards
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <TopBar>
        <div className="hidden items-center gap-2 border-l border-border-subtle pl-4 sm:flex">
          <h1 className="max-w-xs truncate text-sm font-medium text-ink-primary">{board.name}</h1>
          <RoleBadge role={role} />
        </div>
      </TopBar>

      <div className="flex items-center justify-between border-b border-border-subtle bg-surface px-6 py-3">
        <div className="min-w-0 sm:hidden">
          <h1 className="truncate text-base font-semibold text-ink-primary">{board.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          {board.description && (
            <p className="hidden max-w-md truncate text-sm text-ink-secondary md:block">
              {board.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {members.slice(0, 5).map((m) => (
              <Avatar key={m.id} name={m.name} size={28} />
            ))}
            {members.length > 5 && (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs text-ink-secondary ring-2 ring-canvas">
                +{members.length - 5}
              </div>
            )}
          </div>
          <Button variant="secondary" size="sm" onClick={() => setShareOpen(true)}>
            Add Member
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden px-6 py-5">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex h-full items-start gap-4">
            {columns.map((column, index) => (
              <ColumnView
                key={column.id}
                column={column}
                tasks={tasksByColumn[column.id] ?? []}
                accent={accentForIndex(index)}
                canEdit={canEdit}
                onAddTask={(columnId) => setTaskModal({ task: null, columnId })}
                onOpenTask={(task) => setTaskModal({ task, columnId: task.columnId })}
                onRenameColumn={handleRenameColumn}
                onDeleteColumn={handleDeleteColumn}
              />
            ))}
            {canEdit && <AddColumnButton onAdd={handleAddColumn} />}
          </div>

          <DragOverlay>
            {activeDragTask ? (
              <div className="w-72 rounded-sm border border-border-strong bg-surface-overlay px-3 py-2.5 shadow-depth-28">
                <p className="text-sm text-ink-primary">{activeDragTask.title}</p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <TaskModal
        open={taskModal !== null}
        onClose={() => setTaskModal(null)}
        boardId={boardId}
        columnId={taskModal?.columnId ?? null}
        task={taskModal?.task ?? null}
        canEdit={canEdit}
        onSaved={(task) => {
          setTasks((prev) => {
            const exists = prev.some((t) => t.id === task.id);
            return exists ? prev.map((t) => (t.id === task.id ? task : t)) : [...prev, task];
          });
        }}
        onDeleted={(taskId) => setTasks((prev) => prev.filter((t) => t.id !== taskId))}
      />

      <ShareBoardModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        boardId={boardId}
        members={members}
        currentUserId={user?.id ?? ''}
        isOwner={isOwner}
        onMembersChanged={setMembers}
      />
    </div>
  );
}

export default function BoardPage() {
  return (
    <AuthGuard>
      <BoardPageContent />
    </AuthGuard>
  );
}
