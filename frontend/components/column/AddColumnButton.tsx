'use client';

import { useState } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

export function AddColumnButton({ onAdd }: { onAdd: (name: string) => Promise<void> }) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      await onAdd(name.trim());
      setName('');
      setIsOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex h-11 w-72 flex-shrink-0 items-center justify-center gap-1.5 rounded-md border border-dashed border-border-subtle text-sm text-ink-tertiary transition-colors hover:border-border-strong hover:bg-white/5 hover:text-ink-secondary"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        Add column
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-72 flex-shrink-0 space-y-2">
      <Input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && setIsOpen(false)}
        placeholder="Column name"
      />
      <div className="flex gap-2">
        <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
          Add
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
