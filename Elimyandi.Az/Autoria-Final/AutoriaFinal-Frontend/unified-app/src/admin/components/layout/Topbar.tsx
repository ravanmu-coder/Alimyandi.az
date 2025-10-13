import { useState } from 'react'
import { Search, Bell, Settings, LogOut } from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth.tsx'
import { ConfigModal } from '../ConfigModal'

export function Topbar() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showConfigModal, setShowConfigModal] = useState(false)
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
  }

  return (
    <header className="bg-dark-bg-secondary border-b border-dark-border px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 bg-brand-gradient rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">Ə</span>
          </div>
          <h1 className="text-h4 font-heading text-dark-text-primary">
            Əlimyandi.az Admin
          </h1>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-2xl mx-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-text-muted" />
            <input
              type="text"
              placeholder="Search inventory, auctions, users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-dark-bg-tertiary border border-dark-border rounded-xl text-dark-text-primary placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary transition-all duration-200"
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-dark-bg-tertiary transition-colors">
            <Bell className="w-5 h-5 text-dark-text-secondary" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent-error rounded-full"></span>
          </button>

          {/* Settings */}
          <button 
            onClick={() => setShowConfigModal(true)}
            className="p-2 rounded-lg hover:bg-dark-bg-tertiary transition-colors"
            title="API Configuration"
          >
            <Settings className="w-5 h-5 text-dark-text-secondary" />
          </button>

          {/* User Menu */}
          <div className="flex items-center space-x-3 pl-4 border-l border-dark-border">
            <div className="text-right">
              <p className="text-body-sm font-medium text-dark-text-primary">
                {user?.user?.firstName} {user?.user?.lastName}
              </p>
              <p className="text-body-xs text-dark-text-muted">{user?.user?.email}</p>
            </div>
            <div className="w-8 h-8 bg-accent-primary rounded-full flex items-center justify-center text-white font-medium text-body-sm">
              {user?.user?.firstName?.[0]}{user?.user?.lastName?.[0]}
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-dark-bg-tertiary transition-colors"
            >
              <LogOut className="w-5 h-5 text-dark-text-secondary" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Config Modal */}
      <ConfigModal 
        isOpen={showConfigModal} 
        onClose={() => setShowConfigModal(false)} 
      />
    </header>
  )
}
