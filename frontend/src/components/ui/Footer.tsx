import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="py-4 px-6 text-sm text-gray-500 dark:text-gray-400 text-center border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <p>&copy; {new Date().getFullYear()} SSRL ERP. All rights reserved.</p>
    </footer>
  );
};
