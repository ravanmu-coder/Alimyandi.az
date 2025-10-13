import { useState } from 'react'
import { Filter, Download, Eye, User, Calendar, Activity } from 'lucide-react'
import { Button } from '../components/common/Button'
import { DataTable } from '../components/ui/DataTable'
import { FilterPanel } from '../components/ui/FilterPanel'
import { Badge } from '../components/common/Badge'
import { Pagination } from '../components/common/Pagination'
import { DetailDrawer } from '../components/ui/DetailDrawer'
import { useApiCall } from '../hooks/useFetch'
import { apiClient } from '../services/apiClient'

interface AuditLog {
  id: string
  action: string
  user: string
  userId: string
  resource: string
  resourceId: string
  details: string
  ipAddress: string
  userAgent: string
  timestamp: string
  status: 'success' | 'failed' | 'warning'
}

export function AuditLogsPage() {
  const [filters, setFilters] = useState({
    action: '',
    userId: '',
    dateFrom: '',
    dateTo: '',
    status: '',
    search: ''
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [showDetailDrawer, setShowDetailDrawer] = useState(false)
  const [sortBy, setSortBy] = useState<keyof AuditLog>('timestamp')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const { data: logs, loading } = useApiCall(() => 
    apiClient.getAuditLogs({
      page: currentPage,
      limit: 10,
      action: filters.action,
      userId: filters.userId,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo
    })
  )

  const filterGroups = [
    {
      title: 'Action',
      key: 'action',
      type: 'select' as const,
      options: [
        { label: 'Login', value: 'login' },
        { label: 'Logout', value: 'logout' },
        { label: 'Create', value: 'create' },
        { label: 'Update', value: 'update' },
        { label: 'Delete', value: 'delete' },
        { label: 'View', value: 'view' }
      ]
    },
    {
      title: 'User',
      key: 'userId',
      type: 'search' as const
    },
    {
      title: 'Date Range',
      key: 'dateRange',
      type: 'range' as const,
      min: 0,
      max: 1000000
    },
    {
      title: 'Status',
      key: 'status',
      type: 'select' as const,
      options: [
        { label: 'Success', value: 'success' },
        { label: 'Failed', value: 'failed' },
        { label: 'Warning', value: 'warning' }
      ]
    },
    {
      title: 'Search',
      key: 'search',
      type: 'search' as const
    }
  ]

  const columns = [
    {
      key: 'action' as keyof AuditLog,
      label: 'Action',
      sortable: true,
      render: (value: string, row: AuditLog) => (
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-electric-cobalt/10 rounded-lg">
            <Activity className="w-4 h-4 text-electric-cobalt" />
          </div>
          <div>
            <div className="font-medium text-midnight-900">{value}</div>
            <div className="text-sm text-midnight-500">{row.resource}</div>
          </div>
        </div>
      )
    },
    {
      key: 'user' as keyof AuditLog,
      label: 'User',
      sortable: true,
      render: (value: string, row: AuditLog) => (
        <div className="flex items-center space-x-2">
          <User className="w-4 h-4 text-midnight-500" />
          <div>
            <div className="font-medium text-midnight-900">{value}</div>
            <div className="text-sm text-midnight-500">ID: {row.userId}</div>
          </div>
        </div>
      )
    },
    {
      key: 'status' as keyof AuditLog,
      label: 'Status',
      sortable: true,
      render: (value: string) => (
        <Badge variant={
          value === 'success' ? 'success' :
          value === 'failed' ? 'danger' : 'warning'
        }>
          {value}
        </Badge>
      )
    },
    {
      key: 'timestamp' as keyof AuditLog,
      label: 'Timestamp',
      sortable: true,
      render: (value: string) => (
        <div className="text-sm">
          <div className="flex items-center space-x-1 text-midnight-900">
            <Calendar className="w-4 h-4" />
            <span>{new Date(value).toLocaleDateString()}</span>
          </div>
          <div className="text-midnight-500">
            {new Date(value).toLocaleTimeString()}
          </div>
        </div>
      )
    },
    {
      key: 'ipAddress' as keyof AuditLog,
      label: 'IP Address',
      sortable: true,
      render: (value: string) => (
        <span className="font-mono text-sm text-midnight-600">{value}</span>
      )
    }
  ]

  const handleFilterChange = (key: string, value: any) => {
    if (key === 'dateRange') {
      setFilters(prev => ({ 
        ...prev, 
        dateFrom: value.min || '',
        dateTo: value.max || ''
      }))
    } else {
      setFilters(prev => ({ ...prev, [key]: value }))
    }
  }

  const handleClearFilters = () => {
    setFilters({
      action: '',
      userId: '',
      dateFrom: '',
      dateTo: '',
      status: '',
      search: ''
    })
  }

  const handleSort = (column: keyof AuditLog) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortDirection('asc')
    }
  }

  const handleRowClick = (row: AuditLog) => {
    setSelectedLog(row)
    setShowDetailDrawer(true)
  }

  const handleRowActions = (_row: AuditLog) => (
    <Button variant="ghost" size="sm" icon={Eye} disabled />
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1 text-midnight-900 mb-2">Audit Logs</h1>
          <p className="text-midnight-600">Monitor system activities and user actions</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="secondary" icon={Download} disabled>
            Export
          </Button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Filters */}
        {showFilters && (
          <div className="w-80 flex-shrink-0">
            <FilterPanel
              filters={filterGroups}
              values={filters}
              onChange={handleFilterChange}
              onClear={handleClearFilters}
            />
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1">
          {/* Toolbar */}
          <div className="card mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  icon={Filter}
                  onClick={() => setShowFilters(!showFilters)}
                  className={showFilters ? 'bg-electric-cobalt/10 text-electric-cobalt' : ''}
                >
                  Filters
                </Button>
                <div className="text-sm text-midnight-600">
                  {loading ? 'Loading...' : 'No logs found'}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <select className="input w-auto">
                  <option>All Actions</option>
                  <option>Login</option>
                  <option>Create</option>
                  <option>Update</option>
                  <option>Delete</option>
                </select>
                <select className="input w-auto">
                  <option>All Status</option>
                  <option>Success</option>
                  <option>Failed</option>
                  <option>Warning</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <DataTable
            data={logs}
            columns={columns}
            loading={loading}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSort={handleSort}
            onRowClick={handleRowClick}
            actions={handleRowActions}
          />

          {/* Pagination */}
          {!loading && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={10}
                onPageChange={setCurrentPage}
                showInfo={true}
                totalItems={100}
                itemsPerPage={10}
              />
            </div>
          )}
        </div>
      </div>

      {/* Detail Drawer */}
      <DetailDrawer
        isOpen={showDetailDrawer}
        onClose={() => setShowDetailDrawer(false)}
        title="Audit Log Details"
      >
        {selectedLog ? (
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-midnight-900 mb-2">Action Details</h3>
                <div className="bg-midnight-50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-midnight-600">Action:</span>
                    <span className="font-medium">{selectedLog.action}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-midnight-600">Resource:</span>
                    <span className="font-medium">{selectedLog.resource}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-midnight-600">Status:</span>
                    <Badge variant={
                      selectedLog.status === 'success' ? 'success' :
                      selectedLog.status === 'failed' ? 'danger' : 'warning'
                    }>
                      {selectedLog.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* User Info */}
              <div>
                <h3 className="font-medium text-midnight-900 mb-2">User Information</h3>
                <div className="bg-midnight-50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-midnight-600">User:</span>
                    <span className="font-medium">{selectedLog.user}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-midnight-600">User ID:</span>
                    <span className="font-mono text-sm">{selectedLog.userId}</span>
                  </div>
                </div>
              </div>

              {/* Technical Details */}
              <div>
                <h3 className="font-medium text-midnight-900 mb-2">Technical Details</h3>
                <div className="bg-midnight-50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-midnight-600">IP Address:</span>
                    <span className="font-mono text-sm">{selectedLog.ipAddress}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-midnight-600">Timestamp:</span>
                    <span className="font-medium">
                      {new Date(selectedLog.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div>
                <h3 className="font-medium text-midnight-900 mb-2">Additional Details</h3>
                <div className="bg-midnight-50 rounded-xl p-4">
                  <p className="text-sm text-midnight-600">
                    {selectedLog.details || 'No additional details available.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-midnight-400 mb-2">No log selected</div>
            <p className="text-sm text-midnight-500">
              Select a log entry to view its details
            </p>
          </div>
        )}
      </DetailDrawer>
    </div>
  )
}
