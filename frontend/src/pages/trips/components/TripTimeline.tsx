import React from 'react';
import { Trip } from '../../../features/trips/trips.types';

export const TripTimeline: React.FC<{ trip: Trip }> = ({ trip }) => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-800">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Trip Timeline</h3>
      <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-300 dark:before:via-gray-700 before:to-transparent">
        
        {/* Loading Date */}
        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
          <div className="flex items-center justify-center w-5 h-5 rounded-full border-4 border-white dark:border-gray-900 bg-blue-500 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2"></div>
          <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded shadow bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-1">
              <div className="font-bold text-gray-900 dark:text-gray-100">Loaded</div>
              <time className="text-xs font-medium text-gray-500">{new Date(trip.loading_date).toLocaleDateString()}</time>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">At {trip.from_city}</div>
          </div>
        </div>

        {/* Unloading Date */}
        {trip.unloading_date && (
          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-5 h-5 rounded-full border-4 border-white dark:border-gray-900 bg-green-500 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2"></div>
            <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded shadow bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-1">
                <div className="font-bold text-gray-900 dark:text-gray-100">Unloaded</div>
                <time className="text-xs font-medium text-gray-500">{new Date(trip.unloading_date).toLocaleDateString()}</time>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">At {trip.to_city}</div>
            </div>
          </div>
        )}

        {/* Status transition if needed can be mapped here, but we rely on explicit dates based on the prompt's instruction to only use returned dates */}
      </div>
    </div>
  );
};
