'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cx } from '../../lib/utils';
import type { Task } from '../../types';

export function TaskCard({
  task,
  canEdit,
  onClick,
}: {
  task: Task;
  canEdit: boolean;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: !canEdit,
    data: { type: 'task', columnId: task.columnId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(canEdit ? attributes : {})}
      {...(canEdit ? listeners : {})}
      onClick={onClick}
      className={cx(
        'group rounded-sm border border-border-subtle bg-surface-overlay px-3 py-2.5 shadow-depth-2 transition-all duration-150',
        canEdit ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer',
        'hover:border-border-strong hover:shadow-depth-8',
        isDragging && 'opacity-40 shadow-depth-16',
      )}
    >
      <p className="text-sm text-ink-primary">{task.title}</p>
      {task.description && (
        <p className="mt-1 line-clamp-2 text-xs text-ink-tertiary">{task.description}</p>
      )}
    </div>
  );
}
