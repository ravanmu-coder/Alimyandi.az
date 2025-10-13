import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../lib/api';
import { useTranslation } from 'react-i18next';
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle, AlertCircle, Loader2, Globe } from 'lucide-react';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { t, i18n } = useTranslation();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setIsLoading(true);
    setMessage(null);
    setError(null);
    try {
      const email = searchParams.get('email') || '';
      const token = searchParams.get('token') || '';
      await apiClient.resetPassword({ email, token, password, confirmPassword });
      setMessage('Password has been reset. Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err: any) {
      setError(err?.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
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
              {t('auth.resetPassword.title')}
            </h1>
            <p className="text-blue-100 text-xs">
              {t('auth.resetPassword.subtitle')}
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
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
                      Reset Failed
                    </h3>
                    <p className="text-xs text-red-300 leading-relaxed">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* New Password */}
            <div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New password"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 pr-10 text-white placeholder-blue-200 focus:bg-white/20 focus:border-blue-400 focus:outline-none transition-all duration-200 text-sm"
                  required
                  minLength={6}
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

            {/* Confirm Password */}
            <div>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 pr-10 text-white placeholder-blue-200 focus:bg-white/20 focus:border-blue-400 focus:outline-none transition-all duration-200 text-sm"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
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
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center text-sm relative overflow-hidden"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Resetting...</span>
                  {/* Loading overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 animate-pulse"></div>
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3 mr-1" />
                  Reset Password
                  <ArrowRight className="h-3 w-3 ml-1" />
                </>
              )}
            </button>
          </form>

          {/* Success Message */}
          {message && (
            <div className="mt-3 bg-green-500/10 border border-green-400/50 rounded-xl p-3 shadow-lg backdrop-blur-sm">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  </div>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-semibold text-green-200 mb-1">
                    Password Reset!
                  </h3>
                  <p className="text-xs text-green-300 leading-relaxed">{message}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}