'use client'

import React, { useState, useRef, useEffect, useId } from 'react'
import { AccessibleColors } from './ColorContrast'

// Accessible form field wrapper
interface AccessibleFormFieldProps {
  children: React.ReactNode
  label: string
  id: string
  error?: string
  required?: boolean
  description?: string
  className?: string
}

export function AccessibleFormField({
  children,
  label,
  id,
  error,
  required = false,
  description,
  className = ''
}: AccessibleFormFieldProps) {
  const errorId = `${id}-error`
  const descriptionId = `${id}-description`
  const hasError = Boolean(error)

  return (
    <div className={`space-y-2 ${className}`}>
      <label 
        htmlFor={id}
        className={`
          block text-sm font-medium
          ${hasError ? 'text-red-400' : 'text-white'}
          transition-colors duration-200
        `}
      >
        {label}
        {required && (
          <span className="text-red-400 ml-1" aria-label="required">
            *
          </span>
        )}
      </label>
      
      {description && (
        <p 
          id={descriptionId}
          className="text-sm text-gray-300"
        >
          {description}
        </p>
      )}
      
      <div className="relative">
        {React.cloneElement(children as React.ReactElement, {
          id,
          'aria-required': required,
          'aria-invalid': hasError,
          'aria-describedby': [
            description ? descriptionId : '',
            error ? errorId : ''
          ].filter(Boolean).join(' ') || undefined,
          className: `
            ${(children as React.ReactElement).props.className || ''}
            ${hasError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
          `
        })}
      </div>
      
      {error && (
        <p 
          id={errorId}
          className="text-sm text-red-400 flex items-center gap-1"
          role="alert"
          aria-live="polite"
        >
          <svg 
            className="w-4 h-4 flex-shrink-0" 
            fill="currentColor" 
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path 
              fillRule="evenodd" 
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
              clipRule="evenodd" 
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}

// Accessible input component
interface AccessibleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  description?: string
  showLabel?: boolean
}

export function AccessibleInput({
  label,
  error,
  description,
  showLabel = true,
  className = '',
  ...props
}: AccessibleInputProps) {
  const uid = useId()
  const inputId = props.id ?? `input-${uid}`
  
  const inputElement = (
    <input
      {...props}
      id={inputId}
      className={`
        w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md
        text-white placeholder-gray-400
        focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-200
        ${className}
      `}
    />
  )

  if (!showLabel || !label) {
    return inputElement
  }

  return (
    <AccessibleFormField
      label={label}
      id={inputId}
      error={error}
      description={description}
      required={props.required}
    >
      {inputElement}
    </AccessibleFormField>
  )
}

// Accessible textarea component
interface AccessibleTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  description?: string
  showLabel?: boolean
}

export function AccessibleTextarea({
  label,
  error,
  description,
  showLabel = true,
  className = '',
  ...props
}: AccessibleTextareaProps) {
  const uid = useId()
  const textareaId = props.id ?? `textarea-${uid}`
  
  const textareaElement = (
    <textarea
      {...props}
      id={textareaId}
      className={`
        w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md
        text-white placeholder-gray-400
        focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-200 resize-vertical
        ${className}
      `}
    />
  )

  if (!showLabel || !label) {
    return textareaElement
  }

  return (
    <AccessibleFormField
      label={label}
      id={textareaId}
      error={error}
      description={description}
      required={props.required}
    >
      {textareaElement}
    </AccessibleFormField>
  )
}

// Accessible select component
interface AccessibleSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  description?: string
  showLabel?: boolean
  options: Array<{ value: string; label: string; disabled?: boolean }>
  placeholder?: string
}

export function AccessibleSelect({
  label,
  error,
  description,
  showLabel = true,
  options,
  placeholder,
  className = '',
  ...props
}: AccessibleSelectProps) {
  const uid = useId()
  const selectId = props.id ?? `select-${uid}`
  
  const selectElement = (
    <select
      {...props}
      id={selectId}
      className={`
        w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md
        text-white
        focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-200
        ${className}
      `}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option 
          key={option.value} 
          value={option.value}
          disabled={option.disabled}
        >
          {option.label}
        </option>
      ))}
    </select>
  )

  if (!showLabel || !label) {
    return selectElement
  }

  return (
    <AccessibleFormField
      label={label}
      id={selectId}
      error={error}
      description={description}
      required={props.required}
    >
      {selectElement}
    </AccessibleFormField>
  )
}

// Accessible checkbox component
interface AccessibleCheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  description?: string
  error?: string
}

