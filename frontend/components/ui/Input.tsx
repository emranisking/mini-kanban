import { InputHTMLAttributes, forwardRef, TextareaHTMLAttributes } from 'react';
import { cx } from '../../lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-sm text-ink-secondary">{label}</span>
      )}
      <input
        ref={ref}
        id={id}
        className={cx(
          'h-10 w-full rounded-sm border border-border-subtle bg-surface-raised px-3 text-sm text-ink-primary placeholder:text-ink-tertiary transition-colors',
          'focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent',
          error && 'border-danger focus:border-danger focus:ring-danger',
          className,
        )}
        {...props}
      />
      {error && <span className="mt-1 block text-xs text-danger">{error}</span>}
    </label>
  ),
);
Input.displayName = 'Input';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, className, id, ...props }, ref) => (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-sm text-ink-secondary">{label}</span>
      )}
      <textarea
        ref={ref}
        id={id}
        className={cx(
          'w-full resize-none rounded-sm border border-border-subtle bg-surface-raised px-3 py-2 text-sm text-ink-primary placeholder:text-ink-tertiary transition-colors',
          'focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent',
          className,
        )}
        {...props}
      />
    </label>
  ),
);
Textarea.displayName = 'Textarea';
