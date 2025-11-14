import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

const tableVariants = cva('w-full caption-bottom text-sm', {
  variants: {
    variant: {
      default: 'border-separate border-spacing-0',
      striped: 'border-separate border-spacing-0',
      bordered: 'border-collapse border-2 border-[var(--color-border)]',
    },
    size: {
      sm: '[&_td]:px-3 [&_td]:py-2 [&_th]:px-3 [&_th]:py-2',
      md: '[&_td]:px-4 [&_td]:py-3 [&_th]:px-4 [&_th]:py-3',
      lg: '[&_td]:px-6 [&_td]:py-4 [&_th]:px-6 [&_th]:py-4',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
})

export interface TableColumn<T> {
  key: keyof T | string
  header: string
  sortable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
  render?: (value: any, record: T, index: number) => React.ReactNode
}

export interface TableProps<T> extends React.HTMLAttributes<HTMLTableElement>, VariantProps<typeof tableVariants> {
  columns: TableColumn<T>[]
  data: T[]
  loading?: boolean
  emptyText?: string
  rowKey?: (record: T) => string | number
  onRowClick?: (record: T, index: number) => void
  onSort?: (key: string, direction: 'asc' | 'desc') => void
  defaultSort?: { key: string; direction: 'asc' | 'desc' }
  pagination?: {
    current: number
    pageSize: number
    total: number
    onChange: (page: number) => void
    showSizeChanger?: boolean
    pageSizeOptions?: number[]
    showQuickJumper?: boolean
    showTotal?: boolean
  }
  selectable?: boolean
  selectedRowKeys?: (string | number)[]
  onSelectRow?: (keys: (string | number)[]) => void
  rowClassName?: (record: T, index: number) => string
}

interface TableContextValue {
  sortKey: string | null
  sortDirection: 'asc' | 'desc' | null
  handleSort: (key: string) => void
}

const TableContext = React.createContext<TableContextValue | null>(null)

const useTableContext = () => {
  const context = React.useContext(TableContext)
  if (!context) {
    throw new Error('Table components must be used within a Table')
  }
  return context
}

function TableHeader<T>({ columns }: { columns: TableColumn<T>[] }) {
  const { sortKey, sortDirection, handleSort } = useTableContext()

  return (
    <thead>
      <tr className="border-b-2 border-[var(--color-border)] transition-colors hover:bg-[var(--color-background-subtle)]">
        {columns.map((column) => (
          <th
            key={String(column.key)}
            className={cn(
              'h-12 px-4 text-left align-middle font-medium text-[var(--color-text-primary)]',
              column.align === 'center' && 'text-center',
              column.align === 'right' && 'text-right',
              column.sortable && 'cursor-pointer select-none hover:bg-[var(--color-background-subtle)]',
              column.width && `w-[${column.width}]`
            )}
            style={column.width ? { width: column.width } : undefined}
            onClick={() => column.sortable && handleSort(String(column.key))}
            aria-sort={column.sortable && sortKey === String(column.key) ? sortDirection : undefined}
          >
            <div className="flex items-center gap-2">
              {column.header}
              {column.sortable && sortKey === String(column.key) && (
                <span className="flex items-center">
                  {sortDirection === 'asc' ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </span>
              )}
              {column.sortable && sortKey !== String(column.key) && (
                <span className="flex items-center opacity-30">
                  <ChevronUp className="h-4 w-4" />
                </span>
              )}
            </div>
          </th>
        ))}
      </tr>
    </thead>
  )
}

function TableBody<T>({
  columns,
  data,
  loading,
  emptyText,
  rowKey,
  onRowClick,
  selectable,
  selectedRowKeys,
  onSelectRow,
  rowClassName,
  variant,
}: {
  columns: TableColumn<T>[]
  data: T[]
  loading?: boolean
  emptyText?: string
  rowKey?: (record: T) => string | number
  onRowClick?: (record: T, index: number) => void
  selectable?: boolean
  selectedRowKeys?: (string | number)[]
  onSelectRow?: (keys: (string | number)[]) => void
  rowClassName?: (record: T, index: number) => string
  variant?: 'default' | 'striped' | 'bordered'
}) {
  if (loading) {
    return (
      <tbody>
        <tr>
          <td colSpan={columns.length} className="h-24 text-center">
            <div className="flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-border)] border-t-[var(--color-brand-gold)]" />
            </div>
          </td>
        </tr>
      </tbody>
    )
  }

  if (data.length === 0) {
    return (
      <tbody>
        <tr>
          <td colSpan={columns.length} className="h-24 text-center text-[var(--color-text-secondary)]">
            {emptyText || 'No data available'}
          </td>
        </tr>
      </tbody>
    )
  }

  const handleRowSelect = (key: string | number) => {
    if (!onSelectRow || !selectedRowKeys) return
    
    const newSelectedKeys = selectedRowKeys.includes(key)
      ? selectedRowKeys.filter(k => k !== key)
      : [...selectedRowKeys, key]
    
    onSelectRow(newSelectedKeys)
  }

  return (
    <tbody>
      {data.map((record, index) => {
        const key = rowKey ? rowKey(record) : index
        const isSelected = selectedRowKeys?.includes(key)
        
        return (
          <tr
            key={key}
            className={cn(
              'border-b border-[var(--color-border)] transition-colors hover:bg-[var(--color-background-subtle)]',
              variant === 'striped' && index % 2 === 0 && 'bg-[var(--color-background-subtle)]',
              onRowClick && 'cursor-pointer',
              isSelected && 'bg-[var(--color-brand-gold-light-transparent)]',
              rowClassName?.(record, index)
            )}
            onClick={() => onRowClick?.(record, index)}
            aria-selected={isSelected}
          >
            {columns.map((column) => (
              <td
                key={String(column.key)}
                className={cn(
                  'p-4 align-middle text-[var(--color-text-primary)]',
                  column.align === 'center' && 'text-center',
                  column.align === 'right' && 'text-right'
                )}
              >
                {column.render
                  ? column.render((record as any)[column.key], record, index)
                  : (record as any)[column.key]}
              </td>
            ))}
          </tr>
        )
      })}
    </tbody>
  )
}

function Pagination({
  current,
  pageSize,
  total,
  onChange,
  showSizeChanger,
  pageSizeOptions = [10, 20, 50, 100],
  showQuickJumper,
  showTotal,
}: {
  current: number
  pageSize: number
  total: number
  onChange: (page: number) => void
  showSizeChanger?: boolean
  pageSizeOptions?: number[]
  showQuickJumper?: boolean
  showTotal?: boolean
}) {
  const totalPages = Math.ceil(total / pageSize)
  const startItem = (current - 1) * pageSize + 1
  const endItem = Math.min(current * pageSize, total)

  const pageNumbers = React.useMemo(() => {
    const pages = []
    const maxVisiblePages = 5
    let startPage = Math.max(1, current - Math.floor(maxVisiblePages / 2))
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }
    return pages
  }, [current, totalPages])

  return (
    <div className="flex items-center justify-between border-t border-[var(--color-border)] px-4 py-3">
      {showTotal && (
        <div className="text-sm text-[var(--color-text-secondary)]">
          Showing {startItem} to {endItem} of {total} results
        </div>
      )}
      
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(1)}
          disabled={current === 1}
          className="flex items-center justify-center rounded-md border border-[var(--color-border)] p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-background-subtle)] disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="First page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>
        
        <button
          onClick={() => onChange(current - 1)}
          disabled={current === 1}
          className="flex items-center justify-center rounded-md border border-[var(--color-border)] p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-background-subtle)] disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {pageNumbers.map((page) => (
          <button
            key={page}
            onClick={() => onChange(page)}
            className={cn(
              'flex items-center justify-center rounded-md border px-3 py-2 text-sm',
              current === page
                ? 'border-[var(--color-brand-gold)] bg-[var(--color-brand-gold-light-transparent)] text-[var(--color-brand-gold-dark)]'
                : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-background-subtle)]'
            )}
            aria-current={current === page ? 'page' : undefined}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onChange(current + 1)}
          disabled={current === totalPages}
          className="flex items-center justify-center rounded-md border border-[var(--color-border)] p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-background-subtle)] disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        
        <button
          onClick={() => onChange(totalPages)}
          disabled={current === totalPages}
          className="flex items-center justify-center rounded-md border border-[var(--color-border)] p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-background-subtle)] disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Last page"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>

      {showSizeChanger && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--color-text-secondary)]">Show</span>
          <select
            value={pageSize}
            onChange={(e) => onChange(1)}
            className="rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-1 text-sm"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span className="text-sm text-[var(--color-text-secondary)]">entries</span>
        </div>
      )}
    </div>
  )
}

