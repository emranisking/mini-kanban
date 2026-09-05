'use client';

import { useEffect, useState } from 'react';
import { AuthGuard } from '../../components/auth/AuthGuard';
import { TopBar } from '../../components/board/TopBar';
import { BoardCard } from '../../components/board/BoardCard';
import { CreateBoardModal } from '../../components/board/CreateBoardModal';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { api } from '../../lib/api';
import type { Board } from '../../types';

function BoardsPageContent() {
  const [boards, setBoards] = useState<Board[] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    api.boards.list().then(setBoards);
  }, []);

  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-ink-primary">Your boards</h1>
            <p className="mt-1 text-sm text-ink-secondary">
              Boards you own or have been invited to.
            </p>
          </div>
          <Button variant="primary" onClick={() => setModalOpen(true)}>
            <PlusIcon /> New board
          </Button>
        </div>

        {boards === null ? (
          <div className="flex justify-center py-24">
            <Spinner />
          </div>
        ) : boards.length === 0 ? (
          <EmptyState
            title="No boards yet"
            description="Create your first board to start organizing work into columns and tasks."
            action={
              <Button variant="primary" onClick={() => setModalOpen(true)}>
                <PlusIcon /> Create a board
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {boards.map((board) => (
              <BoardCard key={board.id} board={board} />
            ))}
          </div>
        )}
      </main>

      <CreateBoardModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(board) => setBoards((prev) => [board, ...(prev ?? [])])}
      />
    </div>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export default function BoardsPage() {
  return (
    <AuthGuard>
      <BoardsPageContent />
    </AuthGuard>
  );
}
