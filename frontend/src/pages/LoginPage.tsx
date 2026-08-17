import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';
import { useLoginMutation } from '../features/auth/auth.hooks';
import { TextInput } from '../components/form/TextInput';
import { Button } from '../components/form/Button';
import { AxiosError } from 'axios';
import { AuthError } from '../features/auth/auth.types';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const loginMutation = useLoginMutation();
  const [globalError, setGlobalError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormValues) => {
    setGlobalError(null);
    loginMutation.mutate(data, {
      onSuccess: (response) => {
        if (response.success && response.data) {
          login(response.data.accessToken, response.data.user);
        } else {
          setGlobalError(response.message || 'Login failed');
        }
      },
      onError: (error) => {
        if (error instanceof AxiosError) {
          if (!error.response) {
            setGlobalError('Network Error: Unable to connect to the server. Please check your internet connection or backend configuration.');
            return;
          }
          const authError = error.response?.data as AuthError;
          setGlobalError(authError?.message || 'Invalid username or password');
        } else {
          setGlobalError('An unexpected error occurred. Please try again.');
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sign in to SSRL ERP</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Enter your credentials to access the system</p>
      </div>
      
      {globalError && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/50 p-4 border border-red-200 dark:border-red-800">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Authentication Failed</h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p>{globalError}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <TextInput
          label="Username"
          type="text"
          placeholder="Enter your username"
          error={errors.username?.message}
          {...register('username')}
        />
        
        <TextInput
          label="Password"
          type="password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />
        
        <Button
          type="submit"
          className="w-full"
          isLoading={loginMutation.isPending}
          disabled={loginMutation.isPending}
        >
          Sign In
        </Button>
      </form>
    </div>
  );
};
