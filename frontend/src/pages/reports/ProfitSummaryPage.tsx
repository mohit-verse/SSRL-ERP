import React, { useState } from 'react';
import { useProfitSummaryQuery } from '../../features/reports/reports.hooks';
import { TextInput } from '../../components/form/TextInput';
import { ExportButton } from './components/ExportButton';

export const ProfitSummaryPage: React.FC = () => {
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());

  const { data, isLoading } = useProfitSummaryQuery({ 
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profit Summary</h1>
          <p className="text-gray-500 dark:text-gray-400">Detailed profitability analysis of operations.</p>
        </div>
        <div className="flex gap-2">
          <ExportButton reportType="PROFIT_SUMMARY" format="EXCEL" filters={{ year, month }} />
          <ExportButton reportType="PROFIT_SUMMARY" format="PDF" filters={{ year, month }} />
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
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Freight Revenue</h3>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">₹{Number(summary.totalFreight).toFixed(2)}</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Operating Expenses</h3>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">₹{Number(summary.totalExpense).toFixed(2)}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 md:col-span-2">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Net Profit (Margin)</h3>
            <div className="flex items-end gap-4">
              <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">₹{Number(summary.profit).toFixed(2)}</p>
              <p className="text-lg font-semibold text-gray-500 dark:text-gray-400 mb-1">
                ({summary.totalFreight > 0 ? ((Number(summary.profit) / Number(summary.totalFreight)) * 100).toFixed(1) : 0}%)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
