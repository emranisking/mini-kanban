export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
      {/* Decorative panel: an abstract, static preview of a kanban board. */}
      <div className="relative hidden overflow-hidden border-r border-border-subtle bg-surface p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute inset-0 bg-canvas-glow" />
        <div className="relative flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-accent-gradient text-sm font-bold text-white">
            K
          </div>
          <span className="text-sm font-semibold tracking-tight text-ink-primary">Mini Kanban</span>
        </div>

        <div className="relative">
          <h1 className="max-w-md text-3xl font-semibold leading-tight text-ink-primary">
            Board state that stays true, even when three people move a card at once.
          </h1>
          <p className="mt-3 max-w-sm text-sm text-ink-secondary">
            Every drag is a transaction. Every read is authorized before it ever touches the cache.
          </p>
        </div>

        <div className="relative grid grid-cols-3 gap-3">
          {[
            { label: 'Todo', accent: 'bg-column-blue', count: 3 },
            { label: 'In Progress', accent: 'bg-column-amber', count: 2 },
            { label: 'Done', accent: 'bg-column-green', count: 4 },
          ].map((col) => (
            <div key={col.label} className="acrylic rounded-md p-3 shadow-depth-8">
              <div className="mb-2 flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${col.accent}`} />
                <span className="text-xs font-medium text-ink-secondary">{col.label}</span>
              </div>
              <div className="space-y-1.5">
                {Array.from({ length: col.count }).map((_, i) => (
                  <div
                    key={i}
                    className="h-6 rounded-sm bg-white/5"
                    style={{ opacity: 1 - i * 0.18 }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-accent-gradient text-sm font-bold text-white">
              K
            </div>
            <span className="text-sm font-semibold tracking-tight text-ink-primary">Mini Kanban</span>
          </div>
          <h2 className="text-2xl font-semibold text-ink-primary">{title}</h2>
          <p className="mt-1.5 text-sm text-ink-secondary">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <div className="mt-6 text-sm text-ink-secondary">{footer}</div>
        </div>
      </div>
    </div>
  );
}
