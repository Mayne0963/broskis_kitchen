import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef } from 'react';

const typographyVariants = cva('', {
  variants: {
    variant: {
      h1: 'scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl font-[var(--font-family-secondary)]',
      h2: 'scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0 font-[var(--font-family-secondary)]',
      h3: 'scroll-m-20 text-2xl font-semibold tracking-tight font-[var(--font-family-secondary)]',
      h4: 'scroll-m-20 text-xl font-semibold tracking-tight font-[var(--font-family-secondary)]',
      h5: 'scroll-m-20 text-lg font-semibold font-[var(--font-family-secondary)]',
      h6: 'scroll-m-20 text-base font-semibold font-[var(--font-family-secondary)]',
      body1: 'text-base leading-7',
      body2: 'text-sm leading-6',
      caption: 'text-sm leading-5',
      overline: 'text-xs leading-4 uppercase tracking-wider',
      subtitle1: 'text-base leading-6',
      subtitle2: 'text-sm leading-5',
      display1: 'text-6xl font-extrabold tracking-tighter font-[var(--font-family-secondary)]',
      display2: 'text-5xl font-extrabold tracking-tighter font-[var(--font-family-secondary)]',
      display3: 'text-4xl font-extrabold tracking-tighter font-[var(--font-family-secondary)]',
    },
    color: {
      primary: 'text-[var(--color-text-primary)]',
      secondary: 'text-[var(--color-text-secondary)]',
      tertiary: 'text-[var(--color-text-tertiary)]',
      muted: 'text-[var(--color-text-muted)]',
      brand: 'text-[var(--color-text-brand)]',
      inverse: 'text-[var(--color-text-inverse)]',
      success: 'text-[var(--color-status-success)]',
      warning: 'text-[var(--color-status-warning)]',
      error: 'text-[var(--color-status-error)]',
      info: 'text-[var(--color-status-info)]',
      gold: 'text-[var(--color-brand-gold)]',
      burgundy: 'text-[var(--color-brand-burgundy)]',
      gradient: 'bg-gradient-to-r from-[var(--color-brand-gold)] to-[var(--color-brand-gold-light)] bg-clip-text text-transparent',
    },
    align: {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
      justify: 'text-justify',
    },
    weight: {
      light: 'font-light',
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
      extrabold: 'font-extrabold',
    },
    transform: {
      none: '',
      uppercase: 'uppercase',
      lowercase: 'lowercase',
      capitalize: 'capitalize',
    },
  },
  defaultVariants: {
    color: 'primary',
    align: 'left',
    weight: 'normal',
    transform: 'none',
  },
});

export interface TypographyProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof typographyVariants> {
  component?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
}

const Typography = forwardRef<HTMLElement, TypographyProps>(
  ({ className, variant = 'body1', component, color, align, weight, transform, ...props }, ref) => {
    const Component = component || (variant?.startsWith('h') ? variant : 'p');
    
    return (
      <Component
        ref={ref}
        className={cn(
          typographyVariants({ variant, color, align, weight, transform }),
          className
        )}
        {...props}
      />
    );
  }
);

Typography.displayName = 'Typography';

export { Typography, typographyVariants };