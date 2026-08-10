import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateUserMutation, useUpdateUserMutation, useUserQuery } from '../../../features/users/users.hooks';
import { userFormSchema, UserFormValues } from '../../../features/users/users.validation';
import { Button } from '../../../components/form/Button';
import { TextInput } from '../../../components/form/TextInput';
import { ROUTES } from '../../../constants';
import { toast } from 'sonner';

export const UserFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const { data: response, isLoading: isLoadingUser } = useUserQuery(id || '');
  const createMutation = useCreateUserMutation();
  const updateMutation = useUpdateUserMutation(id || '');

  const { register, handleSubmit, formState: { errors }, reset } = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      role: 'USER',
    }
  });

  useEffect(() => {
    if (isEdit && response?.data) {
      reset({
        full_name: response.data.full_name,
        username: response.data.username,
        mobile: response.data.mobile || '',
        role: response.data.role,
      });
    }
  }, [isEdit, response, reset]);

  const onSubmit = async (data: UserFormValues) => {
    try {
      if (isEdit) {
        // Exclude password and username from update
        const { username, password, ...updateData } = data;
        await updateMutation.mutateAsync(updateData);
        toast.success('User updated successfully');
      } else {
        await createMutation.mutateAsync(data);
        toast.success('User created successfully');
      }
      navigate(`${ROUTES.PROTECTED.SETTINGS}/users`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save user');
    }
  };

  if (isEdit && isLoadingUser) return <div>Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEdit ? 'Edit User' : 'Create User'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
        <TextInput
          label="Full Name *"
          {...register('full_name')}
          error={errors.full_name?.message}
        />

        <TextInput
          label="Username *"
          {...register('username')}
          error={errors.username?.message}
          disabled={isEdit}
        />

        {!isEdit && (
          <TextInput
            type="password"
            label="Password *"
            {...register('password')}
            error={errors.password?.message}
          />
        )}

        <TextInput
          label="Mobile"
          {...register('mobile')}
          error={errors.mobile?.message}
        />

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Role *</label>
          <select
            {...register('role')}
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="USER">User</option>
            <option value="ADMIN">Admin</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </select>
          {errors.role && <p className="text-xs text-red-500">{errors.role.message}</p>}
        </div>

        <div className="pt-4 flex gap-4">
          <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
            {isEdit ? 'Update User' : 'Create User'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};
