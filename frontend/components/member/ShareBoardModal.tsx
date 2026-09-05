'use client';

import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { RoleBadge } from '../ui/Badge';
import { api, ApiRequestError } from '../../lib/api';
import type { BoardMember, BoardRole } from '../../types';

export function ShareBoardModal({
  open,
  onClose,
  boardId,
  members,
  currentUserId,
  isOwner,
  onMembersChanged,
}: {
  open: boolean;
  onClose: () => void;
  boardId: string;
  members: BoardMember[];
  currentUserId: string;
  isOwner: boolean;
  onMembersChanged: (members: BoardMember[]) => void;
}) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<BoardRole>('EDITOR');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const member = await api.boards.addMember(boardId, { email, role });
      onMembersChanged([...members, member]);
      setEmail('');
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not add member');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRoleChange(userId: string, newRole: BoardRole) {
    try {
      const updated = await api.boards.updateMember(boardId, userId, { role: newRole });
      onMembersChanged(members.map((m) => (m.userId === userId ? updated : m)));
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not update role');
    }
  }

  async function handleRemove(userId: string) {
    if (!window.confirm('Remove this person from the board?')) return;
    try {
      await api.boards.removeMember(boardId, userId);
      onMembersChanged(members.filter((m) => m.userId !== userId));
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not remove member');
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Share board" widthClassName="max-w-lg">
      <div className="space-y-5">
        {isOwner && (
          <form onSubmit={handleInvite} className="flex items-end gap-2">
            <div className="flex-1">
              <Input
                label="Invite by email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teammate@example.com"
              />
            </div>
            <Select
              value={role}
              onChange={(e) => setRole(e.target.value as BoardRole)}
              className="w-28"
            >
              <option value="EDITOR">Editor</option>
              <option value="VIEWER">Viewer</option>
              <option value="OWNER">Owner</option>
            </Select>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Invite
            </Button>
          </form>
        )}
        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="max-h-72 space-y-1 overflow-y-auto">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between rounded-sm px-2 py-2 hover:bg-white/5"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <Avatar name={member.name} size={30} />
                <div className="min-w-0">
                  <p className="truncate text-sm text-ink-primary">
                    {member.name}
                    {member.userId === currentUserId && (
                      <span className="text-ink-tertiary"> (you)</span>
                    )}
                  </p>
                  <p className="truncate text-xs text-ink-tertiary">{member.email}</p>
                </div>
              </div>
              {isOwner ? (
                <div className="flex flex-shrink-0 items-center gap-1.5">
                  <Select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.userId, e.target.value as BoardRole)}
                    className="h-8 w-28 text-xs"
                  >
                    <option value="OWNER">Owner</option>
                    <option value="EDITOR">Editor</option>
                    <option value="VIEWER">Viewer</option>
                  </Select>
                  <button
                    onClick={() => handleRemove(member.userId)}
                    className="rounded-sm p-1.5 text-ink-tertiary transition-colors hover:bg-danger/10 hover:text-danger"
                    aria-label={`Remove ${member.name}`}
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              ) : (
                <RoleBadge role={member.role} />
              )}
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
