# Admin API Client - User Management Methods

## Overview
The admin API client has been enhanced with comprehensive user management methods that integrate with the `/api/Admin/users` endpoints. All methods include proper error handling, TypeScript typing, and support for pagination and filtering.

## User Management API Methods

### 1. Get Users with Pagination and Filtering

```typescript
async getUsers(params?: {
  page?: number
  limit?: number
  role?: string
  status?: string
  search?: string
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
}): Promise<PagedResponse<any>>
```

**Endpoint:** `GET /api/Admin/users`

**Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `role`: Filter by user role (admin, moderator, user)
- `status`: Filter by user status (active, inactive, banned, pending)
- `search`: Search by name, email, or ID
- `sortBy`: Field to sort by (firstName, lastName, email, createdAt, lastLogin, status)
- `sortDirection`: Sort direction (asc, desc)

**Response Format:**
```typescript
interface PagedResponse<T> {
  items: T[]
  totalItems: number
  totalPages: number
  currentPage: number
  pageSize: number
}
```

**Example Usage:**
```typescript
// Get first page of active users
const response = await apiClient.getUsers({
  page: 1,
  limit: 20,
  status: 'active',
  sortBy: 'createdAt',
  sortDirection: 'desc'
})

// Search for users
const searchResults = await apiClient.getUsers({
  search: 'john@example.com',
  page: 1,
  limit: 10
})
```

### 2. Get User Statistics

```typescript
async getUserStatistics(): Promise<any>
```

**Endpoint:** `GET /api/Admin/statistics/users`

**Response Format:**
```typescript
interface UserStats {
  totalUsers: number
  activeUsers: number
  newUsersToday: number
  bannedUsers: number
  pendingUsers: number
}
```

**Example Usage:**
```typescript
const stats = await apiClient.getUserStatistics()
console.log(`Total users: ${stats.totalUsers}`)
console.log(`Active users: ${stats.activeUsers}`)
```

### 3. Update User Status

```typescript
async updateUserStatus(
  userId: string, 
  status: 'active' | 'inactive' | 'banned', 
  reason?: string
): Promise<any>
```

**Endpoint:** `PUT /api/Admin/users/{id}/status`

**Parameters:**
- `userId`: User ID to update
- `status`: New status (active, inactive, banned)
- `reason`: Optional reason for status change

**Request Body:**
```typescript
{
  isActive: boolean,
  status: string,
  reason: string
}
```

**Example Usage:**
```typescript
// Ban a user with reason
await apiClient.updateUserStatus('user123', 'banned', 'Violation of terms')

// Activate a user
await apiClient.updateUserStatus('user456', 'active')

// Deactivate a user
await apiClient.updateUserStatus('user789', 'inactive', 'Account suspended')
```

### 4. Assign Role to User

```typescript
async assignRoleToUser(userId: string, role: string): Promise<any>
```

**Endpoint:** `POST /api/Admin/users/{id}/roles`

**Parameters:**
- `userId`: User ID to assign role to
- `role`: Role to assign (admin, moderator, user)

**Request Body:**
```typescript
{
  role: string
}
```

**Example Usage:**
```typescript
// Promote user to admin
await apiClient.assignRoleToUser('user123', 'admin')

// Assign moderator role
await apiClient.assignRoleToUser('user456', 'moderator')
```

### 5. Remove Role from User

```typescript
async removeRoleFromUser(userId: string, role: string): Promise<any>
```

**Endpoint:** `DELETE /api/Admin/users/{id}/roles/{role}`

**Parameters:**
- `userId`: User ID to remove role from
- `role`: Role to remove

**Example Usage:**
```typescript
// Remove admin role
await apiClient.removeRoleFromUser('user123', 'admin')

// Remove moderator role
await apiClient.removeRoleFromUser('user456', 'moderator')
```

### 6. Bulk User Operations

```typescript
async bulkUserAction(action: string, userIds: string[], reason?: string): Promise<any>
```

**Endpoint:** `POST /api/Admin/users/bulk`

