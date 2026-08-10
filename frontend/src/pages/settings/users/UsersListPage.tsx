import React, { useState } from 'react';
import { useUsersQuery, useActivateUserMutation, useDeactivateUserMutation } from '../../../features/users/users.hooks';
import { DataTable, Column } from '../../../components/table/DataTable';
import { Button } from '../../../components/form/Button';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../constants';
import { User } from '../../../features/users/users.types';
import { toast } from 'sonner';

export const UsersListPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useUsersQuery({ page, limit: 10 });
  
  const activateMutation = useActivateUserMutation();
  const deactivateMutation = useDeactivateUserMutation();

  const handleToggleActive = async (user: User) => {
    try {
      if (user.is_active) {
        await deactivateMutation.mutateAsync(user.id);
        toast.success('User deactivated');
      } else {
        await activateMutation.mutateAsync(user.id);
        toast.success('User activated');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to toggle user status');
    }
  };

  const columns: Column<User>[] = [
    { key: 'username', header: 'Username', cell: (item: User) => (
      <Link to={`${ROUTES.PROTECTED.SETTINGS}/users/${item.id}`} className="text-blue-600 hover:underline font-medium">
        {item.username}
      </Link>
    )},
    { key: 'full_name', header: 'Full Name', cell: (item: User) => item.full_name },
    { key: 'role', header: 'Role', cell: (item: User) => (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
        item.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-800' :
        item.role === 'ADMIN' ? 'bg-blue-100 text-blue-800' :
        'bg-gray-100 text-gray-800'
      }`}>
        {item.role.replace('_', ' ')}
      </span>
    )},
    { key: 'status', header: 'Status', cell: (item: User) => (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
        item.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {item.is_active ? 'Active' : 'Inactive'}
      </span>
    )},
    { key: 'actions', header: 'Actions', cell: (item: User) => (
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => handleToggleActive(item)}
        disabled={activateMutation.isPending || deactivateMutation.isPending}
      >
        {item.is_active ? 'Deactivate' : 'Activate'}
      </Button>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage system access and roles.</p>
        </div>
        <Link to={`${ROUTES.PROTECTED.SETTINGS}/users/new`}>
          <Button>Create User</Button>
        </Link>
      </div>

      <DataTable
        columns={columns}
        data={data?.data?.data || []}
        isLoading={isLoading}
        page={data?.data?.meta?.page || 1}
        totalPages={data?.data?.meta?.totalPages || 1}
        onNextPage={() => setPage(p => p + 1)}
        onPrevPage={() => setPage(p => Math.max(1, p - 1))}
      />
    </div>
  );
};
