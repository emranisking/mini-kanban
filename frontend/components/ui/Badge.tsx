import { cx } from '../../lib/utils';

const roleClasses: Record<string, string> = {
  OWNER: 'bg-accent-soft text-accent border-accent/30',
  EDITOR: 'bg-column-teal/15 text-column-teal border-column-teal/30',
  VIEWER: 'bg-white/5 text-ink-secondary border-border-subtle',
};

export function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={cx(
        'rounded-sm border px-2 py-0.5 text-xs font-medium capitalize',
        roleClasses[role] ?? roleClasses.VIEWER,
      )}
    >
      {role.toLowerCase()}
    </span>
  );
}
