import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef } from 'react';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-semibold transition-all duration-250 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: [
          'bg-gradient-to-r from-[var(--color-brand-gold)] to-[var(--color-brand-gold-light)]',
          'text-[var(--color-text-inverse)]',
          'border-2 border-[var(--color-brand-gold-dark)]',
          'shadow-lg hover:shadow-xl',
          'hover:from-[var(--color-brand-gold-light)] hover:to-[var(--color-brand-gold)]',
          'hover:scale-105 hover:-translate-y-0.5',
          'focus-visible:ring-[var(--color-brand-gold)]',
        ],
        secondary: [
          'bg-[var(--color-brand-burgundy)]',
          'text-[var(--color-white)]',
          'border-2 border-[var(--color-brand-burgundy-dark)]',
          'shadow-lg hover:shadow-xl',
          'hover:bg-[var(--color-brand-burgundy-light)]',
          'hover:scale-105 hover:-translate-y-0.5',
          'focus-visible:ring-[var(--color-brand-burgundy-light)]',
        ],
        outline: [
          'bg-transparent',
          'text-[var(--color-text-brand)]',
          'border-2 border-[var(--color-border-brand)]',
          'hover:bg-[var(--color-state-hover)]',
          'hover:text-[var(--color-text-primary)]',
          'hover:border-[var(--color-brand-gold-light)]',
          'hover:scale-105 hover:-translate-y-0.5',
          'focus-visible:ring-[var(--color-brand-gold)]',
        ],
        ghost: [
          'bg-transparent',
          'text-[var(--color-text-secondary)]',
          'border-2 border-transparent',
          'hover:bg-[var(--color-bg-hover)]',
          'hover:text-[var(--color-text-primary)]',
          'focus-visible:ring-[var(--color-brand-gold)]',
        ],
        gold: [
          'bg-gradient-to-r from-[#BA8939] via-[#FDCE66] via-[#FFE076] via-[#E0AD53] to-[#FFEF88]',
          'text-[var(--color-black)]',
          'border-2 border-[#C5A100]',
          'shadow-lg hover:shadow-xl',
          'hover:from-[#C5A100] hover:via-[#A98600] hover:to-[#7F6000]',
          'hover:text-[var(--color-white)]',
          'hover:scale-105 hover:-translate-y-0.5',
          'focus-visible:ring-[var(--color-brand-gold)]',
        ],
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-11 px-6 text-base',
        lg: 'h-13 px-8 text-lg',
        xl: 'h-15 px-10 text-xl',
      },
      glow: {
        none: '',
        sm: 'hover:shadow-[var(--glow-gold-sm)]',
        md: 'hover:shadow-[var(--glow-gold-md)]',
        lg: 'hover:shadow-[var(--glow-gold-lg)]',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      glow: 'none',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, glow, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, glow, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };