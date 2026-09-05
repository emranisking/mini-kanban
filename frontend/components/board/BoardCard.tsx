import Link from 'next/link';
import type { Board } from '../../types';

export function BoardCard({ board }: { board: Board }) {
  return (
    <Link
      href={`/boards/${board.id}`}
      className="group relative flex h-36 flex-col justify-between overflow-hidden rounded-md border border-border-subtle bg-surface-raised p-4 shadow-depth-4 transition-all duration-150 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-depth-16"
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-accent-gradient opacity-0 transition-opacity duration-150 group-hover:opacity-100" />
      <div>
        <h3 className="line-clamp-1 text-sm font-semibold text-ink-primary">{board.name}</h3>
        {board.description && (
          <p className="mt-1.5 line-clamp-2 text-xs text-ink-secondary">{board.description}</p>
        )}
      </div>
      <p className="text-xs text-ink-tertiary">
        Updated {new Date(board.updatedAt).toLocaleDateString()}
      </p>
    </Link>
  );
}
