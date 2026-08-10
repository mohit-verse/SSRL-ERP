import React from 'react';
import { TextInput } from '../../../components/form/TextInput';

interface BillFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
}

export const BillFilters: React.FC<BillFiltersProps> = ({ search, onSearchChange }) => {
  return (
    <div className="flex flex-wrap gap-4 items-end mb-6 bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
      <div className="w-64">
        <TextInput
          placeholder="Search Bill No, Party..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      {/* Extend with Status/Date filters when supported by API */}
    </div>
  );
};
