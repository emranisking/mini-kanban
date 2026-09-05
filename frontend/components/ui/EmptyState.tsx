export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border-subtle px-8 py-16 text-center">
      <h3 className="text-lg font-semibold text-ink-primary">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-ink-secondary">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
