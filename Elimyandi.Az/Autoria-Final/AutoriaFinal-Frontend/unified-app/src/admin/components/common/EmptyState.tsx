import React from 'react'
import { 
  Car, 
  Gavel, 
  Users, 
  FileText, 
  Search, 
  Plus,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react'

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
    variant?: 'primary' | 'secondary'
  }
  className?: string
}

export function EmptyState({ 
  icon: Icon = Car, 
  title, 
  description, 
  action,
  className = '' 
}: EmptyStateProps) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="text-gray-400 mb-4">
        <Icon className="w-16 h-16 mx-auto" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className={`px-6 py-3 rounded-lg transition-colors flex items-center gap-2 mx-auto ${
            action.variant === 'primary'
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          <Plus className="w-4 h-4" />
          {action.label}
        </button>
      )}
    </div>
  )
}

// Pre-built empty state components
export function InventoryEmptyState({ onAddVehicle }: { onAddVehicle: () => void }) {
  return (
    <EmptyState
      icon={Car}
      title="No vehicles found"
      description="Try adjusting your filters or add a new vehicle to get started."
      action={{
        label: "Add Vehicle",
        onClick: onAddVehicle,
        variant: "primary"
      }}
    />
  )
}

export function AuctionsEmptyState({ onCreateAuction }: { onCreateAuction: () => void }) {
  return (
    <EmptyState
      icon={Gavel}
      title="No auctions found"
      description="Create your first auction to start selling vehicles."
      action={{
        label: "Create Auction",
        onClick: onCreateAuction,
        variant: "primary"
      }}
    />
  )
}

export function UsersEmptyState({ onAddUser }: { onAddUser: () => void }) {
  return (
    <EmptyState
      icon={Users}
      title="No users found"
      description="Users will appear here when they register or are added to the system."
      action={{
        label: "Add User",
        onClick: onAddUser,
        variant: "primary"
      }}
    />
  )
}

export function SearchEmptyState({ onClearSearch }: { onClearSearch: () => void }) {
  return (
    <EmptyState
      icon={Search}
      title="No results found"
      description="Try adjusting your search terms or filters to find what you're looking for."
      action={{
        label: "Clear Search",
        onClick: onClearSearch,
        variant: "secondary"
      }}
    />
  )
}

export function NoDataEmptyState({ 
  title = "No data available",
  description = "There's no data to display at the moment."
}: { 
  title?: string
  description?: string 
}) {
  return (
    <EmptyState
      icon={FileText}
      title={title}
      description={description}
    />
  )
}

// Status-based empty states
export function SuccessEmptyState({ 
  title = "Success!",
  description = "The operation completed successfully."
}: { 
  title?: string
  description?: string 
}) {
  return (
    <EmptyState
      icon={CheckCircle}
      title={title}
      description={description}
    />
  )
}

export function ErrorEmptyState({ 
  title = "Something went wrong",
  description = "An error occurred while processing your request.",
  onRetry
}: { 
  title?: string
  description?: string
  onRetry?: () => void
}) {
  return (
    <EmptyState
      icon={XCircle}
      title={title}
      description={description}
      action={onRetry ? {
        label: "Try Again",
        onClick: onRetry,
        variant: "primary"
      } : undefined}
    />
  )
}

export function InfoEmptyState({ 
  title = "Information",
  description = "Here's some important information you should know."
}: { 
  title?: string
  description?: string 
}) {
  return (
    <EmptyState
      icon={Info}
      title={title}
      description={description}
    />
  )
}

export function WarningEmptyState({ 
  title = "Warning",
  description = "Please review the following information before proceeding."
}: { 
  title?: string
  description?: string 
}) {
  return (
    <EmptyState
      icon={AlertCircle}
      title={title}
      description={description}
    />
  )
}

export function EmptyTableState({ 
  title = "No data available",
  description = "There's no data to display in this table."
}: { 
  title?: string
  description?: string 
}) {
  return (
    <EmptyState
      icon={FileText}
      title={title}
      description={description}
    />
  )
}