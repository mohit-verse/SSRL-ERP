import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useUserQuery, useResetPasswordMutation } from '../../../features/users/users.hooks';
import { Button } from '../../../components/form/Button';
import { ROUTES } from '../../../constants';
import { TextInput } from '../../../components/form/TextInput';
import { toast } from 'sonner';

export const UserDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: response, isLoading } = useUserQuery(id!);
  const [newPassword, setNewPassword] = useState('');
  const resetMutation = useResetPasswordMutation();

  if (isLoading) return <div>Loading...</div>;
  if (!response?.data) return <div>User not found.</div>;

  const user = response.data;

  const handleResetPassword = async () => {
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    
    try {
      await resetMutation.mutateAsync({ id: user.id, new_password: newPassword });
      toast.success('Password reset successfully');
      setNewPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to reset password');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user.full_name}</h1>
          <p className="text-gray-500 dark:text-gray-400">@{user.username}</p>
        </div>
        <Link to={`${ROUTES.PROTECTED.SETTINGS}/users/${user.id}/edit`}>
          <Button variant="outline">Edit User</Button>
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">User Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Role</p>
            <p className="font-medium">{user.role}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <p className="font-medium">{user.is_active ? 'Active' : 'Inactive'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Mobile</p>
            <p className="font-medium">{user.mobile || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Created At</p>
            <p className="font-medium">{new Date(user.created_at).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Reset Password</h3>
        <div className="space-y-4">
          <TextInput
            type="password"
            label="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Min 8 characters"
          />
          <Button 
            onClick={handleResetPassword} 
            isLoading={resetMutation.isPending}
            disabled={newPassword.length < 8}
          >
            Reset Password
          </Button>
        </div>
      </div>
    </div>
  );
};
