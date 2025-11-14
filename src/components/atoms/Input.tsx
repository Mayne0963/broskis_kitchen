import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const inputVariants = cva(
  'flex w-full rounded-md border-2 bg-transparent text-base transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: [
          'border-[var(--color-border)]',
          'text-[var(--color-text-primary)]',
          'placeholder:text-[var(--color-text-secondary)]',
          'hover:border-[var(--color-border-hover)]',
          'focus-visible:border-[var(--color-brand-gold)]',
          'focus-visible:ring-[var(--color-brand-gold)]',
        ],
        gold: [
          'border-[var(--color-brand-gold-dark)]',
          'text-[var(--color-text-primary)]',
          'placeholder:text-[var(--color-text-secondary)]',
          'hover:border-[var(--color-brand-gold)]',
          'focus-visible:border-[var(--color-brand-gold)]',
          'focus-visible:ring-[var(--color-brand-gold)]',
          'bg-gradient-to-r from-[var(--color-brand-gold-light-transparent)] to-[var(--color-brand-gold-transparent)]',
        ],
        burgundy: [
          'border-[var(--color-brand-burgundy-dark)]',
          'text-[var(--color-text-primary)]',
          'placeholder:text-[var(--color-text-secondary)]',
          'hover:border-[var(--color-brand-burgundy)]',
          'focus-visible:border-[var(--color-brand-burgundy)]',
          'focus-visible:ring-[var(--color-brand-burgundy)]',
          'bg-gradient-to-r from-[var(--color-brand-burgundy-light-transparent)] to-[var(--color-brand-burgundy-transparent)]',
        ],
        error: [
          'border-[var(--color-status-error)]',
          'text-[var(--color-text-primary)]',
          'placeholder:text-[var(--color-text-secondary)]',
          'hover:border-[var(--color-status-error-dark)]',
          'focus-visible:border-[var(--color-status-error)]',
          'focus-visible:ring-[var(--color-status-error)]',
        ],
      },
      size: {
        sm: 'h-9 px-3 py-1 text-sm',
        md: 'h-11 px-4 py-2 text-base',
        lg: 'h-13 px-6 py-3 text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  error?: boolean
  label?: string
  helperText?: string
  required?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, size, error, label, helperText, required, id, ...props }, ref) => {
    const inputId = id || `input-${React.useId()}`
    const helperTextId = `${inputId}-helper`
    const errorId = `${inputId}-error`

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-[var(--color-text-primary)]"
          >
            {label}
            {required && <span className="text-[var(--color-status-error)] ml-1">*</span>}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            inputVariants({ variant: error ? 'error' : variant, size, className })
          )}
          aria-describedby={helperText ? helperTextId : undefined}
          aria-invalid={error ? 'true' : 'false'}
          aria-errormessage={error ? errorId : undefined}
          required={required}
          {...props}
        />
        {helperText && (
          <p
            id={helperTextId}
            className={cn(
              'text-sm',
              error ? 'text-[var(--color-status-error)]' : 'text-[var(--color-text-secondary)]'
            )}
          >
            {helperText}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input, inputVariants }