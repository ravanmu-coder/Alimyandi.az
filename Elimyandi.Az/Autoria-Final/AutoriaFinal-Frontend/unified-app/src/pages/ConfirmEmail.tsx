import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../lib/api';
import { useTranslation } from 'react-i18next';

export default function ConfirmEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const { t } = useTranslation();

  useEffect(() => {
    const userId = searchParams.get('userId') || undefined;
    const token = searchParams.get('token') || undefined;
    const redirect = searchParams.get('redirect') || undefined;

    const confirm = async () => {
      setStatus('loading');
      try {
        await apiClient.confirmEmail({ userId, token, redirect });
        setStatus('success');
        setMessage(t('auth.confirmEmail.success'));
        setTimeout(() => navigate('/login'), 1500);
      } catch (err: any) {
        setStatus('error');
        setMessage(err?.message || 'Failed to confirm email');
      }
    };

    confirm();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Confirming your email</h1>
          <p className="text-gray-600 mb-4">Please wait while we process your request.</p>
          {status === 'loading' && (
            <div className="text-blue-600">Processing...</div>
          )}
          {status !== 'idle' && status !== 'loading' && (
            <div className={status === 'success' ? 'text-green-600' : 'text-red-600'}>{message}</div>
          )}
        </div>
      </div>
    </div>
  );
}


