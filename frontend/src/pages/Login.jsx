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

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const Login = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

const onSubmit = async (data) => {
  try {
    await login(data.email, data.password);
    toast.success('Welcome back!');
    
    // Check for pending invitation
    const pendingInvitation = localStorage.getItem('pendingInvitation');
    if (pendingInvitation) {
      localStorage.removeItem('pendingInvitation');
      navigate(`/invitations/${pendingInvitation}`);
      return;
    }
    
    navigate('/dashboard');
  } catch (error) {
    toast.error(error.response?.data?.message || 'Login failed');
  }
};

  return (
    <PublicLayout title="Sign in to your account" subtitle="Welcome back to TaskFlow">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email address"
          type="email"
          fullWidth
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <div>
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            fullWidth
            placeholder="Enter your password"
            error={errors.password?.message}
            {...register('password')}
          />
          <div className="flex items-center justify-between mt-1">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                onChange={(e) => setShowPassword(e.target.checked)}
              />
              <span className="ml-2 text-sm text-gray-600">Show password</span>
            </label>
            <Link
              to="/forgot-password"
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button type="submit" fullWidth loading={isLoading}>
          Sign in
        </Button>

        <p className="text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="text-indigo-600 hover:text-indigo-500 font-medium">
            Sign up
          </Link>
        </p>
      </form>
    </PublicLayout>
  );
};