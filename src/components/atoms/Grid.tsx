import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const gridVariants = cva(
  'grid gap-[var(--space-md)]',
  {
    variants: {
      cols: {
        1: 'grid-cols-1',
        2: 'grid-cols-1 md:grid-cols-2',
        3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
        5: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
        6: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
        12: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-12',
      },
      gap: {
        none: 'gap-0',
        xs: 'gap-[var(--space-xs)]',
        sm: 'gap-[var(--space-sm)]',
        md: 'gap-[var(--space-md)]',
        lg: 'gap-[var(--space-lg)]',
        xl: 'gap-[var(--space-xl)]',
        2xl: 'gap-[var(--space-2xl)]',
        3xl: 'gap-[var(--space-3xl)]',
      },
      alignment: {
        start: 'items-start',
        center: 'items-center',
        end: 'items-end',
        stretch: 'items-stretch',
        baseline: 'items-baseline',
      },
      justify: {
        start: 'justify-start',
        center: 'justify-center',
        end: 'justify-end',
        between: 'justify-between',
        around: 'justify-around',
        evenly: 'justify-evenly',
      },
      flow: {
        row: 'grid-flow-row',
        col: 'grid-flow-col',
        dense: 'grid-flow-dense',
      },
    },
    defaultVariants: {
      cols: 1,
      gap: 'md',
      alignment: 'stretch',
      justify: 'start',
      flow: 'row',
    },
  }
);

export interface GridProps extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof gridVariants> {
  children: React.ReactNode;
  className?: string;
}

export const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  ({ className, cols, gap, alignment, justify, flow, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          gridVariants({ cols, gap, alignment, justify, flow }),
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Grid.displayName = 'Grid';

const gridItemVariants = cva('', {
  variants: {
    span: {
      1: 'col-span-1',
      2: 'col-span-1 md:col-span-2',
      3: 'col-span-1 md:col-span-3',
      4: 'col-span-1 md:col-span-4',
      5: 'col-span-1 md:col-span-5',
      6: 'col-span-1 md:col-span-6',
      7: 'col-span-1 md:col-span-7',
      8: 'col-span-1 md:col-span-8',
      9: 'col-span-1 md:col-span-9',
      10: 'col-span-1 md:col-span-10',
      11: 'col-span-1 md:col-span-11',
      12: 'col-span-1 md:col-span-12',
      auto: 'col-auto',
      full: 'col-span-full',
    },
    start: {
      1: 'col-start-1',
      2: 'col-start-2',
      3: 'col-start-3',
      4: 'col-start-4',
      5: 'col-start-5',
      6: 'col-start-6',
      7: 'col-start-7',
      8: 'col-start-8',
      9: 'col-start-9',
      10: 'col-start-10',
      11: 'col-start-11',
      12: 'col-start-12',
      auto: 'col-start-auto',
    },
    alignment: {
      start: 'self-start',
      center: 'self-center',
      end: 'self-end',
      stretch: 'self-stretch',
      baseline: 'self-baseline',
    },
  },
  defaultVariants: {
    span: 'auto',
    alignment: 'stretch',
  },
});

export interface GridItemProps extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof gridItemVariants> {
  children: React.ReactNode;
  className?: string;
}

export const GridItem = React.forwardRef<HTMLDivElement, GridItemProps>(
  ({ className, span, start, alignment, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          gridItemVariants({ span, start, alignment }),
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GridItem.displayName = 'GridItem';

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  center?: boolean;
}

export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, children, size = 'lg', center = true, ...props }, ref) => {
    const sizeClasses = {
      sm: 'max-w-[var(--container-sm)]',
      md: 'max-w-[var(--container-md)]',
      lg: 'max-w-[var(--container-lg)]',
      xl: 'max-w-[var(--container-xl)]',
      full: 'max-w-none',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'w-full mx-auto px-[var(--space-md)]',
          sizeClasses[size],
          center && 'mx-auto',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Container.displayName = 'Container';

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'none';
  alignment?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: boolean;
}

export const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  ({ className, children, direction = 'column', gap = 'md', alignment = 'stretch', justify = 'start', wrap = false, ...props }, ref) => {
    const directionClasses = {
      row: 'flex-row',
      column: 'flex-col',
      'row-reverse': 'flex-row-reverse',
      'column-reverse': 'flex-col-reverse',
    };

    const gapClasses = {
      none: 'gap-0',
      xs: 'gap-[var(--space-xs)]',
      sm: 'gap-[var(--space-sm)]',
      md: 'gap-[var(--space-md)]',
      lg: 'gap-[var(--space-lg)]',
      xl: 'gap-[var(--space-xl)]',
      '2xl': 'gap-[var(--space-2xl)]',
      '3xl': 'gap-[var(--space-3xl)]',
    };

    const alignmentClasses = {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch',
      baseline: 'items-baseline',
    };

    const justifyClasses = {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
      around: 'justify-around',
      evenly: 'justify-evenly',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'flex',
          directionClasses[direction],
          gapClasses[gap],
          alignmentClasses[alignment],
          justifyClasses[justify],
          wrap && 'flex-wrap',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Stack.displayName = 'Stack';