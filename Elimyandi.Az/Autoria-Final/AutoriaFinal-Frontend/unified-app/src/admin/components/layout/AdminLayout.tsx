import { Outlet } from 'react-router-dom'
import { Topbar } from './Topbar'
import { Sidebar } from './Sidebar'
import { ToastContainer, useToast } from '../common/Toast'

export function AdminLayout() {
  const { toasts, removeToast } = useToast()

  return (
    <div className="min-h-screen bg-dark-bg-primary flex flex-col dark">
      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Topbar */}
          <Topbar />

          {/* Page Content */}
          <main className="flex-1 p-6 bg-dark-bg-primary">
            <Outlet />
          </main>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-dark-bg-secondary border-t border-dark-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-brand-gradient rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">Ə</span>
            </div>
            <div>
              <p className="text-body-sm font-medium text-dark-text-primary">Admin Panel</p>
              <p className="text-body-xs text-dark-text-muted">v1.0.0</p>
            </div>
          </div>
          <p className="text-body-xs text-dark-text-muted">
            © 2024 Əlimyandi.az. All rights reserved.
          </p>
        </div>
      </footer>
      
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
