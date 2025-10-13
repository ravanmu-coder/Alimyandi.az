import { Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from './pages/LoginPage'
import { AdminLayout } from './components/layout/AdminLayout'
import { DashboardPage } from './pages/DashboardPage'
import { AuctionsListPage } from './pages/AuctionsListPage'
import { CreateAuctionPage } from './pages/CreateAuctionPage'
import { InventoryPage } from './pages/InventoryPage'
import { UsersPage } from './pages/UsersPage'
import { RolesPage } from './pages/RolesPage'
import { LocationsPage } from './pages/LocationsPage'
import { AuditLogsPage } from './pages/AuditLogsPage'
import { StyleguidePage } from './pages/StyleguidePage'

export function Router() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="auctions" element={<AuctionsListPage />} />
        <Route path="auctions/create" element={<CreateAuctionPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="roles" element={<RolesPage />} />
        <Route path="locations" element={<LocationsPage />} />
        <Route path="audit" element={<AuditLogsPage />} />
        <Route path="components" element={<StyleguidePage />} />
      </Route>
    </Routes>
  )
}
