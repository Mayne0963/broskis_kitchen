import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { ChevronDown, Search } from 'lucide-react'

const selectVariants = cva(
  'flex w-full items-center justify-between rounded-md border-2 bg-transparent text-base transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: [
          'border-[var(--color-border)]',
          'text-[var(--color-text-primary)]',
          'hover:border-[var(--color-border-hover)]',
          'focus-visible:border-[var(--color-brand-gold)]',
          'focus-visible:ring-[var(--color-brand-gold)]',
        ],
        gold: [
          'border-[var(--color-brand-gold-dark)]',
          'text-[var(--color-text-primary)]',
          'hover:border-[var(--color-brand-gold)]',
          'focus-visible:border-[var(--color-brand-gold)]',
          'focus-visible:ring-[var(--color-brand-gold)]',
          'bg-gradient-to-r from-[var(--color-brand-gold-light-transparent)] to-[var(--color-brand-gold-transparent)]',
        ],
        burgundy: [
          'border-[var(--color-brand-burgundy-dark)]',
          'text-[var(--color-text-primary)]',
          'hover:border-[var(--color-brand-burgundy)]',
          'focus-visible:border-[var(--color-brand-burgundy)]',
          'focus-visible:ring-[var(--color-brand-burgundy)]',
          'bg-gradient-to-r from-[var(--color-brand-burgundy-light-transparent)] to-[var(--color-brand-burgundy-transparent)]',
        ],
        error: [
          'border-[var(--color-status-error)]',
          'text-[var(--color-text-primary)]',
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

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'value' | 'onChange'>,
    VariantProps<typeof selectVariants> {
  value?: string
  onChange?: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  searchable?: boolean
  error?: boolean
  label?: string
  helperText?: string
  required?: boolean
  emptyText?: string
}

const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
  ({
    className,
    variant,
    size,
    value,
    onChange,
    options,
    placeholder = 'Select an option',
    searchable = false,
    error,
    label,
    helperText,
    required,
    emptyText = 'No options available',
    id,
    ...props
  }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false)
    const [searchTerm, setSearchTerm] = React.useState('')
    const [focusedIndex, setFocusedIndex] = React.useState(-1)
    const selectId = id || `select-${React.useId()}`
    const helperTextId = `${selectId}-helper`
    const errorId = `${selectId}-error`

    const filteredOptions = React.useMemo(() => {
      if (!searchable) return options
      return options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        option.value.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }, [options, searchTerm, searchable])

    const selectedOption = React.useMemo(() => {
      return options.find(option => option.value === value)
    }, [options, value])

    const handleSelect = (optionValue: string) => {
      onChange?.(optionValue)
      setIsOpen(false)
      setSearchTerm('')
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          setIsOpen(true)
        }
        return
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setFocusedIndex(prev => 
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setFocusedIndex(prev => 
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          )
          break
        case 'Enter':
          e.preventDefault()
          if (focusedIndex >= 0 && filteredOptions[focusedIndex]) {
            handleSelect(filteredOptions[focusedIndex].value)
          }
          break
        case 'Escape':
          e.preventDefault()
          setIsOpen(false)
          setSearchTerm('')
          break
        case 'Tab':
          setIsOpen(false)
          setSearchTerm('')
          break
      }
    }

    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Element
        if (!target.closest(`[data-select-id="${selectId}"]`)) {
          setIsOpen(false)
          setSearchTerm('')
        }
      }

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
      }
    }, [isOpen, selectId])

    React.useEffect(() => {
      if (focusedIndex >= 0) {
        const optionElement = document.querySelector(`[data-option-index="${focusedIndex}"]`)
        optionElement?.scrollIntoView({ block: 'nearest' })
      }
    }, [focusedIndex])

    return (
      <div className="space-y-2" data-select-id={selectId}>
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-[var(--color-text-primary)]"
          >
            {label}
            {required && <span className="text-[var(--color-status-error)] ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <button
            ref={ref}
            id={selectId}
            type="button"
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-controls={`${selectId}-listbox`}
            aria-describedby={error ? errorId : helperText ? helperTextId : undefined}
            aria-invalid={error ? 'true' : 'false'}
            aria-errormessage={error ? errorId : undefined}
            className={cn(
              selectVariants({ variant: error ? 'error' : variant, size, className }),
              'w-full text-left'
            )}
            onClick={() => setIsOpen(!isOpen)}
            onKeyDown={handleKeyDown}
            required={required}
            {...props}
          >
            <span className="flex-1 truncate">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <ChevronDown className={cn(
              'ml-2 h-4 w-4 shrink-0 transition-transform duration-200',
              isOpen && 'rotate-180'
            )} />
          </button>

          {isOpen && (
            <div className="absolute z-50 mt-1 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] shadow-lg animate-in fade-in-0 zoom-in-95 duration-200">
              {searchable && (
                <div className="flex items-center gap-2 border-b border-[var(--color-border)] p-3">
                  <Search className="h-4 w-4 text-[var(--color-text-secondary)]" />
                  <input
                    type="text"
                    placeholder="Search options..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-text-secondary)]"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                </div>
              )}
              <ul
                id={`${selectId}-listbox`}
                role="listbox"
                className="max-h-60 overflow-auto py-1"
              >
                {filteredOptions.length === 0 ? (
                  <li className="px-3 py-2 text-sm text-[var(--color-text-secondary)]">
                    {emptyText}
                  </li>
                ) : (
                  filteredOptions.map((option, index) => (
                    <li
                      key={option.value}
                      role="option"
                      aria-selected={option.value === value}
                      data-option-index={index}
                      className={cn(
                        'relative cursor-pointer select-none px-3 py-2 text-sm transition-colors',
                        'hover:bg-[var(--color-background-subtle)]',
                        option.disabled && 'cursor-not-allowed opacity-50',
                        option.value === value && 'bg-[var(--color-brand-gold-light-transparent)] text-[var(--color-brand-gold-dark)]',
                        focusedIndex === index && 'bg-[var(--color-background-subtle)]'
                      )}
                      onClick={() => !option.disabled && handleSelect(option.value)}
                    >
                      <span className="block truncate">{option.label}</span>
                      {option.value === value && (
                        <span className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <div className="h-2 w-2 rounded-full bg-[var(--color-brand-gold)]" />
                        </span>
                      )}
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>
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
Select.displayName = 'Select'

export { Select, selectVariants }