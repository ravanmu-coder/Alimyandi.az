import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './hooks/useAuth.tsx';
import { ToastProvider } from './components/ToastProvider';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Presentation Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AllAuctions from './pages/AllAuctions';
import AuctionDetail from './pages/AuctionDetail';
import CarDetail from './pages/CarDetail';
import MyBids from './pages/MyBids';
import ConfirmEmail from './pages/ConfirmEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import VehicleFinder from './pages/VehicleFinder';
import SalesList from './pages/SalesList';
import AuctionCars from './pages/AuctionCars';
import Watchlist from './pages/Watchlist';
import TodaysAuctions from './pages/TodaysAuctions';
import AuctionCalendar from './pages/AuctionCalendar';
import AuctionJoinPage from './pages/AuctionJoinPage';
import LiveAuctionPage from './pages/LiveAuctionPage';
import AddVehicle from './pages/AddVehicle';
import MyVehicle from './pages/MyVehicle';
import AdminLogin from './pages/AdminLogin';
import Locations from './pages/Locations';
import LocationDetail from './pages/LocationDetail.tsx';
import AboutUs from './pages/AboutUs';
import AIValuation from './pages/AIValuation';

// Admin Pages
import AdminApp from './admin/App';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
      <Router>
        <Routes>
          {/* Admin Routes */}
          <Route path="/admin/*" element={<AdminApp />} />
          
          {/* Presentation Routes */}
          <Route path="/*" element={
            <Layout>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/register" element={<Register />} />
                <Route path="/confirm-email" element={<ConfirmEmail />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                
                {/* Protected routes */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                
                <Route path="/all-auctions" element={
                  <ProtectedRoute>
                    <AllAuctions />
                  </ProtectedRoute>
                } />
                
                <Route path="/auctions/:auctionId" element={
                  <ProtectedRoute>
                    <AuctionDetail />
                  </ProtectedRoute>
                } />
                
                <Route path="/auctions/:auctionId/cars/:carId" element={
                  <ProtectedRoute>
                    <CarDetail />
                  </ProtectedRoute>
                } />
                
                <Route path="/car/:carId" element={
                  <ProtectedRoute>
                    <CarDetail />
                  </ProtectedRoute>
                } />
                
                <Route path="/my-bids" element={
                  <ProtectedRoute>
                    <MyBids />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
                
                <Route path="/vehicle-finder" element={
                  <ProtectedRoute>
                    <VehicleFinder />
                  </ProtectedRoute>
                } />
                
                <Route path="/sales-list" element={
                  <ProtectedRoute>
                    <SalesList />
                  </ProtectedRoute>
                } />
                
                <Route path="/auction/:auctionId/cars" element={
                  <ProtectedRoute>
                    <AuctionCars />
                  </ProtectedRoute>
                } />
                
                <Route path="/watchlist" element={
                  <ProtectedRoute>
                    <Watchlist />
                  </ProtectedRoute>
                } />
                
                <Route path="/todays-auctions" element={
                  <ProtectedRoute>
                    <TodaysAuctions />
                  </ProtectedRoute>
                } />
                
                <Route path="/auctions/calendar" element={
                  <ProtectedRoute>
                    <AuctionCalendar />
                  </ProtectedRoute>
                } />
                
                <Route path="/auctions/:auctionId/join" element={
                  <ProtectedRoute>
                    <LiveAuctionPage />
                  </ProtectedRoute>
                } />
                
                {/* Alternative route for AuctionJoinPage (React-based join interface) */}
                <Route path="/auction-join/:auctionId" element={
                  <ProtectedRoute>
                    <AuctionJoinPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/add-vehicle" element={
                  <ProtectedRoute>
                    <AddVehicle />
                  </ProtectedRoute>
                } />
                
                <Route path="/my-vehicles" element={
                  <ProtectedRoute>
                    <MyVehicle />
                  </ProtectedRoute>
                } />
                
                <Route path="/locations" element={
                  <ProtectedRoute>
                    <Locations />
                  </ProtectedRoute>
                } />
                
                <Route path="/locations/:id" element={
                  <ProtectedRoute>
                    <LocationDetail />
                  </ProtectedRoute>
                } />
                
                <Route path="/about-us" element={<AboutUs />} />
                
                <Route path="/ai-valuation" element={
                  <ProtectedRoute>
                    <AIValuation />
                  </ProtectedRoute>
                } />
                
                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          } />
        </Routes>
      </Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#fff',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;