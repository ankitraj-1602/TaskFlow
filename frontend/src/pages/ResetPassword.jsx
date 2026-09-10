import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { PublicLayout } from '../components/Layout/PublicLayout';
import { Input } from '../components/Forms/Input';
import { Button } from '../components/Forms/Button';
import { authApi } from '../api/auth.api';

const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Must contain at least one lowercase letter')
      .regex(/\d/, 'Must contain at least one number')
      .regex(/[@$!%*?&]/, 'Must contain at least one special character'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const token = searchParams.get('token');

  // Guard against StrictMode double-firing (for future use)
  const hasChecked = useRef(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;

    if (!token) {
      toast.error('Invalid reset link. Please request a new one.');
    }
  }, [token]);

  const onSubmit = async (data) => {
    if (!token) {
      toast.error('Missing reset token. Please request a new link.');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword({
        token,
        newPassword: data.newPassword,
      });
      setSuccess(true);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          'Failed to reset password. The link may have expired.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Invalid token state (no token in URL)
  if (!token) {
    return (
      <PublicLayout>
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Invalid Reset Link
          </h2>
          <p className="text-gray-600 mb-6">
            This password reset link is invalid or missing a token.
          </p>
          <div className="space-y-3">
            <Button fullWidth onClick={() => navigate('/forgot-password')}>
              Request new link
            </Button>
            <Link
              to="/login"
              className="block text-sm text-indigo-600 hover:text-indigo-500 font-medium"
            >
              Back to login
            </Link>
          </div>
        </div>
      </PublicLayout>
    );
  }

  // Success state
  if (success) {
    return (
      <PublicLayout>
        <div className="text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Password Reset!
          </h2>
          <p className="text-gray-600 mb-6">
            Your password has been successfully reset. You can now log in with
            your new password.
          </p>
          <Button fullWidth onClick={() => navigate('/login')}>
            Go to Login
          </Button>
        </div>
      </PublicLayout>
    );
  }

  // Form state
  return (
    <PublicLayout
      title="Set new password"
      subtitle="Choose a strong password for your account"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Input
            label="New Password"
            type={showPassword ? 'text' : 'password'}
            fullWidth
            placeholder="Enter new password"
            error={errors.newPassword?.message}
            {...register('newPassword')}
          />
          <ul className="mt-1 text-xs text-gray-500 space-y-1">
            <li>• At least 8 characters</li>
            <li>• One uppercase + one lowercase letter</li>
            <li>• One number</li>
            <li>• One special character (@$!%*?&)</li>
          </ul>
        </div>

        <Input
          label="Confirm Password"
          type={showPassword ? 'text' : 'password'}
          fullWidth
          placeholder="Confirm new password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <div className="flex items-center">
          <input
            type="checkbox"
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            onChange={(e) => setShowPassword(e.target.checked)}
          />
          <span className="ml-2 text-sm text-gray-600">Show passwords</span>
        </div>

        <Button type="submit" fullWidth loading={isLoading}>
          Reset Password
        </Button>

        <p className="text-center text-sm text-gray-600">
          Remember your password?{' '}
          <Link
            to="/login"
            className="text-indigo-600 hover:text-indigo-500 font-medium"
          >
            Sign in
          </Link>
        </p>
      </form>
    </PublicLayout>
  );
};