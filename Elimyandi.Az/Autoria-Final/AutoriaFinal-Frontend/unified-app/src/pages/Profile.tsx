import React, { useEffect, useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { DayPicker } from 'react-day-picker';
import { toast } from 'react-hot-toast';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Globe, 
  FileText, 
  Settings, 
  Shield, 
  Clock, 
  Key,
  Camera,
  Save,
  X,
  Check,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { apiClient } from '../lib/api';
import { IUserProfile, IUpdateUserProfile } from '../types/api';
import 'react-day-picker/dist/style.css';

export default function Profile() {
  const [profileData, setProfileData] = useState<IUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    showCurrentPassword: false,
    showNewPassword: false,
    showConfirmPassword: false
  });

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        console.log('🔄 Loading user profile from /api/Auth/profile...');
        const profile = await apiClient.getProfile();
        console.log('✅ Profile loaded successfully:', profile);
        console.log('📧 Email:', profile.email);
        console.log('👤 Name:', profile.firstName, profile.lastName);
        console.log('🎭 Roles:', profile.roles);
        console.log('✓ Email Confirmed:', profile.emailConfirmed);
        setProfileData(profile);
        toast.success('Profil məlumatları yükləndi');
      } catch (e: any) {
        console.error('❌ Error loading profile:', e);
        setError(e?.message || 'Profil məlumatları yüklənə bilmədi');
        toast.error(e?.message || 'Profil məlumatları yüklənə bilmədi');
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, []);

  // Handle form field changes
  const handleChange = useCallback((field: keyof IUpdateUserProfile, value: any) => {
    setProfileData(prev => prev ? { ...prev, [field]: value } : null);
  }, []);

  // Handle profile picture upload
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        handleChange('profilePicture', base64);
        toast.success('Profil şəkli yükləndi');
      };
      reader.readAsDataURL(file);
    }
  }, [handleChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: false,
    maxSize: 5 * 1024 * 1024 // 5MB
  });

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileData) return;

    // Form validation
    if (!profileData.firstName?.trim()) {
      toast.error('Ad daxil edilməlidir');
      return;
    }

    if (!profileData.lastName?.trim()) {
      toast.error('Soyad daxil edilməlidir');
      return;
    }

    if (profileData.phoneNumber && !/^\+?[\d\s\-\(\)]+$/.test(profileData.phoneNumber)) {
      toast.error('Düzgün telefon nömrəsi daxil edin');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const updateData: IUpdateUserProfile = {
        firstName: profileData.firstName?.trim(),
        lastName: profileData.lastName?.trim(),
        phone: profileData.phoneNumber?.trim() || undefined,
        dateOfBirth: profileData.dateOfBirth,
        profilePicture: profileData.profilePicture,
        bio: profileData.bio?.trim() || undefined,
        city: profileData.city?.trim() || undefined,
        country: profileData.country?.trim() || undefined,
        timeZone: profileData.timeZone,
        allowMarketing: profileData.allowMarketing,
        preferredLanguage: profileData.preferredLanguage
      };

      const updatedProfile = await apiClient.updateProfile(updateData);
      setProfileData(updatedProfile);
      toast.success('Profil uğurla yeniləndi!');
    } catch (e: any) {
      setError(e?.message || 'Profil yenilənə bilmədi');
      toast.error(e?.message || 'Profil yenilənə bilmədi');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Yeni parollar uyğun gəlmir');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Yeni parol ən azı 6 simvol olmalıdır');
      return;
    }

    try {
      await apiClient.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword
      });
      toast.success('Parol uğurla dəyişdirildi');
      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        showCurrentPassword: false,
        showNewPassword: false,
        showConfirmPassword: false
      });
    } catch (e: any) {
      toast.error(e?.message || 'Parol dəyişdirilə bilmədi');
    }
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('az-AZ');
  };

  // Get role badge color
  const getRoleBadgeColor = (role?: string) => {
    switch (role?.toLowerCase()) {
      case 'admin': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'seller': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-white">
            <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Profil yüklənə bilmədi</h2>
            <p className="text-gray-300">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-slate-900/50 backdrop-blur-lg border border-slate-700 rounded-2xl p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
            {/* Profile Picture */}
            <div {...getRootProps()} className="relative group cursor-pointer">
              <div className="w-32 h-32 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center overflow-hidden">
                {profileData.profilePicture ? (
                  <img 
                    src={profileData.profilePicture} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-16 h-16 text-white/60" />
                )}
              </div>
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <input {...getInputProps()} />
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-white mb-2">
                {profileData.firstName} {profileData.lastName}
              </h1>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-4">
                {profileData.primaryRole && (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRoleBadgeColor(profileData.primaryRole)}`}>
                    {profileData.primaryRole}
                  </span>
                )}
                {profileData.emailConfirmed && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                    <Check className="w-4 h-4 inline mr-1" />
                    Email Təsdiqlənib
                  </span>
                )}
                {profileData.isActive && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    <Check className="w-4 h-4 inline mr-1" />
                    Hesab Aktivdir
                  </span>
                )}
              </div>
              <p className="text-white/70 text-lg">{profileData.email}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information */}
          <div className="bg-slate-900/50 backdrop-blur-lg border border-slate-700 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <User className="w-6 h-6 mr-3" />
              Şəxsi Məlumatlar
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Ad
                </label>
                <input
                  type="text"
                  value={profileData.firstName || ''}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/60 border-slate-600 text-slate-200 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Adınızı daxil edin"
                  required
                />
              </div>
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Soyad
                </label>
                <input
                  type="text"
                  value={profileData.lastName || ''}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/60 border-slate-600 text-slate-200 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Soyadınızı daxil edin"
                  required
                />
              </div>
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Telefon Nömrəsi
                </label>
                <input
                  type="tel"
                  value={profileData.phoneNumber || ''}
                  onChange={(e) => handleChange('phoneNumber', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/60 border-slate-600 text-slate-200 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                  placeholder="+994 XX XXX XX XX"
                />
              </div>
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email (Dəyişdirilə bilməz)
                </label>
                <input
                  type="email"
                  value={profileData.email || ''}
                  disabled
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white/50 cursor-not-allowed"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-white/80 text-sm font-medium mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Doğum Tarixi
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={profileData.dateOfBirth ? formatDate(profileData.dateOfBirth) : ''}
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    readOnly
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent cursor-pointer"
                    placeholder="Doğum tarixinizi seçin"
                  />
                  {showDatePicker && (
                    <div className="absolute top-full left-0 mt-2 bg-white/20 backdrop-blur-lg rounded-lg border border-white/20 p-4 z-10">
                      <DayPicker
                        mode="single"
                        selected={profileData.dateOfBirth ? new Date(profileData.dateOfBirth) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            handleChange('dateOfBirth', date.toISOString());
                            setShowDatePicker(false);
                          }
                        }}
                        className="text-white"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="bg-slate-900/50 backdrop-blur-lg border border-slate-700 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <MapPin className="w-6 h-6 mr-3" />
              Ünvan Məlumatları
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Şəhər
                </label>
                <input
                  type="text"
                  value={profileData.city || ''}
                  onChange={(e) => handleChange('city', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/60 border-slate-600 text-slate-200 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Şəhərinizi daxil edin"
                />
              </div>
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Ölkə
                </label>
                <input
                  type="text"
                  value={profileData.country || ''}
                  onChange={(e) => handleChange('country', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/60 border-slate-600 text-slate-200 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Ölkənizi daxil edin"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-white/80 text-sm font-medium mb-2">
                  <Globe className="w-4 h-4 inline mr-2" />
                  Vaxt Zonası
                </label>
                <select
                  value={profileData.timeZone || ''}
                  onChange={(e) => handleChange('timeZone', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/60 border-slate-600 text-slate-200 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Vaxt zonasını seçin</option>
                  <option value="UTC+4">UTC+4 (Bakı)</option>
                  <option value="UTC+3">UTC+3 (Moskva)</option>
                  <option value="UTC+0">UTC+0 (London)</option>
                  <option value="UTC-5">UTC-5 (New York)</option>
                  <option value="UTC-8">UTC-8 (Los Angeles)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bio and Preferences */}
          <div className="bg-slate-900/50 backdrop-blur-lg border border-slate-700 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <FileText className="w-6 h-6 mr-3" />
              Bio və Parametrlər
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Bio
                </label>
                <textarea
                  value={profileData.bio || ''}
                  onChange={(e) => handleChange('bio', e.target.value)}
                  rows={4}
                  maxLength={500}
                  className="w-full px-4 py-3 bg-slate-800/60 border-slate-600 text-slate-200 rounded-lg focus:border-blue-500 focus:ring-blue-500 resize-none"
                  placeholder="Özünüz haqqında qısa məlumat yazın..."
                />
                <div className="text-right text-white/50 text-sm mt-1">
                  {(profileData.bio || '').length}/500
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between">
                  <label className="text-white/80 text-sm font-medium">
                    Marketinq bildirişlərinə icazə
                  </label>
                  <button
                    type="button"
                    onClick={() => handleChange('allowMarketing', !profileData.allowMarketing)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      profileData.allowMarketing ? 'bg-blue-600' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        profileData.allowMarketing ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
            </div>
            <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Üstünlük verilən Dil
                  </label>
                  <select
                    value={profileData.preferredLanguage || 'az'}
                    onChange={(e) => handleChange('preferredLanguage', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800/60 border-slate-600 text-slate-200 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="az">Azərbaycan</option>
                    <option value="en">English</option>
                    <option value="ru">Русский</option>
                    <option value="tr">Türkçe</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Security and Activity */}
          <div className="bg-slate-900/50 backdrop-blur-lg border border-slate-700 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Shield className="w-6 h-6 mr-3" />
              Təhlükəsizlik və Aktivlik
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-800/30 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Clock className="w-5 h-5 text-white/60 mr-2" />
                  <span className="text-white/80 text-sm font-medium">Son Giriş Tarixi</span>
                </div>
                <p className="text-white text-lg">
                  {profileData.lastLoginAt ? formatDate(profileData.lastLoginAt) : 'Məlumat yoxdur'}
                </p>
              </div>
              <div className="bg-slate-800/30 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Key className="w-5 h-5 text-white/60 mr-2" />
                  <span className="text-white/80 text-sm font-medium">Parolun Son Dəyişdirilmə Tarixi</span>
                </div>
                <p className="text-white text-lg">
                  {profileData.passwordChangedAt ? formatDate(profileData.passwordChangedAt) : 'Məlumat yoxdur'}
                </p>
              </div>
            </div>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setShowPasswordModal(true)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center"
              >
                <Key className="w-5 h-5 mr-2" />
                Parolu Dəyiş
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-transparent border border-slate-600 hover:bg-slate-700/50 text-slate-300 rounded-lg transition-colors flex items-center"
            >
              <X className="w-5 h-5 mr-2" />
              Ləğv Et
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium rounded-lg transition-colors flex items-center"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Yadda saxlanılır...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Dəyişiklikləri Yadda Saxla
                </>
              )}
            </button>
          </div>
        </form>

        {/* Password Change Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-slate-900/50 backdrop-blur-lg border border-slate-700 rounded-2xl p-8 max-w-md w-full mx-4">
              <h3 className="text-2xl font-bold text-white mb-6">Parolu Dəyiş</h3>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Hazırkı Parol
                  </label>
                  <div className="relative">
                    <input
                      type={passwordData.showCurrentPassword ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-800/60 border-slate-600 text-slate-200 rounded-lg focus:border-blue-500 focus:ring-blue-500 pr-12"
                      placeholder="Hazırkı parolunuzu daxil edin"
                    />
                    <button
                      type="button"
                      onClick={() => setPasswordData(prev => ({ ...prev, showCurrentPassword: !prev.showCurrentPassword }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                    >
                      {passwordData.showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Yeni Parol
                  </label>
                  <div className="relative">
                    <input
                      type={passwordData.showNewPassword ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-800/60 border-slate-600 text-slate-200 rounded-lg focus:border-blue-500 focus:ring-blue-500 pr-12"
                      placeholder="Yeni parolunuzu daxil edin"
                    />
                    <button
                      type="button"
                      onClick={() => setPasswordData(prev => ({ ...prev, showNewPassword: !prev.showNewPassword }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                    >
                      {passwordData.showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Yeni Parolu Təsdiq Et
                  </label>
                  <div className="relative">
                    <input
                      type={passwordData.showConfirmPassword ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-800/60 border-slate-600 text-slate-200 rounded-lg focus:border-blue-500 focus:ring-blue-500 pr-12"
                      placeholder="Yeni parolunuzu təkrar daxil edin"
                    />
                    <button
                      type="button"
                      onClick={() => setPasswordData(prev => ({ ...prev, showConfirmPassword: !prev.showConfirmPassword }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                    >
                      {passwordData.showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="px-6 py-3 bg-transparent border border-slate-600 hover:bg-slate-700/50 text-slate-300 rounded-lg transition-colors"
                  >
                    Ləğv Et
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Parolu Dəyiş
              </button>
            </div>
          </form>
        </div>
          </div>
        )}
      </div>
    </div>
  );
}