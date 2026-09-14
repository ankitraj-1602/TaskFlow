import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { ProtectedLayout } from '../components/Layout/ProtectedLayout';
import { Input } from '../components/Forms/Input';
import { Button } from '../components/Forms/Button';
import { useAuthStore } from '../store/auth.store';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  jobTitle: z.string().optional(),
  timezone: z.string().optional(),
});

export const Profile = () => {
  const { user, updateUser, isLoading } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
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
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  return (
    <ProtectedLayout>
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-indigo-50 flex items-center justify-center ring-1 ring-indigo-100 shrink-0">
                <span className="text-indigo-600 font-semibold text-xl">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Profile</h2>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>
            <Button
              variant={isEditing ? 'secondary' : 'primary'}
              onClick={() => {
                if (isEditing) {
                  reset();
                }
                setIsEditing(!isEditing);
              }}
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </Button>
          </div>

          {isEditing ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2 border-t border-gray-100">
              <div className="pt-4 space-y-4">
                <Input
                  label="Full Name"
                  type="text"
                  fullWidth
                  error={errors.name?.message}
                  {...register('name')}
                />
                <Input
                  label="Bio"
                  type="text"
                  fullWidth
                  error={errors.bio?.message}
                  {...register('bio')}
                />
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
                  error={errors.timezone?.message}
                  {...register('timezone')}
                />
                <Button type="submit" fullWidth loading={isLoading}>
                  Save Changes
                </Button>
              </div>
            </form>
          ) : (
            <div className="pt-2 border-t border-gray-100">
              <dl className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                <div>
                  <dt className="text-xs font-medium text-gray-500 mb-0.5">Full Name</dt>
                  <dd className="text-sm text-gray-900">{user?.name}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 mb-0.5">Job Title</dt>
                  <dd className="text-sm text-gray-900">{user?.job_title || 'Not specified'}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium text-gray-500 mb-0.5">Bio</dt>
                  <dd className="text-sm text-gray-900">{user?.bio || 'No bio set'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 mb-0.5">Timezone</dt>
                  <dd className="text-sm text-gray-900">{user?.timezone || 'UTC'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 mb-0.5">Email Verified</dt>
                  <dd className="flex items-center text-sm">
                    {user?.is_email_verified ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-700">
                        <CheckCircleIcon className="h-4 w-4" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-gray-500">
                        <XCircleIcon className="h-4 w-4" />
                        Not verified
                      </span>
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          )}
        </div>
      </div>
    </ProtectedLayout>
  );
};