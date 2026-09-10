import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/auth.store';
import { authApi } from '../../api/auth.api';
import { Button } from '../Forms/Button';
import { XMarkIcon } from '@heroicons/react/24/outline';

export const EmailVerificationBanner = () => {
  const { user } = useAuthStore();
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);

  if (!user || user.is_email_verified || dismissed) return null;

  const handleResend = async () => {
    setSending(true);
    try {
      await authApi.sendVerificationEmail();
      toast.success('Verification email sent! Check your inbox.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-lg">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-yellow-800">
            <strong>Verify your email</strong> — Please check your inbox and click the verification link.
          </p>
          <Button
            size="sm"
            className="mt-2"
            onClick={handleResend}
            loading={sending}
          >
            Resend verification email
          </Button>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-yellow-600 hover:text-yellow-800"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};