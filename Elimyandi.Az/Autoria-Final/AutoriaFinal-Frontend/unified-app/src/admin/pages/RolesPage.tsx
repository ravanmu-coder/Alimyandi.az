import { useState } from 'react'
import { Plus, Shield, Users, Edit, Trash2, X } from 'lucide-react'
import { Button } from '../components/common/Button'
import { DataTable } from '../components/ui/DataTable'
import { Badge } from '../components/common/Badge'
import { useApiCall } from '../hooks/useFetch'
import { apiClient } from '../services/apiClient'

interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  userCount: number
  createdAt: string
  updatedAt: string
}

export function RolesPage() {
  const [selectedRole] = useState<Role | null>(null)
  const [showModal] = useState(false)
  const [sortBy, setSortBy] = useState<keyof Role>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const { data: roles, loading } = useApiCall(() => apiClient.getRoles())

  const columns = [
    {
      key: 'name' as keyof Role,
      label: 'Role Name',
      sortable: true,
      render: (value: string, row: Role) => (
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-electric-cobalt/10 rounded-lg">
            <Shield className="w-5 h-5 text-electric-cobalt" />
          </div>
          <div>
            <div className="font-medium text-midnight-900">{value}</div>
            <div className="text-sm text-midnight-500">{row.description}</div>
          </div>
        </div>
      )
    },
    {
      key: 'permissions' as keyof Role,
      label: 'Permissions',
      sortable: false,
      render: (value: string[]) => (
        <div className="flex flex-wrap gap-1">
          {value.slice(0, 3).map((permission) => (
            <Badge key={permission} variant="neutral" size="sm">
              {permission}
            </Badge>
          ))}
          {value.length > 3 && (
            <Badge variant="neutral" size="sm">
              +{value.length - 3} more
            </Badge>
          )}
        </div>
      )
    },
    {
      key: 'userCount' as keyof Role,
      label: 'Users',
      sortable: true,
      render: (value: number) => (
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-midnight-500" />
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    {
      key: 'createdAt' as keyof Role,
      label: 'Created',
      sortable: true,
      render: (value: string) => (
        <div className="text-sm text-midnight-600">
          {new Date(value).toLocaleDateString()}
        </div>
      )
    },
    {
      key: 'updatedAt' as keyof Role,
      label: 'Last Updated',
      sortable: true,
      render: (value: string) => (
        <div className="text-sm text-midnight-600">
          {new Date(value).toLocaleDateString()}
        </div>
      )
    }
  ]

  const handleSort = (column: keyof Role) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortDirection('asc')
    }
  }

  const handleRowActions = (_row: Role) => (
    <>
      <Button variant="ghost" size="sm" icon={Edit} disabled />
      <Button variant="ghost" size="sm" icon={Trash2} disabled />
    </>
  )

  // const handleEditRole = (_role: Role) => {
  //   setSelectedRole(role)
  //   setShowModal(true)
  // }

  const availablePermissions = [
    'dashboard.view',
    'users.view',
    'users.create',
    'users.edit',
    'users.delete',
    'auctions.view',
    'auctions.create',
    'auctions.edit',
    'auctions.delete',
    'inventory.view',
    'inventory.create',
    'inventory.edit',
    'inventory.delete',
    'reports.view',
    'settings.edit'
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1 text-midnight-900 mb-2">Roles & Permissions</h1>
          <p className="text-midnight-600">Manage user roles and their permissions</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="secondary" disabled>
            Export
          </Button>
          <Button variant="primary" icon={Plus} disabled>
            New Role
          </Button>
        </div>
      </div>

      {/* Roles Table */}
      <DataTable
        data={roles}
        columns={columns}
        loading={loading}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSort={handleSort}
        actions={handleRowActions}
      />

      {/* Role Edit Modal */}
      {showModal && selectedRole && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-large w-full max-w-2xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-midnight-200">
              <h2 className="text-xl font-semibold text-midnight-900">
                Edit Role: {selectedRole.name}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                icon={X}
                onClick={() => {}}
              />
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-6">
                {/* Basic Info */}
                <div>
                  <label className="block text-sm font-medium text-midnight-700 mb-2">
                    Role Name
                  </label>
                  <input
                    type="text"
                    defaultValue={selectedRole.name}
                    className="input"
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-midnight-700 mb-2">
                    Description
                  </label>
                  <textarea
                    defaultValue={selectedRole.description}
                    className="input min-h-[100px] resize-none"
                    disabled
                  />
                </div>

                {/* Permissions */}
                <div>
                  <label className="block text-sm font-medium text-midnight-700 mb-4">
                    Permissions
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {availablePermissions.map((permission) => (
                      <label
                        key={permission}
                        className="flex items-center space-x-3 p-3 border border-midnight-200 rounded-xl hover:bg-midnight-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          defaultChecked={selectedRole.permissions.includes(permission)}
                          className="rounded border-midnight-300 text-electric-cobalt focus:ring-electric-cobalt"
                          disabled
                        />
                        <span className="text-sm text-midnight-700">{permission}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-midnight-200 bg-midnight-50">
              <div className="flex justify-end space-x-3">
                <Button variant="secondary" onClick={() => {}}>
                  Cancel
                </Button>
                <Button variant="primary" disabled>
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
