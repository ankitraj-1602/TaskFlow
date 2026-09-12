import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Input } from '../Forms/Input';
import { Button } from '../Forms/Button';
import { Badge } from '../UI/Badge';
import { useAuthStore } from '../../store/auth.store';
import { authApi } from '../../api/auth.api';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  bio: z.string().max(500).optional(),
  jobTitle: z.string().max(100).optional(),
  timezone: z.string().optional(),
});

export const AccountTab = () => {
  const { user, updateUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      bio: user?.bio || '',
      jobTitle: user?.job_title || '',
      timezone: user?.timezone || 'UTC',
    },
  });

  const onSubmit = async (data) => {
    try {
      await updateUser(data);
      toast.success('Profile updated');
      setIsEditing(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleResendVerification = async () => {
    setSendingVerification(true);
    try {
      await authApi.sendVerificationEmail();
      toast.success('Verification email sent! Check your inbox.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send email');
    } finally {
      setSendingVerification(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Profile</h3>
          <Button
            variant={isEditing ? 'secondary' : 'primary'}
            onClick={() => {
              if (isEditing) reset();
              setIsEditing(!isEditing);
            }}
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </Button>
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              fullWidth
              error={errors.name?.message}
              {...register('name')}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bio
              </label>
              <textarea
                rows={3}
                className={`w-full px-3 py-2 border ${
                  errors.bio ? 'border-red-500' : 'border-gray-300'
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                {...register('bio')}
              />
              {errors.bio && (
                <p className="mt-1 text-sm text-red-600">{errors.bio.message}</p>
              )}
            </div>
            <Input
              label="Job Title"
              type="text"
              fullWidth
              error={errors.jobTitle?.message}
              {...register('jobTitle')}
            />
            <Input
              label="Timezone"
              type="text"
              fullWidth
              placeholder="e.g., Asia/Kolkata"
              error={errors.timezone?.message}
              {...register('timezone')}
            />
            <div className="flex justify-end space-x-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  reset();
                  setIsEditing(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" loading={isSubmitting}>
                Save Changes
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              {user?.profile_picture ? (
                <img
                  src={user.profile_picture}
                  alt={user.name}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-indigo-600 font-bold text-xl">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              )}
              <div>
                <p className="text-lg font-semibold text-gray-900">
                  {user?.name}
                </p>
                <p className="text-sm text-gray-500">{user?.email}</p>
                <div className="mt-1 flex items-center gap-2">
                  {user?.is_email_verified ? (
                    <Badge variant="success">Email Verified</Badge>
                  ) : (
                    <>
                      <Badge variant="warning">Email Not Verified</Badge>
                      <button
                        onClick={handleResendVerification}
                        disabled={sendingVerification}
                        className="text-xs text-indigo-600 hover:text-indigo-500 font-medium"
                      >
                        {sendingVerification ? 'Sending...' : 'Resend'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Job Title</p>
                <p className="text-sm text-gray-900 mt-1">
                  {user?.job_title || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Timezone</p>
                <p className="text-sm text-gray-900 mt-1">
                  {user?.timezone || 'UTC'}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Bio</p>
                <p className="text-sm text-gray-900 mt-1">
                  {user?.bio || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Member Since</p>
                <p className="text-sm text-gray-900 mt-1">
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString()
                    : '—'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};