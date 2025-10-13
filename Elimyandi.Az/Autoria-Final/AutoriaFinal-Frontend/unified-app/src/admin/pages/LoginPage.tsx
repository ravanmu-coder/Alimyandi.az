import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Car, Eye, EyeOff } from 'lucide-react'
import { Button } from '../components/common/Button'
import { useAuth } from '../hooks/useAuth'

export function LoginPage() {
  const navigate = useNavigate()
  const { login, isLoading, error } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await login(formData.email, formData.password)
    // In a real app, navigation would happen after successful login
    // For now, we'll navigate immediately since we're simulating auth
    navigate('/dashboard')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-electric-cobalt/5 to-royal-indigo/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-electric-cobalt to-royal-indigo rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Car className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-midnight-900 mb-2">
            Əlimyandi.az
          </h1>
          <p className="text-midnight-600">Admin Panel</p>
        </div>

        {/* Login Form */}
        <div className="card-premium">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-midnight-900 mb-2">
              Welcome Back
            </h2>
            <p className="text-midnight-600">
              Sign in to your admin account
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-status-danger/10 border border-status-danger/20 rounded-xl">
              <p className="text-status-danger text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-midnight-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="input"
                placeholder="admin@alimyandi.az"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-midnight-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="input pr-12"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-midnight-400 hover:text-midnight-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-midnight-300 text-electric-cobalt focus:ring-electric-cobalt"
                />
                <span className="ml-2 text-sm text-midnight-600">Remember me</span>
              </label>
              <button
                type="button"
                className="text-sm text-electric-cobalt hover:text-electric-600 font-medium"
                disabled
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              loading={isLoading}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-midnight-500">
              Need help? Contact{' '}
              <a href="mailto:support@alimyandi.az" className="text-electric-cobalt hover:text-electric-600 font-medium">
                support@alimyandi.az
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-midnight-500">
            © 2024 Əlimyandi.az. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
