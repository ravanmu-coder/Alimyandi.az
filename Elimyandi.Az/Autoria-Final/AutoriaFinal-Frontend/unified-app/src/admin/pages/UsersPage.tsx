import { useState, useEffect } from 'react'
import { 
  Plus, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  RefreshCw, 
  User, 
  Search,
  Download,
  MoreVertical,
  Shield,
  UserCheck,
  UserX,
  Clock,
  Calendar,
  Settings,
  AlertCircle,
  CheckCircle,
  XCircle,
  Users as UsersIcon,
  UserPlus,
  Ban,
  Unlock,
  Crown,
  Zap
} from 'lucide-react'
import { Button } from '../components/common/Button'
import { apiClient } from '../services/apiClient'
import { useToast } from '../components/common/Toast'

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  roles: string[]
  status?: 'active' | 'inactive' | 'pending' | 'banned'
  lastLogin?: string
  createdAt?: string
  avatar?: string
  isEmailVerified?: boolean
  loginCount?: number
  lastActivity?: string
}

interface UserStats {
  totalUsers: number
  activeUsers: number
  newUsersToday: number
  bannedUsers: number
  pendingUsers: number
}

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    role: '',
    status: '',
    search: '',
    verified: ''
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<keyof User>('createdAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [appliedFilters, setAppliedFilters] = useState(filters)
  const { success, error: showError } = useToast()

  useEffect(() => {
    loadUsers()
    loadUserStats()
  }, [currentPage, appliedFilters, sortBy, sortDirection])

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError(null)

      // Prepare API parameters
      const params = {
        page: currentPage,
        limit: 20,
        role: appliedFilters.role || undefined,
        status: appliedFilters.status || undefined,
        search: appliedFilters.search || undefined,
        sortBy: sortBy,
        sortDirection: sortDirection
      }

      // Call the real API endpoint
      const response = await apiClient.getUsers(params)
      
      // Update state with API response
      setUsers(response.items || [])
      setTotalPages(response.totalPages || 1)
      setTotalItems(response.totalItems || 0)
      
    } catch (err: any) {
      console.error('Error loading users:', err)
      setError(err.message || 'Failed to load users')
      setUsers([])
      setTotalPages(1)
      setTotalItems(0)
    } finally {
      setLoading(false)
    }
  }

  const loadUserStats = async () => {
    try {
      // Call the real API endpoint for user statistics
      const stats = await apiClient.getUserStatistics()
      
      // Ensure all required properties exist with default values
      setUserStats({
        totalUsers: stats?.totalUsers || 0,
        activeUsers: stats?.activeUsers || 0,
        newUsersToday: stats?.newUsersToday || 0,
        bannedUsers: stats?.bannedUsers || 0,
        pendingUsers: stats?.pendingUsers || 0
      })
    } catch (err) {
      console.error('Error loading user stats:', err)
      // Set default stats if API fails
      setUserStats({
        totalUsers: 0,
        activeUsers: 0,
        newUsersToday: 0,
        bannedUsers: 0,
        pendingUsers: 0
      })
    }
  }

  const getRoleBadge = (roles: string[]) => {
    const role = roles?.[0] || 'user'
    if (role === 'admin') {
      return (
        <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
          <Crown className="w-3 h-3 mr-1" />
          Admin
        </div>
      )
    } else if (role === 'moderator') {
      return (
        <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
          <Shield className="w-3 h-3 mr-1" />
          Moderator
        </div>
      )
    } else {
      return (
        <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
          <User className="w-3 h-3 mr-1" />
          User
        </div>
      )
    }
  }

  const getStatusBadge = (status?: string) => {
    if (status === 'active') {
      return (
        <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
          <CheckCircle className="w-3 h-3 mr-1" />
          Active
        </div>
      )
    } else if (status === 'inactive') {
      return (
        <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">
          <UserX className="w-3 h-3 mr-1" />
          Inactive
        </div>
      )
    } else if (status === 'pending') {
      return (
        <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </div>
      )
    } else if (status === 'banned') {
      return (
        <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
          <Ban className="w-3 h-3 mr-1" />
          Banned
        </div>
      )
    } else {
      return (
        <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">
          <AlertCircle className="w-3 h-3 mr-1" />
          Unknown
        </div>
      )
    }
  }

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleApplyFilters = () => {
    setAppliedFilters({ ...filters })
    setCurrentPage(1) // Reset to first page when applying filters
  }

  const handleClearFilters = () => {
    const clearedFilters = {
      role: '',
      status: '',
      search: '',
      verified: ''
    }
    setFilters(clearedFilters)
    setAppliedFilters(clearedFilters)
    setCurrentPage(1)
  }

  const handleSort = (column: keyof User) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortDirection('asc')
    }
  }

  const handleRefresh = () => {
    loadUsers()
    loadUserStats()
  }

  const handleUserSelect = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(users.map(user => user.id))
    }
  }

  const handleBulkAction = async (action: string) => {
    if (selectedUsers.length === 0) {
      showError('Please select users to perform bulk action')
      return
    }

    try {
      let reason = ''
      if (action === 'ban' || action === 'activate') {
        reason = prompt(`Enter reason for ${action} action:`) || ''
      }

      await apiClient.bulkUserAction(action, selectedUsers, reason)
      success(`${action} applied to ${selectedUsers.length} users`)
      setSelectedUsers([])
      setShowBulkActions(false)
      loadUsers() // Refresh the user list
    } catch (err: any) {
      showError(`Failed to ${action} users: ${err.message}`)
    }
  }

  const handleUserAction = async (userId: string, action: string) => {
    try {
      switch (action) {
        case 'ban':
          const banReason = prompt('Enter reason for banning user:') || ''
          await apiClient.updateUserStatus(userId, 'banned', banReason)
          success('User banned successfully')
          break
        case 'activate':
          await apiClient.updateUserStatus(userId, 'active')
          success('User activated successfully')
          break
        case 'deactivate':
          await apiClient.updateUserStatus(userId, 'inactive')
          success('User deactivated successfully')
          break
        case 'view':
          // Navigate to user details page or open modal
          success('Opening user details...')
          break
        case 'edit':
          // Open edit user modal
          success('Opening edit user form...')
          break
        case 'manage':
          // Open role management modal
          success('Opening role management...')
          break
        default:
          success(`User ${action} action completed`)
      }
      loadUsers() // Refresh the user list
    } catch (err: any) {
      showError(`Failed to ${action} user: ${err.message}`)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString()
  }

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleString()
  }

  const getTimeAgo = (dateString?: string) => {
    if (!dateString) return 'Never'
    const now = new Date()
    const date = new Date(dateString)
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg-primary">
        <div className="p-6 space-y-6 animate-pulse">
          {/* Header skeleton */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-8 bg-gray-200 dark:bg-dark-bg-tertiary rounded w-32"></div>
              <div className="h-4 bg-gray-200 dark:bg-dark-bg-tertiary rounded w-48"></div>
            </div>
            <div className="flex space-x-3">
              <div className="h-10 bg-gray-200 dark:bg-dark-bg-tertiary rounded w-24"></div>
              <div className="h-10 bg-gray-200 dark:bg-dark-bg-tertiary rounded w-28"></div>
              <div className="h-10 bg-gray-200 dark:bg-dark-bg-tertiary rounded w-32"></div>
            </div>
          </div>

          {/* Stats skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-white dark:bg-dark-bg-secondary rounded-xl border border-gray-200 dark:border-dark-border"></div>
            ))}
          </div>

          {/* Table skeleton */}
          <div className="h-96 bg-white dark:bg-dark-bg-secondary rounded-xl border border-gray-200 dark:border-dark-border"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg-primary flex items-center justify-center">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-2">Error Loading Users</h3>
          <p className="text-sm text-gray-600 dark:text-dark-text-secondary mb-4">{error}</p>
          <Button onClick={handleRefresh} icon={RefreshCw} className="bg-blue-600 hover:bg-blue-700 text-white">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg-primary">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-dark-bg-secondary rounded-xl border border-gray-200 dark:border-dark-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text-primary">User Management</h1>
              <p className="text-sm text-gray-600 dark:text-dark-text-secondary mt-1">
                Manage user accounts, roles, and permissions
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="secondary" 
                icon={RefreshCw} 
                onClick={handleRefresh}
                className="text-gray-600 hover:text-gray-900 dark:text-dark-text-muted dark:hover:text-dark-text-primary"
              >
                Refresh
              </Button>
              <Button 
                variant="secondary" 
                icon={Download}
                className="text-gray-600 hover:text-gray-900 dark:text-dark-text-muted dark:hover:text-dark-text-primary"
              >
                Export
              </Button>
              <Button 
                icon={UserPlus}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Add User
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {userStats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Users</p>
                  <p className="text-3xl font-bold">{(userStats.totalUsers || 0).toLocaleString()}</p>
                  <p className="text-blue-200 text-xs mt-1">All time</p>
                </div>
                <UsersIcon className="w-8 h-8 text-blue-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Active Users</p>
                  <p className="text-3xl font-bold">{(userStats.activeUsers || 0).toLocaleString()}</p>
                  <p className="text-green-200 text-xs mt-1">Currently active</p>
                </div>
                <UserCheck className="w-8 h-8 text-green-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">New Today</p>
                  <p className="text-3xl font-bold">{userStats.newUsersToday || 0}</p>
                  <p className="text-purple-200 text-xs mt-1">Registered today</p>
                </div>
                <UserPlus className="w-8 h-8 text-purple-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium">Pending</p>
                  <p className="text-3xl font-bold">{userStats.pendingUsers || 0}</p>
                  <p className="text-yellow-200 text-xs mt-1">Awaiting approval</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">Banned</p>
                  <p className="text-3xl font-bold">{userStats.bannedUsers || 0}</p>
                  <p className="text-red-200 text-xs mt-1">Suspended accounts</p>
                </div>
                <Ban className="w-8 h-8 text-red-200" />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-dark-bg-secondary rounded-xl border border-gray-200 dark:border-dark-border p-6">
          <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search users by name, email, or ID..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border rounded-lg text-gray-900 dark:text-dark-text-primary placeholder-gray-500 dark:placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
              />
            </div>
            
            <div className="flex items-center space-x-3">
              <select
                value={filters.role}
                onChange={(e) => handleFilterChange('role', e.target.value)}
                className="px-4 py-3 bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border rounded-lg text-gray-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 min-w-[140px]"
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="moderator">Moderator</option>
                <option value="user">User</option>
              </select>
              
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="px-4 py-3 bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border rounded-lg text-gray-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 min-w-[140px]"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
                <option value="banned">Banned</option>
              </select>
              
              <Button
                variant="secondary"
                icon={Filter}
                onClick={() => setShowFilters(!showFilters)}
                className={`${showFilters ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : ''}`}
              >
                More Filters
              </Button>
              
              <Button
                onClick={handleApplyFilters}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Apply Filters
              </Button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-dark-border">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">Email Verification</label>
                  <select
                    value={filters.verified}
                    onChange={(e) => handleFilterChange('verified', e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border rounded-lg text-gray-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                  >
                    <option value="">All Users</option>
                    <option value="verified">Verified Only</option>
                    <option value="unverified">Unverified Only</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">Last Login</label>
                  <select className="w-full px-3 py-2 bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border rounded-lg text-gray-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500">
                    <option value="">Any Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="never">Never</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">Registration Date</label>
                  <select className="w-full px-3 py-2 bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border rounded-lg text-gray-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500">
                    <option value="">Any Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="year">This Year</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <Button 
                  variant="secondary"
                  onClick={handleClearFilters}
                  className="text-gray-600 hover:text-gray-900 dark:text-dark-text-muted dark:hover:text-dark-text-primary"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowBulkActions(!showBulkActions)}
                  className="text-blue-700 dark:text-blue-300"
                >
                  Bulk Actions
                </Button>
              </div>
              
              {showBulkActions && (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={UserCheck}
                    onClick={() => handleBulkAction('activate')}
                    className="text-green-700 dark:text-green-300"
                  >
                    Activate
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Ban}
                    onClick={() => handleBulkAction('ban')}
                    className="text-red-700 dark:text-red-300"
                  >
                    Ban
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Download}
                    onClick={() => handleBulkAction('export')}
                    className="text-blue-700 dark:text-blue-300"
                  >
                    Export
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white dark:bg-dark-bg-secondary rounded-xl border border-gray-200 dark:border-dark-border overflow-hidden">
          {users.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <UsersIcon className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-2">No users found</h3>
              <p className="text-sm text-gray-600 dark:text-dark-text-secondary mb-4">
                {appliedFilters.search || appliedFilters.role || appliedFilters.status 
                  ? 'Try adjusting your filters to see more results'
                  : 'No users are currently registered in the system'
                }
              </p>
              <Button 
                icon={UserPlus}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Add First User
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
                <thead className="bg-gray-50 dark:bg-dark-bg-tertiary">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length === users.length}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-muted uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary"
                      onClick={() => handleSort('firstName')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>User</span>
                        {sortBy === 'firstName' && (
                          <span className="text-blue-500">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-muted uppercase tracking-wider">
                      Contact
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-muted uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Role & Status</span>
                        {sortBy === 'status' && (
                          <span className="text-blue-500">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-muted uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary"
                      onClick={() => handleSort('lastLogin')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Activity</span>
                        {sortBy === 'lastLogin' && (
                          <span className="text-blue-500">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-muted uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary"
                      onClick={() => handleSort('createdAt')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Registered</span>
                        {sortBy === 'createdAt' && (
                          <span className="text-blue-500">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-muted uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-dark-bg-secondary divide-y divide-gray-200 dark:divide-dark-border">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => handleUserSelect(user.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                            {user.firstName?.[0]}{user.lastName?.[0]}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-dark-text-primary">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-dark-text-muted">
                              ID: {user.id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2 text-sm text-gray-900 dark:text-dark-text-primary">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span>{user.email}</span>
                            {user.isEmailVerified && (
                              <CheckCircle className="w-4 h-4 text-green-500" title="Email verified" />
                            )}
                          </div>
                          {user.phone && (
                            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-dark-text-muted">
                              <Phone className="w-4 h-4" />
                              <span>{user.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-2">
                          {getRoleBadge(user.roles)}
                          {getStatusBadge(user.status)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="text-sm text-gray-900 dark:text-dark-text-primary">
                            Last login: {getTimeAgo(user.lastLogin)}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-dark-text-muted">
                            {user.loginCount || 0} logins
                          </div>
                          {user.lastActivity && (
                            <div className="text-sm text-gray-500 dark:text-dark-text-muted">
                              Active: {getTimeAgo(user.lastActivity)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-dark-text-primary">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Eye}
                            onClick={() => handleUserAction(user.id, 'view')}
                            className="text-gray-400 hover:text-gray-600 dark:text-dark-text-muted dark:hover:text-dark-text-primary"
                            title="View Details"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Edit}
                            onClick={() => handleUserAction(user.id, 'edit')}
                            className="text-gray-400 hover:text-gray-600 dark:text-dark-text-muted dark:hover:text-dark-text-primary"
                            title="Edit User"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Settings}
                            onClick={() => handleUserAction(user.id, 'manage')}
                            className="text-gray-400 hover:text-gray-600 dark:text-dark-text-muted dark:hover:text-dark-text-primary"
                            title="Manage Roles"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={MoreVertical}
                            className="text-gray-400 hover:text-gray-600 dark:text-dark-text-muted dark:hover:text-dark-text-primary"
                            title="More Actions"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {users.length > 0 && (
          <div className="bg-white dark:bg-dark-bg-secondary rounded-xl border border-gray-200 dark:border-dark-border p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-dark-text-secondary">
                Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, totalItems)} of {totalItems} users
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-700 dark:text-dark-text-secondary">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={currentPage >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