**Parameters:**
- `action`: Action to perform (ban, activate, deactivate, export)
- `userIds`: Array of user IDs to perform action on
- `reason`: Optional reason for the action

**Request Body:**
```typescript
{
  action: string,
  userIds: string[],
  reason: string
}
```

**Example Usage:**
```typescript
// Ban multiple users
await apiClient.bulkUserAction('ban', ['user1', 'user2', 'user3'], 'Policy violation')

// Activate multiple users
await apiClient.bulkUserAction('activate', ['user4', 'user5'])

// Export user data
await apiClient.bulkUserAction('export', ['user1', 'user2', 'user3'])
```

## Error Handling

All methods include comprehensive error handling:

```typescript
try {
  const users = await apiClient.getUsers({ page: 1, limit: 20 })
  // Handle success
} catch (error) {
  if (error.message.includes('Authentication failed')) {
    // Handle authentication error
    console.log('Please log in again')
  } else if (error.message.includes('Access denied')) {
    // Handle permission error
    console.log('You do not have permission to access this resource')
  } else {
    // Handle other errors
    console.error('API Error:', error.message)
  }
}
```

## Response Format Handling

The API client handles multiple response formats:

### AdminPagedResponseDto Format
```typescript
{
  data: User[],
  pagination: {
    totalItems: number,
    totalPages: number
  }
}
```

### Direct PagedResponse Format
```typescript
{
  items: User[],
  totalItems: number,
  totalPages: number,
  currentPage: number,
  pageSize: number
}
```

### Simple Array Format
```typescript
User[]
```

## Authentication

All API calls include proper authentication headers:

```typescript
private getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  const token = this.token
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return headers
}
```

## CORS Configuration

All requests are configured for CORS:

```typescript
const config: RequestInit = {
  ...options,
  headers: {
    ...this.getHeaders(),
    ...options.headers,
  },
  mode: 'cors',
  credentials: 'include',
}
```

## Usage in Components

### UsersPage Integration

```typescript
// Load users with filters
const loadUsers = async () => {
  try {
    setLoading(true)
    setError(null)

    const params = {
      page: currentPage,
      limit: 20,
      role: appliedFilters.role || undefined,
      status: appliedFilters.status || undefined,
      search: appliedFilters.search || undefined,
      sortBy: sortBy,
      sortDirection: sortDirection
    }

    const response = await apiClient.getUsers(params)
    
    setUsers(response.items || [])
    setTotalPages(response.totalPages || 1)
    setTotalItems(response.totalItems || 0)
    
  } catch (err: any) {
    console.error('Error loading users:', err)
    setError(err.message || 'Failed to load users')
    setUsers([])
  } finally {
    setLoading(false)
  }
}

// Update user status
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
      // ... other actions
    }
    loadUsers() // Refresh the user list
  } catch (err: any) {
    showError(`Failed to ${action} user: ${err.message}`)
  }
}

// Bulk operations
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
    loadUsers() // Refresh the user list
  } catch (err: any) {
    showError(`Failed to ${action} users: ${err.message}`)
  }
}
```

## Testing Considerations

1. **Mock API Responses**: Use mock data for testing when backend is not available
2. **Error Scenarios**: Test authentication failures, network errors, and invalid responses
3. **Pagination**: Test with different page sizes and edge cases
4. **Filtering**: Test all filter combinations
5. **Sorting**: Test all sortable fields and directions
6. **Bulk Operations**: Test with empty arrays and large datasets

## Backend Requirements

The backend should implement these endpoints:

- `GET /api/Admin/users` - Paginated user list with filtering and sorting
- `GET /api/Admin/statistics/users` - User statistics
- `PUT /api/Admin/users/{id}/status` - Update user status
- `POST /api/Admin/users/{id}/roles` - Assign role to user
- `DELETE /api/Admin/users/{id}/roles/{role}` - Remove role from user
- `POST /api/Admin/users/bulk` - Bulk user operations

All endpoints should:
- Require admin authentication
- Return proper HTTP status codes
- Include comprehensive error messages
- Support CORS for frontend integration
- Handle pagination parameters correctly
- Validate input parameters
- Log all administrative actions for audit purposes
