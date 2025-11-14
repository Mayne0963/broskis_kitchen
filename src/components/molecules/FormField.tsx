import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Typography } from '@/components/atoms/Typography';

const formFieldVariants = cva(
  'space-y-2',
  {
    variants: {
      size: {
        sm: 'space-y-1',
        md: 'space-y-2',
        lg: 'space-y-3',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof formFieldVariants> {
  children: React.ReactNode;
  className?: string;
}

export const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ className, size, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(formFieldVariants({ size }), className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

FormField.displayName = 'FormField';

const labelVariants = cva(
  'block font-medium text-[var(--color-text-primary)] transition-colors duration-200',
  {
    variants: {
      size: {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
      },
      required: {
        true: '',
      },
      disabled: {
        true: 'opacity-50 cursor-not-allowed',
      },
      error: {
        true: 'text-[var(--color-status-error)]',
      },
    },
    defaultVariants: {
      size: 'md',
      required: false,
      disabled: false,
      error: false,
    },
  }
);

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement>,
  VariantProps<typeof labelVariants> {
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, size, required, disabled, error, children, htmlFor, ...props }, ref) => {
    return (
      <label
        ref={ref}
        htmlFor={htmlFor}
        className={cn(labelVariants({ size, required, disabled, error }), className)}
        {...props}
      >
        {children}
        {required && (
          <span className="text-[var(--color-status-error)] ml-1" aria-label="required">*</span>
        )}
      </label>
    );
  }
);

Label.displayName = 'Label';

const helperTextVariants = cva(
  'text-sm transition-colors duration-200',
  {
    variants: {
      variant: {
        default: 'text-[var(--color-text-secondary)]',
        error: 'text-[var(--color-status-error)]',
        success: 'text-[var(--color-status-success)]',
        warning: 'text-[var(--color-status-warning)]',
        info: 'text-[var(--color-status-info)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface HelperTextProps extends React.HTMLAttributes<HTMLParagraphElement>,
  VariantProps<typeof helperTextVariants> {
  children: React.ReactNode;
  className?: string;
}

export const HelperText = React.forwardRef<HTMLParagraphElement, HelperTextProps>(
  ({ className, variant, children, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn(helperTextVariants({ variant }), className)}
        {...props}
      >
        {children}
      </p>
    );
  }
);

HelperText.displayName = 'HelperText';

export interface FormFieldGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  gap?: 'xs' | 'sm' | 'md' | 'lg';
}

export const FormFieldGroup = React.forwardRef<HTMLDivElement, FormFieldGroupProps>(
  ({ className, children, orientation = 'vertical', gap = 'md', ...props }, ref) => {
    const gapClasses = {
      xs: 'gap-2',
      sm: 'gap-3',
      md: 'gap-4',
      lg: 'gap-6',
    };

    return (
      <div
        ref={ref}
        className={cn(
          orientation === 'horizontal' 
            ? `flex flex-col sm:flex-row ${gapClasses[gap]}` 
            : 'space-y-6',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

FormFieldGroup.displayName = 'FormFieldGroup';

export interface InputGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  error?: boolean;
}

export const InputGroup = React.forwardRef<HTMLDivElement, InputGroupProps>(
  ({ className, children, size = 'md', disabled = false, error = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative',
          disabled && 'opacity-50',
          error && 'ring-2 ring-[var(--color-status-error)] ring-opacity-50 rounded-md',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

InputGroup.displayName = 'InputGroup';

export interface FormSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
}

export const FormSection = React.forwardRef<HTMLDivElement, FormSectionProps>(
  ({ className, children, title, description, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('space-y-6 p-6 bg-[var(--color-background-subtle)] rounded-lg', className)}
        {...props}
      >
        {(title || description) && (
          <div className="space-y-2">
            {title && (
              <Typography variant="h5" className="text-[var(--color-text-primary)]">
                {title}
              </Typography>
            )}
            {description && (
              <Typography variant="body" className="text-[var(--color-text-secondary)]">
                {description}
              </Typography>
            )}
          </div>
        )}
        {children}
      </div>
    );
  }
);

FormSection.displayName = 'FormSection';