export function AccessibleCheckbox({
  label,
  description,
  error,
  className = '',
  ...props
}: AccessibleCheckboxProps) {
  const uid = useId()
  const checkboxId = props.id ?? `checkbox-${uid}`
  const descriptionId = description ? `${checkboxId}-description` : undefined
  const errorId = error ? `${checkboxId}-error` : undefined

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-start gap-3">
        <input
          {...props}
          type="checkbox"
          id={checkboxId}
          className="
            w-4 h-4 mt-1 text-amber-400 bg-gray-800 border-gray-600 rounded
            focus:ring-amber-400 focus:ring-2 focus:ring-offset-2 focus:ring-offset-black
            transition-all duration-200
          "
          aria-describedby={[
            descriptionId,
            errorId
          ].filter(Boolean).join(' ') || undefined}
        />
        <div className="flex-1">
          <label 
            htmlFor={checkboxId}
            className="text-sm font-medium text-white cursor-pointer"
          >
            {label}
          </label>
          {description && (
            <p 
              id={descriptionId}
              className="text-sm text-gray-300 mt-1"
            >
              {description}
            </p>
          )}
        </div>
      </div>
      
      {error && (
        <p 
          id={errorId}
          className="text-sm text-red-400 flex items-center gap-1 ml-7"
          role="alert"
          aria-live="polite"
        >
          <svg 
            className="w-4 h-4 flex-shrink-0" 
            fill="currentColor" 
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path 
              fillRule="evenodd" 
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
              clipRule="evenodd" 
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}

// Accessible radio group component
interface RadioOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

interface AccessibleRadioGroupProps {
  name: string
  label: string
  options: RadioOption[]
  value?: string
  onChange?: (value: string) => void
  error?: string
  description?: string
  required?: boolean
  className?: string
}

export function AccessibleRadioGroup({
  name,
  label,
  options,
  value,
  onChange,
  error,
  description,
  required = false,
  className = ''
}: AccessibleRadioGroupProps) {
  const uid = useId()
  const groupId = `radio-group-${uid}`
  const descriptionId = description ? `${groupId}-description` : undefined
  const errorId = error ? `${groupId}-error` : undefined

  return (
    <fieldset className={`space-y-3 ${className}`}>
      <legend className="text-sm font-medium text-white">
        {label}
        {required && (
          <span className="text-red-400 ml-1" aria-label="required">
            *
          </span>
        )}
      </legend>
      
      {description && (
        <p 
          id={descriptionId}
          className="text-sm text-gray-300"
        >
          {description}
        </p>
      )}
      
      <div 
        className="space-y-2"
        role="radiogroup"
        aria-describedby={[
          descriptionId,
          errorId
        ].filter(Boolean).join(' ') || undefined}
        aria-required={required}
        aria-invalid={Boolean(error)}
      >
        {options.map((option, index) => {
          const radioId = `${groupId}-${index}`
          const optionDescriptionId = option.description ? `${radioId}-description` : undefined
          
          return (
            <div key={option.value} className="flex items-start gap-3">
              <input
                type="radio"
                id={radioId}
                name={name}
                value={option.value}
                checked={value === option.value}
                onChange={() => onChange?.(option.value)}
                disabled={option.disabled}
                className="
                  w-4 h-4 mt-1 text-amber-400 bg-gray-800 border-gray-600
                  focus:ring-amber-400 focus:ring-2 focus:ring-offset-2 focus:ring-offset-black
                  transition-all duration-200
                "
                aria-describedby={optionDescriptionId}
              />
              <div className="flex-1">
                <label 
                  htmlFor={radioId}
                  className={`
                    text-sm font-medium cursor-pointer
                    ${option.disabled ? 'text-gray-500' : 'text-white'}
                  `}
                >
                  {option.label}
                </label>
                {option.description && (
                  <p 
                    id={optionDescriptionId}
                    className="text-sm text-gray-300 mt-1"
                  >
                    {option.description}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
      
      {error && (
        <p 
          id={errorId}
          className="text-sm text-red-400 flex items-center gap-1"
          role="alert"
          aria-live="polite"
        >
          <svg 
            className="w-4 h-4 flex-shrink-0" 
            fill="currentColor" 
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path 
              fillRule="evenodd" 
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
              clipRule="evenodd" 
            />
          </svg>
          {error}
        </p>
      )}
    </fieldset>
  )
}

// Form validation hook
export function useFormValidation<T extends Record<string, any>>(initialValues: T) {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({})

  const setValue = (name: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const setError = (name: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [name]: error }))
  }

  const markFieldAsTouched = (name: keyof T) => {
    setTouched(prev => ({ ...prev, [name]: true }))
  }

  const validate = (validationRules: Partial<Record<keyof T, (value: any) => string | undefined>>) => {
    const newErrors: Partial<Record<keyof T, string>> = {}
    let isValid = true

    Object.keys(validationRules).forEach(key => {
      const rule = validationRules[key as keyof T]
      if (rule) {
        const error = rule(values[key as keyof T])
        if (error) {
          newErrors[key as keyof T] = error
          isValid = false
        }
      }
    })

    setErrors(newErrors)
    return isValid
  }

  const reset = () => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
  }

  return {
    values,
    errors,
    touched,
    setValue,
    setError,
    setTouched: markFieldAsTouched,
    validate,
    reset
  }
}

export default AccessibleFormField