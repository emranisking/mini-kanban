import { cx } from '../../lib/utils';

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cx(
        'inline-block h-6 w-6 animate-spin rounded-full border-2 border-white/15 border-t-accent',
        className,
      )}
      role="status"
      aria-label="Loading"
    />
  );
}
