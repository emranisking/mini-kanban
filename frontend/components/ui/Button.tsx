'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cx } from '../../lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-accent-gradient text-white shadow-depth-8 hover:brightness-110 active:brightness-95 disabled:opacity-50',
  secondary:
    'bg-surface-raised text-ink-primary border border-border-subtle hover:border-border-strong hover:bg-surface-overlay disabled:opacity-50',
  ghost: 'text-ink-secondary hover:text-ink-primary hover:bg-white/5 disabled:opacity-50',
  danger: 'bg-danger/90 text-white hover:bg-danger disabled:opacity-50',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm rounded-sm',
  md: 'h-10 px-4 text-sm rounded-sm',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'secondary', size = 'md', isLoading, className, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={cx(
        'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {isLoading && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      )}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';
