import React from 'react';
import { useSettingsQuery } from '../../../features/settings/settings.hooks';
import { Setting } from '../../../features/settings/settings.types';
import { Button } from '../../../components/form/Button';
import { TextInput } from '../../../components/form/TextInput';


export const SystemSettingsPage: React.FC = () => {
  const { data, isLoading } = useSettingsQuery();

  const settings = data?.data || [];

  const groupedSettings = settings.reduce((acc, setting) => {
    if (!acc[setting.category]) acc[setting.category] = [];
    acc[setting.category].push(setting);
    return acc;
  }, {} as Record<string, Setting[]>);

  if (isLoading) return <div className="p-8 text-center">Loading settings...</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Settings</h1>
        <p className="text-gray-500 dark:text-gray-400">Configure global application preferences and variables.</p>
      </div>

      {Object.entries(groupedSettings).map(([category, items]) => (
        <div key={category} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{category} Settings</h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {items.map((setting) => (
              <div key={setting.setting_key} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white">{setting.setting_key.replace(/_/g, ' ')}</h3>
                  {setting.description && (
                    <p className="text-sm text-gray-500 mt-1">{setting.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-48">
                    <TextInput 
                      value={setting.setting_value || ''}
                      disabled
                      // Setting it read-only for now until full dynamic form is requested, to prevent accidental mutation of critical ERP variables.
                    />
                  </div>
                  <Button variant="outline" size="sm" disabled>Update</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      
      {settings.length === 0 && (
        <div className="p-8 text-center text-gray-500 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          No system settings found in the database.
        </div>
      )}
    </div>
  );
};