function Table<T>({
  className,
  variant,
  size,
  columns,
  data,
  loading,
  emptyText,
  rowKey,
  onRowClick,
  onSort,
  defaultSort,
  pagination,
  selectable,
  selectedRowKeys,
  onSelectRow,
  rowClassName,
  ...props
}: TableProps<T>) {
  const [sortKey, setSortKey] = React.useState<string | null>(defaultSort?.key || null)
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc' | null>(defaultSort?.direction || null)

  const handleSort = (key: string) => {
    const newDirection = sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc'
    setSortKey(key)
    setSortDirection(newDirection)
    onSort?.(key, newDirection)
  }

  const contextValue = React.useMemo(
    () => ({ sortKey, sortDirection, handleSort }),
    [sortKey, sortDirection, handleSort]
  )

  return (
    <TableContext.Provider value={contextValue}>
      <div className={cn('w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] shadow-sm', className)}>
        <div className="relative overflow-auto">
          <table className={tableVariants({ variant, size })} {...props}>
            <TableHeader columns={columns} />
            <TableBody
              columns={columns}
              data={data}
              loading={loading}
              emptyText={emptyText}
              rowKey={rowKey}
              onRowClick={onRowClick}
              selectable={selectable}
              selectedRowKeys={selectedRowKeys}
              onSelectRow={onSelectRow}
              rowClassName={rowClassName}
              variant={variant}
            />
          </table>
        </div>
        {pagination && (
          <Pagination {...pagination} />
        )}
      </div>
    </TableContext.Provider>
  )
}

Table.displayName = 'Table'

export { Table, tableVariants }