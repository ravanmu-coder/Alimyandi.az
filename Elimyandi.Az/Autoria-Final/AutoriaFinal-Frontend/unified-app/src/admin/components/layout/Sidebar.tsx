import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Car, 
  Gavel, 
  Users, 
  MapPin,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Inventory', href: '/admin/inventory', icon: Car },
  { name: 'Auctions', href: '/admin/auctions', icon: Gavel },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Locations', href: '/admin/locations', icon: MapPin },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className={`bg-dark-bg-secondary border-r border-dark-border transition-all duration-300 ${
      collapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Collapse Toggle */}
      <div className="p-4 border-b border-dark-border">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-dark-bg-tertiary transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5 text-dark-text-secondary" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-dark-text-secondary" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center px-3 py-2 rounded-lg text-body-sm font-body font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-accent-primary text-white shadow-dark'
                  : 'text-dark-text-secondary hover:bg-dark-bg-tertiary hover:text-dark-text-primary'
              } ${collapsed ? 'justify-center' : ''}`
            }
            title={collapsed ? item.name : undefined}
          >
            <item.icon className={`w-5 h-5 ${collapsed ? '' : 'mr-3'}`} />
            {!collapsed && <span>{item.name}</span>}
          </NavLink>
        ))}
      </nav>

    </aside>
  )
}
