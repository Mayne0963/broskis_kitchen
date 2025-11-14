import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Typography } from '@/components/atoms/Typography';
import { Badge } from '@/components/atoms/Badge';

const navVariants = cva(
  'flex items-center p-2 rounded-md transition-all duration-200 cursor-pointer',
  {
    variants: {
      variant: {
        default: [
          'text-[var(--color-text-secondary)]',
          'hover:text-[var(--color-text-primary)]',
          'hover:bg-[var(--color-background-elevated)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-gold)] focus-visible:ring-offset-2',
        ],
        active: [
          'bg-gradient-to-r from-[var(--color-brand-gold-transparent)] to-[var(--color-brand-burgundy-transparent)]',
          'text-[var(--color-text-primary)]',
          'border border-[var(--color-brand-gold)]',
          'shadow-md',
        ],
        subtle: [
          'text-[var(--color-text-secondary)]',
          'hover:text-[var(--color-text-primary)]',
          'hover:bg-[var(--color-background-subtle)]',
        ],
        ghost: [
          'text-[var(--color-text-secondary)]',
          'hover:text-[var(--color-text-primary)]',
          'hover:bg-transparent',
        ],
      },
      size: {
        sm: 'px-2 py-1 text-sm',
        md: 'px-3 py-2 text-base',
        lg: 'px-4 py-3 text-lg',
      },
      orientation: {
        horizontal: 'flex-row',
        vertical: 'flex-col',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      orientation: 'horizontal',
    },
  }
);

export interface NavItemProps extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof navVariants> {
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  label: string;
  badge?: string | number;
  badgeVariant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  active?: boolean;
  disabled?: boolean;
  href?: string;
  target?: string;
  rel?: string;
}

export const NavItem = React.forwardRef<HTMLDivElement, NavItemProps>(
  ({ 
    className, 
    variant, 
    size, 
    orientation, 
    children, 
    icon, 
    label, 
    badge, 
    badgeVariant = 'default',
    active = false,
    disabled = false,
    href,
    target,
    rel,
    onClick,
    ...props 
  }, ref) => {
    const Component = href ? 'a' : 'div';
    const linkProps = href ? { href, target, rel } : {};
    
    return (
      <Component
        ref={ref}
        className={cn(
          navVariants({ 
            variant: active ? 'active' : variant, 
            size, 
            orientation 
          }),
          disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
          className
        )}
        onClick={disabled ? undefined : onClick}
        {...linkProps}
        {...props}
      >
        {icon && (
          <div className={cn(
            'flex-shrink-0',
            orientation === 'horizontal' ? 'mr-3' : 'mb-2'
          )}>
            {icon}
          </div>
        )}
        
        <div className={cn(
          'flex-grow',
          orientation === 'horizontal' ? 'flex items-center justify-between' : 'text-center'
        )}>
          <Typography 
            variant={size === 'sm' ? 'body-sm' : size === 'lg' ? 'h6' : 'body'}
            className="font-medium"
          >
            {label}
          </Typography>
          
          {badge && (
            <Badge 
              variant={badgeVariant} 
              size={size === 'sm' ? 'sm' : 'md'}
              className={cn(
                orientation === 'horizontal' ? 'ml-2' : 'mt-1'
              )}
            >
              {badge}
            </Badge>
          )}
        </div>
        
        {children}
      </Component>
    );
  }
);

NavItem.displayName = 'NavItem';

const navGroupVariants = cva(
  'space-y-1',
  {
    variants: {
      variant: {
        default: '',
        card: 'bg-[var(--color-background-elevated)] rounded-lg p-2 shadow-sm',
        subtle: 'bg-[var(--color-background-subtle)] rounded-lg p-2',
        border: 'border border-[var(--color-border-subtle)] rounded-lg p-2',
      },
      size: {
        sm: 'space-y-1',
        md: 'space-y-2',
        lg: 'space-y-3',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface NavGroupProps extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof navGroupVariants> {
  children: React.ReactNode;
  className?: string;
  title?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
}

export const NavGroup = React.forwardRef<HTMLDivElement, NavGroupProps>(
  ({ className, variant, size, children, title, collapsible = false, defaultOpen = true, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(defaultOpen);
    
    return (
      <div
        ref={ref}
        className={cn(navGroupVariants({ variant, size }), className)}
        {...props}
      >
        {title && (
          <div className="flex items-center justify-between px-2 py-1">
            <Typography 
              variant="body-sm" 
              className="font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide"
            >
              {title}
            </Typography>
            {collapsible && (
              <button
                type="button"
                className="p-1 rounded hover:bg-[var(--color-background-subtle)] transition-colors"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                aria-label={isOpen ? 'Collapse section' : 'Expand section'}
              >
                <svg
                  className={cn(
                    'w-4 h-4 transition-transform duration-200',
                    !isOpen && 'rotate-180'
                  )}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
            )}
          </div>
        )}
        
        <div className={cn(
          'transition-all duration-200',
          collapsible && !isOpen && 'max-h-0 overflow-hidden',
          (!collapsible || isOpen) && 'max-h-none'
        )}>
          {children}
        </div>
      </div>
    );
  }
);

NavGroup.displayName = 'NavGroup';

const navBarVariants = cva(
  'flex items-center',
  {
    variants: {
      variant: {
        default: 'bg-[var(--color-background)] border-b border-[var(--color-border-subtle)]',
        elevated: 'bg-[var(--color-background-elevated)] shadow-sm',
        subtle: 'bg-[var(--color-background-subtle)]',
        transparent: 'bg-transparent',
      },
      size: {
        sm: 'px-4 py-2',
        md: 'px-6 py-4',
        lg: 'px-8 py-6',
      },
      position: {
        fixed: 'fixed top-0 left-0 right-0 z-50',
        sticky: 'sticky top-0 z-40',
        static: 'relative',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      position: 'static',
    },
  }
);

export interface NavBarProps extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof navBarVariants> {
  children: React.ReactNode;
  className?: string;
  leftContent?: React.ReactNode;
  centerContent?: React.ReactNode;
  rightContent?: React.ReactNode;
}

export const NavBar = React.forwardRef<HTMLDivElement, NavBarProps>(
  ({ className, variant, size, position, children, leftContent, centerContent, rightContent, ...props }, ref) => {
    return (
      <nav
        ref={ref}
        className={cn(navBarVariants({ variant, size, position }), className)}
        {...props}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center flex-shrink-0">
            {leftContent}
          </div>
          
          <div className="flex items-center flex-grow justify-center">
            {centerContent}
          </div>
          
          <div className="flex items-center flex-shrink-0">
            {rightContent}
          </div>
        </div>
        
        {children}
      </nav>
    );
  }
);

NavBar.displayName = 'NavBar';

export interface BreadcrumbProps extends React.HTMLAttributes<HTMLDivElement> {
  items: Array<{
    label: string;
    href?: string;
    icon?: React.ReactNode;
  }>;
  separator?: React.ReactNode;
  className?: string;
}

export const Breadcrumb = React.forwardRef<HTMLDivElement, BreadcrumbProps>(
  ({ className, items, separator = '/', ...props }, ref) => {
    return (
      <nav
        ref={ref}
        className={cn('flex items-center space-x-2 text-sm', className)}
        aria-label="Breadcrumb"
        {...props}
      >
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isFirst = index === 0;
          
          return (
            <React.Fragment key={index}>
              {!isFirst && (
                <span className="text-[var(--color-text-secondary)]" aria-hidden="true">
                  {separator}
                </span>
              )}
              
              {item.href ? (
                <a
                  href={item.href}
                  className="flex items-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  {item.icon && <span className="mr-1">{item.icon}</span>}
                  <span>{item.label}</span>
                </a>
              ) : (
                <span className={cn(
                  'flex items-center',
                  isLast ? 'text-[var(--color-text-primary)] font-medium' : 'text-[var(--color-text-secondary)]'
                )}>
                  {item.icon && <span className="mr-1">{item.icon}</span>}
                  <span>{item.label}</span>
                </span>
              )}
            </React.Fragment>
          );
        })}
      </nav>
    );
  }
);

Breadcrumb.displayName = 'Breadcrumb';