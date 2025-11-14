import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef } from 'react';

const cardVariants = cva(
  'rounded-xl border transition-all duration-250 backdrop-blur-sm',
  {
    variants: {
      variant: {
        default: [
          'bg-[var(--color-bg-card)]',
          'border-[var(--color-border-primary)]',
          'shadow-lg hover:shadow-xl',
          'hover:border-[var(--color-border-secondary)]',
        ],
        glass: [
          'bg-[var(--color-bg-surface)]',
          'border-[var(--color-border-primary)]',
          'shadow-xl',
          'backdrop-blur-md',
          'hover:shadow-2xl',
          'hover:border-[var(--color-border-brand)]',
        ],
        elevated: [
          'bg-[var(--color-bg-secondary)]',
          'border-[var(--color-border-secondary)]',
          'shadow-2xl',
          'hover:shadow-[var(--glow-gold-sm)]',
          'hover:border-[var(--color-border-brand)]',
        ],
        minimal: [
          'bg-transparent',
          'border-[var(--color-border-primary)]',
          'shadow-none',
          'hover:bg-[var(--color-bg-hover)]',
          'hover:border-[var(--color-border-secondary)]',
        ],
      },
      padding: {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
        xl: 'p-10',
      },
      glow: {
        none: '',
        sm: 'hover:shadow-[var(--glow-gold-sm)]',
        md: 'hover:shadow-[var(--glow-gold-md)]',
        lg: 'hover:shadow-[var(--glow-gold-lg)]',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
      glow: 'none',
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, glow, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant, padding, glow, className }))}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';

const CardHeader = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5', className)}
    {...props}
  />
));

CardHeader.displayName = 'CardHeader';

const CardTitle = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'font-semibold leading-none tracking-tight text-[var(--color-text-primary)]',
      className
    )}
    {...props}
  />
));

CardTitle.displayName = 'CardTitle';

const CardDescription = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-[var(--color-text-secondary)]', className)}
    {...props}
  />
));

CardDescription.displayName = 'CardDescription';

const CardContent = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('pt-0', className)} {...props} />
));

CardContent.displayName = 'CardContent';

const CardFooter = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center', className)}
    {...props}
  />
));

CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };