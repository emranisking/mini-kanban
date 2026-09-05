'use client';

import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TaskCard } from '../task/TaskCard';
import { Input } from '../ui/Input';
import { cx } from '../../lib/utils';
import type { ColumnAccent } from '../../lib/utils';
import type { Column, Task } from '../../types';

const accentDot: Record<ColumnAccent, string> = {
  blue: 'bg-column-blue',
  amber: 'bg-column-amber',
  violet: 'bg-column-violet',
  green: 'bg-column-green',
  rose: 'bg-column-rose',
  teal: 'bg-column-teal',
};

export function ColumnView({
  column,
  tasks,
  accent,
  canEdit,
  onAddTask,
  onOpenTask,
  onRenameColumn,
  onDeleteColumn,
}: {
  column: Column;
  tasks: Task[];
  accent: ColumnAccent;
  canEdit: boolean;
  onAddTask: (columnId: string) => void;
  onOpenTask: (task: Task) => void;
  onRenameColumn: (columnId: string, name: string) => void;
  onDeleteColumn: (columnId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id, data: { type: 'column' } });
  const [isRenaming, setIsRenaming] = useState(false);
  const [name, setName] = useState(column.name);
  const [menuOpen, setMenuOpen] = useState(false);

  function commitRename() {
    setIsRenaming(false);
    const trimmed = name.trim();
    if (trimmed && trimmed !== column.name) {
      onRenameColumn(column.id, trimmed);
    } else {
      setName(column.name);
    }
  }

  return (
    <div className="flex w-72 flex-shrink-0 flex-col">
      <div className="mb-2 flex items-center justify-between px-1">
        <div className="flex min-w-0 items-center gap-2">
          <span className={cx('h-2 w-2 flex-shrink-0 rounded-full', accentDot[accent])} />
          {isRenaming ? (
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => e.key === 'Enter' && commitRename()}
              className="h-7 px-2 text-sm"
            />
          ) : (
            <h3
              onClick={() => canEdit && setIsRenaming(true)}
              className={cx('truncate text-sm font-semibold text-ink-primary', canEdit && 'cursor-text')}
            >
              {column.name}
            </h3>
          )}
          <span className="flex-shrink-0 rounded-full bg-white/5 px-1.5 py-0.5 text-[11px] text-ink-tertiary">
            {tasks.length}
          </span>
        </div>
        {canEdit && (
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="rounded-sm p-1 text-ink-tertiary transition-colors hover:bg-white/5 hover:text-ink-primary"
              aria-label="Column options"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="3.5" r="1.2" fill="currentColor" />
                <circle cx="8" cy="8" r="1.2" fill="currentColor" />
                <circle cx="8" cy="12.5" r="1.2" fill="currentColor" />
              </svg>
            </button>
            {menuOpen && (
              <div className="acrylic absolute right-0 top-8 z-10 w-40 animate-rise-in rounded-md bg-surface-overlay/95 p-1 shadow-depth-16">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setIsRenaming(true);
                  }}
                  className="block w-full rounded-sm px-3 py-1.5 text-left text-sm text-ink-secondary hover:bg-white/5 hover:text-ink-primary"
                >
                  Rename
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDeleteColumn(column.id);
                  }}
                  className="block w-full rounded-sm px-3 py-1.5 text-left text-sm text-danger hover:bg-danger/10"
                >
                  Delete column
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div
        ref={setNodeRef}
        className={cx(
          'acrylic flex min-h-[120px] flex-1 flex-col gap-2 rounded-md p-2.5 transition-colors',
          isOver && 'ring-1 ring-accent',
        )}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} canEdit={canEdit} onClick={() => onOpenTask(task)} />
          ))}
        </SortableContext>

        {canEdit && (
          <button
            onClick={() => onAddTask(column.id)}
            className="mt-1 flex items-center gap-1.5 rounded-sm px-2 py-1.5 text-left text-sm text-ink-tertiary transition-colors hover:bg-white/5 hover:text-ink-secondary"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            Add task
          </button>
        )}
      </div>
    </div>
  );
}
