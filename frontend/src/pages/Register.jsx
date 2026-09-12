import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { PublicLayout } from '../components/Layout/PublicLayout';
import { Input } from '../components/Forms/Input';
import { Button } from '../components/Forms/Button';
import { useAuthStore } from '../store/auth.store';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[@$!%*?&]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
  jobTitle: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const Register = () => {
  const navigate = useNavigate();
  const { register: registerUser, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

const onSubmit = async (data) => {
  try {
    const { confirmPassword, ...registerData } = data;
    await registerUser(registerData);
    toast.success('Account created successfully!');

    // Check for pending invitation
    const pendingInvitation = localStorage.getItem('pendingInvitation');
    if (pendingInvitation) {
      navigate(`/invitations/${pendingInvitation}`);
      return;
    }

    navigate('/dashboard');
  } catch (error) {
    toast.error(error.response?.data?.message || 'Registration failed');
  }
};

  return (
    <PublicLayout title="Create your account" subtitle="Start managing your projects with TaskFlow">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Full name"
          type="text"
          fullWidth
          placeholder="John Doe"
          error={errors.name?.message}
          {...register('name')}
        />

        <Input
          label="Email address"
          type="email"
          fullWidth
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Job title (optional)"
          type="text"
          fullWidth
          placeholder="Software Engineer"
          error={errors.jobTitle?.message}
          {...register('jobTitle')}
        />

        <div>
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            fullWidth
            placeholder="Create a strong password"
            error={errors.password?.message}
            {...register('password')}
          />
          <ul className="mt-1 text-xs text-gray-500 space-y-1">
            <li>• At least 8 characters</li>
            <li>• At least one uppercase and one lowercase letter</li>
            <li>• At least one number</li>
            <li>• At least one special character (@$!%*?&)</li>
          </ul>
        </div>

        <Input
          label="Confirm password"
          type={showPassword ? 'text' : 'password'}
          fullWidth
          placeholder="Confirm your password"
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
          Create account
        </Button>

        <p className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 hover:text-indigo-500 font-medium">
            Sign in
          </Link>
        </p>
      </form>
    </PublicLayout>
  );
};