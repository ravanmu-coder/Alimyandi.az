import { Routes, Route } from 'react-router-dom'
import { Router } from './router.tsx'
import AdminGuard from '../components/AdminGuard'

function App() {
  return (
    <AdminGuard>
      <Routes>
        <Route path="/*" element={<Router />} />
      </Routes>
    </AdminGuard>
  )
}

export default App
