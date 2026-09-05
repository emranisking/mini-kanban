import { SelectHTMLAttributes, forwardRef } from 'react';
import { cx } from '../../lib/utils';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, className, id, children, ...props }, ref) => (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm text-ink-secondary">{label}</span>}
      <select
        ref={ref}
        id={id}
        className={cx(
          'h-10 w-full rounded-sm border border-border-subtle bg-surface-raised px-3 text-sm text-ink-primary transition-colors',
          'focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent',
          className,
        )}
        {...props}
      >
        {children}
      </select>
    </label>
  ),
);
Select.displayName = 'Select';
