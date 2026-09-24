import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { Input } from '../Forms/Input';
import { Button } from '../Forms/Button';
import { useAuthStore } from '../../store/auth.store';
import { authApi } from '../../api/auth.api';
import {
  ComputerDesktopIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

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
  const { clearAuth } = useAuthStore();
  const [showPasswords, setShowPasswords] = useState(false);
  const [loggingOutAll, setLoggingOutAll] = useState(false);
  const [showLogoutAllConfirm, setShowLogoutAllConfirm] = useState(false);

  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // ─── Load sessions ──────────────────────────────
  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      const data = await authApi.getSessions();
      setSessions(data || []);
    } catch (err) {
      // Silent — will show empty list
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    loadSessions();

    // Refresh when the user switches back to this tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadSessions();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Also refresh when the window regains focus
    window.addEventListener('focus', loadSessions);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', loadSessions);
    };
  }, []);

  const handleRevoke = async (sessionId) => {
    try {
      await authApi.revokeSession(sessionId);
      toast.success('Session revoked');
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to revoke session');
    }
  };
  // ────────────────────────────────────────────────

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

  // ─── Device label helper ────────────────────────
  const getDeviceLabel = (userAgent) => {
    if (!userAgent) return 'Unknown device';
    if (/mobile/i.test(userAgent)) return 'Mobile device';
    if (/tablet|ipad/i.test(userAgent)) return 'Tablet';
    if (/chrome/i.test(userAgent)) return 'Chrome on Desktop';
    if (/firefox/i.test(userAgent)) return 'Firefox on Desktop';
    if (/safari/i.test(userAgent)) return 'Safari on Desktop';
    if (/edge/i.test(userAgent)) return 'Edge on Desktop';
    return 'Desktop browser';
  };
  // ────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ─── Change Password ──────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-1">
          Change Password
        </h3>
        <p className="text-sm text-gray-500 mb-5">
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

          <div className="flex justify-end pt-1">
            <Button type="submit" loading={isSubmitting}>
              Update Password
            </Button>
          </div>
        </form>
      </div>

      {/* ─── Active Sessions ──────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-1">
          Active Sessions
        </h3>
        <p className="text-sm text-gray-500 mb-5">
          If you've signed in on multiple devices and want to sign out everywhere,
          use the button below.
        </p>

        {/* Loading state */}
        {loadingSessions && sessions.length === 0 ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-indigo-600" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No active sessions
          </p>
        ) : (
          <div className="space-y-2.5">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-4 border border-gray-100 rounded-xl bg-gray-50/50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-lg bg-white border border-gray-100 flex items-center justify-center shrink-0">
                    <ComputerDesktopIcon className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {session.isCurrent
                        ? 'This device (current)'
                        : getDeviceLabel(session.userAgent)}
                    </p>
                    <p className="text-xs text-gray-500 truncate max-w-xs">
                      {session.ipAddress || 'Unknown IP'} ·{' '}
                      Last used {new Date(session.lastUsedAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {session.isCurrent ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-medium shrink-0">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Active
                  </span>
                ) : (
                  <button
                    onClick={() => handleRevoke(session.id)}
                    className="text-xs text-red-600 hover:text-red-700 font-medium shrink-0 px-2 py-1 rounded hover:bg-red-50 transition"
                  >
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-4">
          <Button
            variant="secondary"
            onClick={() => setShowLogoutAllConfirm(true)}
          >
            Logout from all devices
          </Button>
        </div>

        {showLogoutAllConfirm && (
          <div className="mt-4 p-4 bg-red-50/60 border border-red-100 rounded-xl">
            <div className="flex items-start gap-2.5 mb-3">
              <ExclamationTriangleIcon className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-gray-700">
                This will sign you out from every device, including this one.
                Continue?
              </p>
            </div>
            <div className="flex gap-2">
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