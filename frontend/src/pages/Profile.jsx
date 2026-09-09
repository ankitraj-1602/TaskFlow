import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { ProtectedLayout } from '../components/Layout/ProtectedLayout';
import { Input } from '../components/Forms/Input';
import { Button } from '../components/Forms/Button';
import { useAuthStore } from '../store/auth.store';

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
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Profile</h2>
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
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-gray-900">{user?.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Full Name</label>
                <p className="text-gray-900">{user?.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Bio</label>
                <p className="text-gray-900">{user?.bio || 'No bio set'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Job Title</label>
                <p className="text-gray-900">{user?.job_title || 'Not specified'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Timezone</label>
                <p className="text-gray-900">{user?.timezone || 'UTC'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email Verified</label>
                <p className="text-gray-900">
                  {user?.is_email_verified ? '✅ Yes' : '❌ No'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedLayout>
  );
};