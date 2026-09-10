import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { PublicLayout } from '../components/Layout/PublicLayout';
import { Input } from '../components/Forms/Input';
import { Button } from '../components/Forms/Button';
import { authApi } from '../api/auth.api';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const ForgotPassword = () => {
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await authApi.forgotPassword(data.email);
      setSubmittedEmail(data.email);
      setSubmitted(true);
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Something went wrong. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Success state
  if (submitted) {
    return (
      <PublicLayout>
        <div className="text-center">
          <div className="text-6xl mb-4">📧</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Check your email
          </h2>
          <p className="text-gray-600 mb-6">
            If an account exists with <strong>{submittedEmail}</strong>, we've sent
            password reset instructions.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left mb-6">
            <p className="text-sm text-blue-800">
              <strong>Didn't receive it?</strong>
            </p>
            <ul className="text-sm text-blue-700 mt-1 list-disc list-inside space-y-1">
              <li>Check your spam folder</li>
              <li>Make sure the email is correct</li>
              <li>The link expires in 1 hour</li>
            </ul>
          </div>
          <div className="space-y-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => {
                setSubmitted(false);
                setSubmittedEmail('');
              }}
            >
              Try another email
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

  // Form state
  return (
    <PublicLayout
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a reset link"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email address"
          type="email"
          fullWidth
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <Button type="submit" fullWidth loading={isLoading}>
          Send reset link
        </Button>

        <p className="text-center text-sm text-gray-600">
          Remember your password?{' '}
          <Link to="/login" className="text-indigo-600 hover:text-indigo-500 font-medium">
            Sign in
          </Link>
        </p>
      </form>
    </PublicLayout>
  );
};