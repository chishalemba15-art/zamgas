'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'

export interface DataTableColumn<T> {
  key: keyof T
  label: string
  render?: (value: any, row: T) => React.ReactNode
  width?: string
}

export interface DataTableAction {
  label: string
  icon?: React.ReactNode
  onClick: (row: any) => void
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: (row: any) => boolean
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  actions?: DataTableAction[]
  loading?: boolean
  onSearch?: (query: string) => void
  pagination?: {
    page: number
    limit: number
    total: number
    onPageChange: (page: number) => void
  }
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  actions,
  loading = false,
  onSearch,
  pagination,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    onSearch?.(query)
  }

  const totalPages = pagination ? Math.ceil(pagination.total / pagination.limit) : 1
  const startIndex = pagination ? (pagination.page - 1) * pagination.limit + 1 : 1
  const endIndex = pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : data.length

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Search bar */}
      {onSearch && (
        <div className="border-b border-gray-200 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className="px-6 py-3 text-left text-sm font-semibold text-gray-900"
                  style={{ width: col.width }}
                >
                  {col.label}
                </th>
              ))}
              {actions && <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-6 py-8 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="px-6 py-8 text-center text-gray-600"
                >
                  No data found
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={row.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                  {columns.map((col) => (
                    <td key={String(col.key)} className="px-6 py-4 text-sm text-gray-900">
                      {col.render ? col.render(row[col.key], row) : String(row[col.key])}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        {actions.map((action, idx) => (
                          <button
                            key={idx}
                            onClick={() => action.onClick(row)}
                            disabled={action.disabled?.(row)}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                              action.disabled?.(row)
                                ? 'opacity-50 cursor-not-allowed'
                                : action.variant === 'danger'
                                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                  : action.variant === 'secondary'
                                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            }`}
                          >
                            {action.icon && <span className="mr-1">{action.icon}</span>}
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {startIndex} to {endIndex} of {pagination.total} results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                const pageNum = pagination.page > 3 ? pagination.page - 2 + idx : idx + 1
                if (pageNum > totalPages) return null
                return (
                  <button
                    key={pageNum}
                    onClick={() => pagination.onPageChange(pageNum)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium ${
                      pagination.page === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page === totalPages}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
