import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ROUTES } from '../../constants';
import { LayoutDashboard, Truck, FileText, Settings, Database, FileSpreadsheet, ChevronDown, ChevronRight, Users, List, Car, TrendingUp } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../hooks/useAuth';

const NAV_ITEMS = [
  { label: 'Dashboard', path: ROUTES.PROTECTED.DASHBOARD, icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'ADMIN', 'USER'] },
  { label: 'Trips', path: ROUTES.PROTECTED.TRIPS, icon: Truck, roles: ['SUPER_ADMIN', 'ADMIN', 'USER'] },
  { 
    label: 'Billing', 
    icon: FileText, 
    roles: ['SUPER_ADMIN', 'ADMIN', 'USER'],
    subItems: [
      { label: 'Generate Bill', path: ROUTES.PROTECTED.BILLING, icon: FileText },
      { label: 'All Bills', path: ROUTES.PROTECTED.BILLS, icon: List },
    ]
  },
  { 
    label: 'Payments', 
    icon: FileSpreadsheet, 
    roles: ['SUPER_ADMIN', 'ADMIN', 'USER'],
    subItems: [
      { label: 'Record Payment', path: ROUTES.PROTECTED.PAYMENTS_CREATE, icon: FileSpreadsheet },
      { label: 'All Payments', path: ROUTES.PROTECTED.PAYMENTS, icon: List },
    ]
  },
  { label: 'Reports Hub', path: ROUTES.PROTECTED.REPORTS, icon: TrendingUp, roles: ['SUPER_ADMIN', 'ADMIN'] },
  { 
    label: 'Master Data', 
    icon: Database, 
    roles: ['SUPER_ADMIN', 'ADMIN'],
    subItems: [
      { label: 'Parties', path: ROUTES.PROTECTED.MASTER_DATA_PARTIES, icon: Users },
      { label: 'Vehicle Directory', path: ROUTES.PROTECTED.MASTER_DATA_VEHICLE_DIRECTORY, icon: List },
      { label: 'Own Fleet', path: ROUTES.PROTECTED.MASTER_DATA_OWN_FLEET, icon: Car },
    ]
  },
  { 
    label: 'Submissions', 
    icon: FileText, 
    roles: ['SUPER_ADMIN', 'ADMIN', 'USER'],
    subItems: [
      { label: 'Create Submission', path: ROUTES.PROTECTED.SUBMISSIONS_CREATE, icon: FileText },
      { label: 'All Submissions', path: ROUTES.PROTECTED.SUBMISSIONS, icon: List },
    ]
  },
  { label: 'Settings', path: ROUTES.PROTECTED.SETTINGS, icon: Settings, roles: ['SUPER_ADMIN'] },
];

export const Sidebar: React.FC = () => {
  const { hasRole } = useAuth();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'Master Data': true,
    'Billing': true,
    'Payments': true,
    'Submissions': true,
  });

  const toggleSection = (label: string) => {
    setOpenSections(prev => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 h-screen hidden md:flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">SSRL ERP</h1>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {NAV_ITEMS.map((item) => {
            if (!hasRole(item.roles)) return null;

            if (item.subItems) {
              const isOpen = openSections[item.label];
              return (
                <li key={item.label} className="pt-2">
                  <button
                    onClick={() => toggleSection(item.label)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </div>
                    {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  {isOpen && (
                    <ul className="mt-1 space-y-1 pl-10 pr-2">
                      {item.subItems.map(subItem => (
                        <li key={subItem.path}>
                          <NavLink
                            to={subItem.path}
                            className={({ isActive }) =>
                              cn(
                                'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                                isActive
                                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200'
                                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                              )
                            }
                          >
                            <subItem.icon className="w-4 h-4" />
                            {subItem.label}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            }

            return (
              <li key={item.path}>
                <NavLink
                  to={item.path as string}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                    )
                  }
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};
