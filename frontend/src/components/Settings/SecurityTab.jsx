import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { Input } from '../Forms/Input';
import { Button } from '../Forms/Button';
import { useAuthStore } from '../../store/auth.store';
import { authApi } from '../../api/auth.api';

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
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

export const SecurityTab = () => {
  const navigate = useNavigate();
  const { logout, clearAuth } = useAuthStore();
  const [showPasswords, setShowPasswords] = useState(false);
  const [loggingOutAll, setLoggingOutAll] = useState(false);
  const [showLogoutAllConfirm, setShowLogoutAllConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(passwordSchema),
  });

  const onChangePassword = async (data) => {
    try {
      await authApi.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Password changed. Please sign in again.');
      reset();
      // Password change clears all refresh tokens → user needs to login again
      setTimeout(async () => {
        clearAuth();
        navigate('/login');
      }, 1500);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    }
  };

  const handleLogoutAll = async () => {
    setLoggingOutAll(true);
    try {
      await authApi.logoutAll();
      toast.success('Logged out from all devices');
      clearAuth();
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to logout');
    } finally {
      setLoggingOutAll(false);
      setShowLogoutAllConfirm(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Change Password */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          Change Password
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          After changing your password, you'll need to sign in again.
        </p>

        <form onSubmit={handleSubmit(onChangePassword)} className="space-y-4">
          <Input
            label="Current Password"
            type={showPasswords ? 'text' : 'password'}
            fullWidth
            error={errors.currentPassword?.message}
            {...register('currentPassword')}
          />
          <Input
            label="New Password"
            type={showPasswords ? 'text' : 'password'}
            fullWidth
            error={errors.newPassword?.message}
            {...register('newPassword')}
          />
          <Input
            label="Confirm New Password"
            type={showPasswords ? 'text' : 'password'}
            fullWidth
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          <div className="flex items-center">
            <input
              type="checkbox"
              id="showPasswords"
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              checked={showPasswords}
              onChange={(e) => setShowPasswords(e.target.checked)}
            />
            <label htmlFor="showPasswords" className="ml-2 text-sm text-gray-600">
              Show passwords
            </label>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" loading={isSubmitting}>
              Update Password
            </Button>
          </div>
        </form>
      </div>

      {/* Active Sessions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          Active Sessions
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          If you've signed in on multiple devices and want to sign out everywhere,
          use the button below.
        </p>

        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-900">Current session</p>
            <p className="text-xs text-gray-500">
              This browser / device
            </p>
          </div>
          <span className="text-xs text-green-600 font-medium">Active</span>
        </div>

        <div className="mt-4">
          <Button
            variant="secondary"
            onClick={() => setShowLogoutAllConfirm(true)}
          >
            Logout from all devices
          </Button>
        </div>

        {showLogoutAllConfirm && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-gray-800 mb-3">
              This will sign you out from every device, including this one. Continue?
            </p>
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowLogoutAllConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={handleLogoutAll}
                loading={loggingOutAll}
              >
                Yes, logout all
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};