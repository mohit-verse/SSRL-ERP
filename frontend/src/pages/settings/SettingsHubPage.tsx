import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants';
import { Users, Calendar, Hash, Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const AdminCard: React.FC<{ title: string; description: string; path: string; icon: React.ReactNode }> = ({ title, description, path, icon }) => (
  <Link to={path} className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-colors group">
    <div className="flex items-start gap-4">
      <div className="p-3 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg group-hover:bg-blue-50 group-hover:text-blue-600 dark:group-hover:bg-blue-900/50 dark:group-hover:text-blue-400 transition-colors">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
      </div>
    </div>
  </Link>
);

export const SettingsHubPage: React.FC = () => {
  const { hasRole } = useAuth();
  
  if (!hasRole(['SUPER_ADMIN'])) {
    return (
      <div className="p-8 text-center text-gray-500">
        You do not have permission to view administration settings.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Administration Hub</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage system settings, users, and core configuration.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AdminCard 
          title="User Management" 
          description="Create and manage system users, roles, and access." 
          path={`${ROUTES.PROTECTED.SETTINGS}/users`}
          icon={<Users size={24} />}
        />
        
        <AdminCard 
          title="Financial Years" 
          description="Manage financial periods and activate new years." 
          path={`${ROUTES.PROTECTED.SETTINGS}/financial-years`}
          icon={<Calendar size={24} />}
        />
        
        <AdminCard 
          title="Number Sequences" 
          description="View read-only sequences for system generated entities." 
          path={`${ROUTES.PROTECTED.SETTINGS}/number-sequences`}
          icon={<Hash size={24} />}
        />
        
        <AdminCard 
          title="System Settings" 
          description="Configure global application preferences and variables." 
          path={`${ROUTES.PROTECTED.SETTINGS}/system`}
          icon={<SettingsIcon size={24} />}
        />
      </div>
    </div>
  );
};
