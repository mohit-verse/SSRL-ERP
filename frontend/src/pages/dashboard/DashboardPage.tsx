import React from 'react';
import { useDashboardQuery } from '../../features/dashboard/dashboard.hooks';
import { Button } from '../../components/form/Button';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants';

export const DashboardPage: React.FC = () => {
  const { data, isLoading, isError, refetch } = useDashboardQuery();

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading Dashboard...</div>;
  if (isError) return <div className="p-8 text-center text-red-500">Failed to load Dashboard data.</div>;

  const dashboard = data?.data;
  if (!dashboard) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <Button variant="outline" size="sm" onClick={() => refetch()}>Refresh Data</Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Monthly Revenue</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">₹{Number(dashboard.kpiCards.monthlyRevenue).toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Monthly Expense</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">₹{Number(dashboard.kpiCards.monthlyExpense).toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Monthly Profit</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">₹{Number(dashboard.kpiCards.monthlyProfit).toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Outstanding</p>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">₹{Number(dashboard.kpiCards.totalOutstanding).toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Today's Trips</h2>
            {dashboard.todaysTrips && dashboard.todaysTrips.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                    <tr>
                      <th className="px-4 py-2 font-semibold">Trip No</th>
                      <th className="px-4 py-2 font-semibold">Party</th>
                      <th className="px-4 py-2 font-semibold">Vehicle</th>
                      <th className="px-4 py-2 font-semibold">Route</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {dashboard.todaysTrips.map((trip: any) => (
                      <tr key={trip.id}>
                        <td className="px-4 py-2 font-medium">{trip.trip_number}</td>
                        <td className="px-4 py-2">{trip.party?.party_name}</td>
                        <td className="px-4 py-2">{trip.vehicle_number}</td>
                        <td className="px-4 py-2 text-gray-500">{trip.from_city} → {trip.to_city}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No trips recorded today.</p>
            )}
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Pending PODs</h2>
            {dashboard.pendingPOD && dashboard.pendingPOD.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                    <tr>
                      <th className="px-4 py-2 font-semibold">Trip No</th>
                      <th className="px-4 py-2 font-semibold">Date</th>
                      <th className="px-4 py-2 font-semibold">Vehicle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {dashboard.pendingPOD.slice(0, 5).map((trip: any) => (
                      <tr key={trip.id}>
                        <td className="px-4 py-2 font-medium">{trip.trip_number}</td>
                        <td className="px-4 py-2">{new Date(trip.loading_date).toLocaleDateString()}</td>
                        <td className="px-4 py-2">{trip.vehicle_number}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {dashboard.pendingPOD.length > 5 && (
                  <div className="mt-3 text-right">
                    <Link to={`${ROUTES.PROTECTED.REPORTS}/pending-pod`} className="text-sm text-blue-600 hover:underline">
                      View all {dashboard.pendingPOD.length} pending...
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No pending PODs.</p>
            )}
          </div>
        </div>

        {/* Sidebar Area */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
            {dashboard.recentActivity && dashboard.recentActivity.length > 0 ? (
              <ul className="space-y-4">
                {dashboard.recentActivity.map((log: any) => (
                  <li key={log.id} className="text-sm">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{log.action}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{log.description}</p>
                    <p className="text-gray-400 text-xs mt-1">
                      {new Date(log.created_at).toLocaleString()} by {log.user?.username || 'System'}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No recent activity.</p>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Action Items</h2>
            <div className="space-y-3">
              <Link to={ROUTES.PROTECTED.SUBMISSIONS_CREATE} className="block p-3 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border border-blue-100 dark:border-blue-800/50 hover:bg-blue-100 transition-colors">
                <div className="font-semibold">Bills Pending Submission</div>
                <div className="text-xs mt-1">Create Submission Packages</div>
              </Link>
              <Link to={ROUTES.PROTECTED.PAYMENTS_CREATE} className="block p-3 rounded bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-100 dark:border-green-800/50 hover:bg-green-100 transition-colors">
                <div className="font-semibold">Outstanding Payments</div>
                <div className="text-xs mt-1">Record Receipts & Allocate</div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
