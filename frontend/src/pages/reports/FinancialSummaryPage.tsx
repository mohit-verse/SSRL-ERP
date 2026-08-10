import React, { useState } from 'react';
import { useFinancialSummaryQuery } from '../../features/reports/reports.hooks';
import { TextInput } from '../../components/form/TextInput';
import { ExportButton } from './components/ExportButton';

export const FinancialSummaryPage: React.FC = () => {
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());

  const { data, isLoading } = useFinancialSummaryQuery({ 
    year: Number(year), 
    month: Number(month) 
  }, { 
    enabled: year.length === 4 && parseInt(month) >= 1 && parseInt(month) <= 12 
  });

  const summary = data?.data;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Financial Summary</h1>
          <p className="text-gray-500 dark:text-gray-400">High-level revenue and expense summaries for a given period.</p>
        </div>
        <div className="flex gap-2">
          <ExportButton reportType="FINANCIAL_SUMMARY" format="EXCEL" filters={{ year, month }} />
          <ExportButton reportType="FINANCIAL_SUMMARY" format="PDF" filters={{ year, month }} />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 flex flex-wrap gap-4 items-end">
        <div className="w-32">
          <TextInput label="Year" value={year} onChange={(e) => setYear(e.target.value)} />
        </div>
        <div className="w-32">
          <TextInput label="Month (1-12)" value={month} onChange={(e) => setMonth(e.target.value)} />
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-gray-500">Loading Summary...</div>
      ) : !summary ? (
        <div className="p-8 text-center text-gray-500">No data available for this period.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Revenue</h3>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">₹{Number(summary.revenue).toFixed(2)}</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Expenses</h3>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">₹{Number(summary.expenses).toFixed(2)}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Outstanding</h3>
            <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">₹{Number(summary.outstanding).toFixed(2)}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Net Profit</h3>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">₹{Number(summary.profit).toFixed(2)}</p>
          </div>
        </div>
      )}
    </div>
  );
};
