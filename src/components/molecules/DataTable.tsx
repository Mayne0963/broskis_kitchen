import * as React from 'react'
import { Table, TableColumn } from '@/components/atoms/Table'
import { Input } from '@/components/atoms/Input'
import { Select, SelectOption } from '@/components/atoms/Select'
import { Button } from '@/components/atoms/Button'
import { Badge } from '@/components/atoms/Badge'
import { Card } from '@/components/atoms/Card'
import { Typography } from '@/components/atoms/Typography'
import { cn } from '@/lib/utils'
import { Search, Filter, Download, RefreshCw, Settings, Eye, Edit, Trash2, Plus } from 'lucide-react'

export interface DataTableFilter {
  key: string
  label: string
  type: 'text' | 'select' | 'date' | 'number'
  options?: SelectOption[]
  placeholder?: string
}

export interface DataTableAction<T> {
  key: string
  label: string
  icon?: React.ReactNode
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gold'
  onClick: (record: T) => void
  visible?: (record: T) => boolean
  disabled?: (record: T) => boolean
}

export interface DataTableBulkAction<T> {
  key: string
  label: string
  icon?: React.ReactNode
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gold'
  onClick: (selectedRecords: T[]) => void
  disabled?: (selectedRecords: T[]) => boolean
}

export interface DataTableProps<T> {
  title?: string
  subtitle?: string
  columns: TableColumn<T>[]
  data: T[]
  loading?: boolean
  error?: string
  emptyText?: string
  rowKey: (record: T) => string | number
  
  // Search and filtering
  searchable?: boolean
  searchPlaceholder?: string
  searchFields?: string[]
  filters?: DataTableFilter[]
  onFilterChange?: (filters: Record<string, any>) => void
  
  // Actions
  actions?: DataTableAction<T>[]
  bulkActions?: DataTableBulkAction<T>[]
  onRowClick?: (record: T) => void
  
  // Pagination
  pagination?: {
    current: number
    pageSize: number
    total: number
    onChange: (page: number, pageSize?: number) => void
    showSizeChanger?: boolean
    pageSizeOptions?: number[]
    showTotal?: boolean
  }
  
  // Sorting
  sortable?: boolean
  defaultSort?: { key: string; direction: 'asc' | 'desc' }
  onSort?: (key: string, direction: 'asc' | 'desc') => void
  
  // Selection
  selectable?: boolean
  selectedRowKeys?: (string | number)[]
  onSelectionChange?: (selectedKeys: (string | number)[]) => void
  
  // Export
  exportable?: boolean
  onExport?: (data: T[]) => void
  exportFormats?: ('csv' | 'json' | 'xlsx')[]
  
  // Refresh
  refreshable?: boolean
  onRefresh?: () => void
  
  // Settings
  settings?: boolean
  columnVisibility?: Record<string, boolean>
  onColumnVisibilityChange?: (visibility: Record<string, boolean>) => void
  
  // Styling
  className?: string
  variant?: 'default' | 'striped' | 'bordered'
  size?: 'sm' | 'md' | 'lg'
}

