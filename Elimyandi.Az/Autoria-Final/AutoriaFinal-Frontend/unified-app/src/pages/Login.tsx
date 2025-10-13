import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.tsx';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, AlertCircle, LogIn, ArrowRight, Loader2, Globe } from 'lucide-react';
import { apiClient } from '../lib/api';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [warning, setWarning] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(formData);
      // After login, check profile for email confirmation (if available)
      try {
        const profile: any = await apiClient.getProfile();
        if (profile && profile.emailConfirmed === false) {
          setWarning('Your email is not confirmed. Please check your inbox.');
        } else {
          navigate('/');
        }
      } catch (_) {
        navigate('/');
      }
    } catch (err) {
      setError('Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center p-3">
      <div className="w-full max-w-sm">
        {/* Language Selector */}
        <div className="mb-4 flex justify-end">
          <div className="relative">
            <select
              value={i18n.language}
              onChange={(e) => i18n.changeLanguage(e.target.value as 'az' | 'en')}
              className="bg-white/25 border border-white/40 rounded-lg px-3 py-1.5 text-white text-sm focus:bg-white/35 focus:border-blue-400 focus:outline-none transition-all duration-300 shadow-lg appearance-none pr-8"
            >
              <option value="az" className="bg-slate-800 text-white">{t('language.azerbaijani')}</option>
              <option value="en" className="bg-slate-800 text-white">{t('language.english')}</option>
            </select>
            <Globe className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white pointer-events-none" />
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6">
          {/* Header */}
          <div className="text-center mb-5">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl mb-2 shadow-lg">
              <img src="/logo-icon.svg" alt="Əlimyandı.az logo" className="h-6 w-6" aria-label="Əlimyandı.az" />
            </div>
            <h1 className="text-xl font-bold text-white mb-1">
              {t('auth.login.title')}
            </h1>
            <p className="text-blue-100 text-xs">
              {t('auth.login.subtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {error && (
              <div className="bg-red-500/10 border border-red-400/50 rounded-xl p-3 shadow-lg backdrop-blur-sm">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center">
                      <AlertCircle className="h-4 w-4 text-red-400" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-semibold text-red-200 mb-1">
                      Login Failed
                    </h3>
                    <p className="text-xs text-red-300 leading-relaxed">{error}</p>
                  </div>
                </div>
              </div>
            )}
            {warning && (
              <div className="bg-yellow-500/10 border border-yellow-400/50 rounded-xl p-3 shadow-lg backdrop-blur-sm">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 bg-yellow-500/20 rounded-full flex items-center justify-center">
                      <AlertCircle className="h-4 w-4 text-yellow-400" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-semibold text-yellow-200 mb-1">
                      Email Not Confirmed
                    </h3>
                    <p className="text-xs text-yellow-300 leading-relaxed mb-2">{warning}</p>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await apiClient.resendConfirmation(formData.email);
                          setWarning('Confirmation email resent. Please check your inbox.');
                        } catch (_) {
                          setWarning('Could not resend email. Try again later.');
                        }
                      }}
                      className="text-xs bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-200 px-2 py-1 rounded-lg transition-colors"
                    >
                      Resend confirmation email
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-blue-200 focus:bg-white/20 focus:border-blue-400 focus:outline-none transition-all duration-200 text-sm"
                placeholder={t('auth.login.email')}
              />
            </div>

            {/* Password */}
            <div>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 pr-10 text-white placeholder-blue-200 focus:bg-white/20 focus:border-blue-400 focus:outline-none transition-all duration-200 text-sm"
                  placeholder={t('auth.login.password')}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-3 w-3 text-blue-200 hover:text-white transition-colors" />
                  ) : (
                    <Eye className="h-3 w-3 text-blue-200 hover:text-white transition-colors" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center text-sm relative overflow-hidden"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>{t('auth.login.signIn')}...</span>
                  {/* Loading overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-blue-600/20 animate-pulse"></div>
                </>
              ) : (
                <>
                  <LogIn className="h-3 w-3 mr-1" />
                  {t('auth.login.signIn')}
                  <ArrowRight className="h-3 w-3 ml-1" />
                </>
              )}
            </button>
          </form>

          {/* Links */}
          <div className="mt-4 space-y-2">
            <div className="text-center">
              <Link
                to="/register"
                className="text-xs text-blue-200 hover:text-white transition-colors font-medium"
              >
                {t('auth.login.noAccount')} {t('auth.login.register')}
              </Link>
            </div>
            <div className="text-center">
              <Link 
                to="/forgot-password" 
                className="text-xs text-blue-300 hover:text-white transition-colors"
              >
                {t('auth.login.forgotPassword')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}