import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef } from 'react';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: [
          'border-[var(--color-border-primary)]',
          'bg-[var(--color-bg-secondary)]',
          'text-[var(--color-text-primary)]',
          'hover:bg-[var(--color-bg-hover)]',
        ],
        brand: [
          'border-[var(--color-brand-gold)]',
          'bg-[var(--color-brand-gold)]/10',
          'text-[var(--color-brand-gold)]',
          'hover:bg-[var(--color-brand-gold)]/20',
        ],
        success: [
          'border-[var(--color-status-success)]',
          'bg-[var(--color-status-success)]/10',
          'text-[var(--color-status-success)]',
          'hover:bg-[var(--color-status-success)]/20',
        ],
        warning: [
          'border-[var(--color-status-warning)]',
          'bg-[var(--color-status-warning)]/10',
          'text-[var(--color-status-warning)]',
          'hover:bg-[var(--color-status-warning)]/20',
        ],
        error: [
          'border-[var(--color-status-error)]',
          'bg-[var(--color-status-error)]/10',
          'text-[var(--color-status-error)]',
          'hover:bg-[var(--color-status-error)]/20',
        ],
        info: [
          'border-[var(--color-status-info)]',
          'bg-[var(--color-status-info)]/10',
          'text-[var(--color-status-info)]',
          'hover:bg-[var(--color-status-info)]/20',
        ],
        burgundy: [
          'border-[var(--color-brand-burgundy)]',
          'bg-[var(--color-brand-burgundy)]/10',
          'text-[var(--color-brand-burgundy)]',
          'hover:bg-[var(--color-brand-burgundy)]/20',
        ],
        outline: [
          'border-[var(--color-border-secondary)]',
          'bg-transparent',
          'text-[var(--color-text-secondary)]',
          'hover:bg-[var(--color-bg-hover)]',
          'hover:text-[var(--color-text-primary)]',
        ],
        ghost: [
          'border-transparent',
          'bg-transparent',
          'text-[var(--color-text-secondary)]',
          'hover:bg-[var(--color-bg-hover)]',
          'hover:text-[var(--color-text-primary)]',
        ],
      },
      size: {
        sm: 'px-2 py-0.5 text-[10px]',
        md: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';

export { Badge, badgeVariants };