export function DataTable<T>({
  title,
  subtitle,
  columns,
  data,
  loading,
  error,
  emptyText = 'No data available',
  rowKey,
  searchable = true,
  searchPlaceholder = 'Search...',
  searchFields,
  filters = [],
  onFilterChange,
  actions = [],
  bulkActions = [],
  onRowClick,
  pagination,
  sortable = true,
  defaultSort,
  onSort,
  selectable = false,
  selectedRowKeys = [],
  onSelectionChange,
  exportable = false,
  onExport,
  exportFormats = ['csv'],
  refreshable = false,
  onRefresh,
  settings = false,
  columnVisibility,
  onColumnVisibilityChange,
  className,
  variant = 'striped',
  size = 'md',
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = React.useState('')
  const [activeFilters, setActiveFilters] = React.useState<Record<string, any>>({})
  const [showFilters, setShowFilters] = React.useState(false)
  const [showSettings, setShowSettings] = React.useState(false)
  const [showExport, setShowExport] = React.useState(false)
  
  // Filter data based on search and filters
  const filteredData = React.useMemo(() => {
    let result = [...data]
    
    // Apply search filter
    if (searchTerm && searchFields && searchFields.length > 0) {
      result = result.filter(record =>
        searchFields.some(field => {
          const value = (record as any)[field]
          return value && String(value).toLowerCase().includes(searchTerm.toLowerCase())
        })
      )
    }
    
    // Apply active filters
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        result = result.filter(record => {
          const recordValue = (record as any)[key]
          if (typeof recordValue === 'string') {
            return recordValue.toLowerCase().includes(String(value).toLowerCase())
          }
          return recordValue === value
        })
      }
    })
    
    return result
  }, [data, searchTerm, searchFields, activeFilters])
  
  // Handle filter changes
  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...activeFilters, [key]: value }
    setActiveFilters(newFilters)
    onFilterChange?.(newFilters)
  }
  
  // Handle bulk actions
  const selectedRecords = React.useMemo(() => {
    return data.filter(record => selectedRowKeys.includes(rowKey(record)))
  }, [data, selectedRowKeys, rowKey])
  
  // Handle export
  const handleExport = (format: 'csv' | 'json' | 'xlsx') => {
    if (onExport) {
      onExport(filteredData)
    } else {
      // Default export implementation
      const exportData = filteredData.map(record => {
        const exportRecord: any = {}
        columns.forEach(column => {
          if (column.key !== 'action') {
            exportRecord[column.header] = (record as any)[column.key]
          }
        })
        return exportRecord
      })
      
      if (format === 'json') {
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `data-${new Date().toISOString().split('T')[0]}.json`
        a.click()
        URL.revokeObjectURL(url)
      } else if (format === 'csv') {
        const headers = Object.keys(exportData[0] || {}).join(',')
        const rows = exportData.map(row => Object.values(row).join(',')).join('\n')
        const csv = `${headers}\n${rows}`
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `data-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        URL.revokeObjectURL(url)
      }
    }
    setShowExport(false)
  }
  
  // Visible columns based on settings
  const visibleColumns = React.useMemo(() => {
    if (!settings || !columnVisibility) return columns
    return columns.filter(column => columnVisibility[String(column.key)] !== false)
  }, [columns, settings, columnVisibility])
  
  return (
    <Card className={cn('p-6', className)}>
      {/* Header */}
      {(title || subtitle || searchable || filters.length > 0 || exportable || refreshable || settings) && (
        <div className="mb-6 space-y-4">
          {title && (
            <div>
              <Typography variant="h3">{title}</Typography>
              {subtitle && (
                <Typography variant="body2" className="text-[var(--color-text-secondary)] mt-1">
                  {subtitle}
                </Typography>
              )}
            </div>
          )}
          
          {/* Toolbar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              {/* Search */}
              {searchable && (
                <div className="w-full sm:w-80">
                  <Input
                    placeholder={searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              )}
              
              {/* Filters */}
              {filters.length > 0 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    icon={<Filter className="h-4 w-4" />}
                  >
                    Filters
                  </Button>
                </div>
              )}
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-2">
              {refreshable && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRefresh}
                  icon={<RefreshCw className="h-4 w-4" />}
                >
                  Refresh
                </Button>
              )}
              
              {exportable && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowExport(!showExport)}
                  icon={<Download className="h-4 w-4" />}
                >
                  Export
                </Button>
              )}
              
              {settings && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(!showSettings)}
                  icon={<Settings className="h-4 w-4" />}
                />
              )}
            </div>
          </div>
          
          {/* Filter Panel */}
          {showFilters && filters.length > 0 && (
            <Card variant="subtle" className="p-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filters.map((filter) => (
                  <div key={filter.key}>
                    {filter.type === 'select' ? (
                      <Select
                        label={filter.label}
                        placeholder={filter.placeholder}
                        options={filter.options || []}
                        value={activeFilters[filter.key] || ''}
                        onChange={(value) => handleFilterChange(filter.key, value)}
                      />
                    ) : (
                      <Input
                        label={filter.label}
                        placeholder={filter.placeholder}
                        type={filter.type}
                        value={activeFilters[filter.key] || ''}
                        onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                      />
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
          
          {/* Export Panel */}
          {showExport && (
            <Card variant="subtle" className="p-4">
              <div className="flex items-center gap-2">
                <Typography variant="body2" className="font-medium">
                  Export Format:
                </Typography>
                {exportFormats.map((format) => (
                  <Button
                    key={format}
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport(format)}
                  >
                    {format.toUpperCase()}
                  </Button>
                ))}
              </div>
            </Card>
          )}
          
          {/* Settings Panel */}
          {showSettings && settings && (
            <Card variant="subtle" className="p-4">
              <Typography variant="body2" className="font-medium mb-3">
                Column Visibility:
              </Typography>
              <div className="space-y-2">
                {columns.map((column) => (
                  <label key={String(column.key)} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={columnVisibility?.[String(column.key)] !== false}
                      onChange={(e) => {
                        const newVisibility = {
                          ...columnVisibility,
                          [String(column.key)]: e.target.checked,
                        }
                        onColumnVisibilityChange?.(newVisibility)
                      }}
                      className="rounded border-[var(--color-border)]"
                    />
                    <Typography variant="body2">{column.header}</Typography>
                  </label>
                ))}
              </div>
            </Card>
          )}
          
          {/* Bulk Actions */}
          {selectable && selectedRowKeys.length > 0 && bulkActions.length > 0 && (
            <Card variant="subtle" className="p-4">
              <div className="flex items-center justify-between">
                <Typography variant="body2">
                  {selectedRowKeys.length} item(s) selected
                </Typography>
                <div className="flex items-center gap-2">
                  {bulkActions.map((action) => (
                    <Button
                      key={action.key}
                      variant={action.variant || 'outline'}
                      size="sm"
                      onClick={() => action.onClick(selectedRecords)}
                      disabled={action.disabled?.(selectedRecords)}
                      icon={action.icon}
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
      
      {/* Error State */}
      {error && (
        <Card variant="error" className="mb-4 p-4">
          <Typography variant="body2" className="text-[var(--color-status-error)]">
            {error}
          </Typography>
        </Card>
      )}
      
      {/* Table */}
      <Table
        columns={visibleColumns}
        data={filteredData}
        loading={loading}
        emptyText={emptyText}
        rowKey={rowKey}
        onRowClick={onRowClick}
        pagination={pagination}
        selectable={selectable}
        selectedRowKeys={selectedRowKeys}
        onSelectRow={onSelectionChange}
        variant={variant}
        size={size}
        defaultSort={defaultSort}
        onSort={onSort}
      />
    </Card>
  )
}