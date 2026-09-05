'use client';

import { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input, Textarea } from '../ui/Input';
import { Button } from '../ui/Button';
import { api, ApiRequestError } from '../../lib/api';
import type { Task } from '../../types';

interface TaskModalProps {
  open: boolean;
  onClose: () => void;
  boardId: string;
  columnId: string | null;
  task: Task | null;
  canEdit: boolean;
  onSaved: (task: Task) => void;
  onDeleted: (taskId: string) => void;
}

export function TaskModal({
  open,
  onClose,
  boardId,
  columnId,
  task,
  canEdit,
  onSaved,
  onDeleted,
}: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(task?.title ?? '');
      setDescription(task?.description ?? '');
      setError(null);
    }
  }, [open, task]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (task) {
        const updated = await api.tasks.update(boardId, task.id, {
          title,
          description: description || undefined,
        });
        onSaved(updated);
      } else if (columnId) {
        const created = await api.tasks.create(boardId, {
          columnId,
          title,
          description: description || undefined,
        });
        onSaved(created);
      }
      onClose();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not save task');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!task) return;
    if (!window.confirm('Delete this task? This cannot be undone.')) return;
    setIsSubmitting(true);
    try {
      await api.tasks.remove(boardId, task.id);
      onDeleted(task.id);
      onClose();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not delete task');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={task ? 'Task details' : 'New task'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Title"
          required
          autoFocus
          disabled={!canEdit}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs doing?"
        />
        <Textarea
          label="Description (optional)"
          rows={4}
          disabled={!canEdit}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add more detail…"
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        {canEdit && (
          <div className="flex items-center justify-between pt-1">
            {task ? (
              <Button type="button" variant="danger" size="sm" onClick={handleDelete} isLoading={isSubmitting}>
                Delete
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                {task ? 'Save changes' : 'Create task'}
              </Button>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
}
