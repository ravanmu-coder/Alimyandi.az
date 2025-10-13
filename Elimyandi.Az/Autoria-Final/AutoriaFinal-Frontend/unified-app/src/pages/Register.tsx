import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.tsx';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, AlertCircle, Check, User, Building2, Zap, ArrowRight, Mail, CheckCircle, Loader2, Globe } from 'lucide-react';

export default function Register() {
  const [formData, setFormData] = useState({
    userName: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: 'Member',
    acceptTerms: false,
    dateOfBirth: '',
    phone: '',
    isOver18: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [toast, setToast] = useState<string | null>(null);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  const passwordRequirements = [
    { label: '8+ characters', check: (pwd: string) => pwd.length >= 8 },
    { label: 'Uppercase', check: (pwd: string) => /[A-Z]/.test(pwd) },
    { label: 'Lowercase', check: (pwd: string) => /[a-z]/.test(pwd) },
    { label: 'Number', check: (pwd: string) => /\d/.test(pwd) },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!passwordRequirements.every(req => req.check(formData.password))) {
      setError('Password does not meet all requirements');
      return;
    }

    if (!formData.isOver18) {
      setError('You must be 18 years or older to register');
      return;
    }

    setIsLoading(true);

    try {
      const registerData = {
        userName: formData.userName,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
        acceptTerms: formData.acceptTerms,
        phone: formData.phone || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        allowMarketing: false,
      };
      
      console.log('Register page - Sending data:', registerData);
      const response = await register(registerData);
      console.log('Register page - Response:', response);
      // Show success animation
      setShowSuccessAnimation(true);
      
      // Hide animation and navigate after 5 seconds
      setTimeout(() => {
        setShowSuccessAnimation(false);
        navigate('/login');
      }, 5000);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value
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
              {t('auth.register.title')}
            </h1>
            <p className="text-blue-100 text-xs">
              {t('auth.register.subtitle')}
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
                      Validation Error
                    </h3>
                    <p className="text-xs text-red-300 leading-relaxed">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-2">
            <div>
                <input 
                  name="firstName" 
                  type="text" 
                  required 
                  value={formData.firstName} 
                  onChange={handleChange} 
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-blue-200 focus:bg-white/20 focus:border-blue-400 focus:outline-none transition-all duration-200 text-sm" 
                  placeholder={t('auth.register.firstName')} 
                />
          </div>
          <div>
                <input 
                  name="lastName" 
                  type="text" 
                  required 
                  value={formData.lastName} 
                  onChange={handleChange} 
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-blue-200 focus:bg-white/20 focus:border-blue-400 focus:outline-none transition-all duration-200 text-sm" 
                  placeholder={t('auth.register.lastName')} 
                />
              </div>
          </div>

            {/* Username */}
          <div>
              <input
                name="userName"
                type="text"
                required
                value={formData.userName}
                onChange={handleChange}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-blue-200 focus:bg-white/20 focus:border-blue-400 focus:outline-none transition-all duration-200 text-sm"
                placeholder={t('auth.register.username')}
              />
            </div>

            {/* Email */}
            <div>
              <input
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-blue-200 focus:bg-white/20 focus:border-blue-400 focus:outline-none transition-all duration-200 text-sm"
                placeholder={t('auth.register.email')}
              />
            </div>

            {/* Date of Birth */}
            <div>
              <input
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-blue-200 focus:bg-white/20 focus:border-blue-400 focus:outline-none transition-all duration-200 text-sm"
              />
            </div>

            {/* Phone Number */}
            <div>
              <input
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-blue-200 focus:bg-white/20 focus:border-blue-400 focus:outline-none transition-all duration-200 text-sm"
                placeholder={t('auth.register.phone')}
              />
            </div>

            {/* Role Selection */}
            <div>
              <div className="grid grid-cols-2 gap-2">
                <label className={`relative flex cursor-pointer rounded-lg p-2 border transition-all duration-200 ${
                  formData.role === 'Member' 
                    ? 'border-blue-400 bg-blue-500/20' 
                    : 'border-white/20 bg-white/5 hover:bg-white/10'
                }`}>
                  <input
                    type="radio"
                    name="role"
                    value="Member"
                    checked={formData.role === 'Member'}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className="flex items-center justify-center w-full">
                    <User className={`h-3 w-3 mr-1 ${
                      formData.role === 'Member' ? 'text-blue-300' : 'text-blue-200'
                    }`} />
                    <span className={`text-xs font-medium ${
                      formData.role === 'Member' ? 'text-white' : 'text-blue-200'
                    }`}>
                      {t('auth.register.member')}
                    </span>
                  </div>
                </label>
                
                <label className={`relative flex cursor-pointer rounded-lg p-2 border transition-all duration-200 ${
                  formData.role === 'Seller' 
                    ? 'border-blue-400 bg-blue-500/20' 
                    : 'border-white/20 bg-white/5 hover:bg-white/10'
                }`}>
                  <input
                    type="radio"
                    name="role"
                    value="Seller"
                    checked={formData.role === 'Seller'}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className="flex items-center justify-center w-full">
                    <Building2 className={`h-3 w-3 mr-1 ${
                      formData.role === 'Seller' ? 'text-blue-300' : 'text-blue-200'
                    }`} />
                    <span className={`text-xs font-medium ${
                      formData.role === 'Seller' ? 'text-white' : 'text-blue-200'
                    }`}>
                      {t('auth.register.seller')}
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 pr-10 text-white placeholder-blue-200 focus:bg-white/20 focus:border-blue-400 focus:outline-none transition-all duration-200 text-sm"
                  placeholder={t('auth.register.password')}
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
              
              {/* Password Requirements */}
              {formData.password && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {passwordRequirements.map((requirement, index) => (
                    <div key={index} className={`flex items-center text-xs px-1.5 py-0.5 rounded ${
                          requirement.check(formData.password) 
                        ? 'bg-green-500/20 text-green-300' 
                        : 'bg-white/10 text-blue-200'
                    }`}>
                      <Check className={`h-2 w-2 mr-1 ${
                          requirement.check(formData.password)
                          ? 'text-green-400' 
                          : 'text-blue-300'
                      }`} />
                        {requirement.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <div className="relative">
                <input
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 pr-10 text-white placeholder-blue-200 focus:bg-white/20 focus:border-blue-400 focus:outline-none transition-all duration-200 text-sm"
                  placeholder={t('auth.register.confirmPassword')}
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

            {/* Terms and Age Confirmation */}
            <div className="space-y-2">
              <div className="flex items-start">
                <input 
                  id="acceptTerms" 
                  name="acceptTerms" 
                  type="checkbox" 
                  checked={formData.acceptTerms} 
                  onChange={handleChange} 
                  className="h-3 w-3 mt-0.5 text-blue-500 border-white/20 rounded focus:ring-blue-500 bg-white/10" 
                />
                <label htmlFor="acceptTerms" className="ml-2 text-xs text-blue-200">
                  I agree to the <Link to="/terms" className="text-blue-300 hover:text-white font-medium">Terms</Link> and <Link to="/privacy" className="text-blue-300 hover:text-white font-medium">Privacy</Link>
                </label>
              </div>
              
              <div className="flex items-start">
                <input 
                  id="isOver18" 
                  name="isOver18" 
                  type="checkbox" 
                  checked={formData.isOver18} 
                  onChange={handleChange} 
                  className="h-3 w-3 mt-0.5 text-blue-500 border-white/20 rounded focus:ring-blue-500 bg-white/10" 
                />
                <label htmlFor="isOver18" className="ml-2 text-xs text-blue-200">
                  {t('auth.register.isOver18')}
                </label>
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
                  <span>{t('auth.register.createAccount')}...</span>
                  {/* Loading overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 animate-pulse"></div>
                </>
              ) : (
                <>
                  <Zap className="h-3 w-3 mr-1" />
                  {t('auth.register.createAccount')}
                  <ArrowRight className="h-3 w-3 ml-1" />
                </>
                )}
              </button>
          </form>

          {/* Sign In Link */}
          <div className="mt-4 text-center">
            <p className="text-xs text-blue-200">
              {t('auth.register.haveAccount')}{' '}
              <Link
                to="/login"
                className="font-semibold text-white hover:text-blue-300 transition-colors"
              >
                {t('auth.register.signIn')}
              </Link>
            </p>
          </div>
            </div>
          </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 bg-green-500/10 border border-green-400/50 rounded-xl p-4 shadow-2xl backdrop-blur-sm z-50 transform transition-all duration-300 max-w-sm">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
                <Check className="h-4 w-4 text-green-400" />
              </div>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-semibold text-green-200 mb-1">
                Success!
              </h3>
              <p className="text-xs text-green-300 leading-relaxed">{toast}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Animation Overlay */}
      {showSuccessAnimation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-gradient-to-br from-green-500/20 to-blue-500/20 border border-green-400/50 rounded-2xl p-8 shadow-2xl backdrop-blur-sm max-w-md mx-4 transform transition-all duration-500 scale-100">
            <div className="text-center">
              {/* Animated Check Icon */}
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <CheckCircle className="h-12 w-12 text-green-400 animate-bounce" />
                </div>
                <div className="absolute inset-0 w-20 h-20 bg-green-400/30 rounded-full mx-auto animate-ping"></div>
              </div>
              
              {/* Success Message */}
              <h2 className="text-2xl font-bold text-white mb-3 animate-fade-in">
                {t('auth.register.success.title')}
              </h2>
              <div className="bg-white/10 border border-white/20 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-center mb-2">
                  <Mail className="h-5 w-5 text-blue-400 mr-2" />
                  <span className="text-sm font-semibold text-blue-200">{t('auth.register.success.message')}</span>
                </div>
                <p className="text-xs text-blue-300 leading-relaxed">
                  {t('auth.register.success.details')}
                </p>
              </div>
              
              {/* Countdown */}
              <div className="text-xs text-blue-300">
                {t('auth.register.success.countdown').replace('Saniyə', '5').replace('seconds', '5')}
          </div>
        </div>
      </div>
        </div>
      )}
    </div>
  );
}