import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSubmissionsQuery } from '../../features/submissions/submissions.hooks';
import { DataTable, Column } from '../../components/table/DataTable';
import { Submission } from '../../features/submissions/submissions.types';
import { useDebounce } from '../../hooks/useDebounce';
import { Button } from '../../components/form/Button';
import { TextInput } from '../../components/form/TextInput';
import { ROUTES } from '../../constants';
import { useAuth } from '../../hooks/useAuth';

export const SubmissionsListPage: React.FC = () => {
  const { hasRole } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  
  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading, refetch } = useSubmissionsQuery({
    page,
    limit: 10,
    q: debouncedSearch,
  });

  const columns: Column<Submission>[] = [
    { key: 'submission_number', header: 'Submission No', cell: (item) => (
      <Link to={`${ROUTES.PROTECTED.SUBMISSIONS}/${item.id}`} className="text-blue-600 hover:underline font-medium">
        {item.submission_number}
      </Link>
    )},
    { key: 'submission_date', header: 'Date', cell: (item) => new Date(item.submission_date).toLocaleDateString() },
    { key: 'party_name', header: 'Party', cell: (item) => item.party?.party_name || 'Unknown' },
    { key: 'bill_count', header: 'Total Bills', cell: (item) => item.submission_bills?.length || 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Submissions</h1>
        {!hasRole('CA') && (
          <Link to={ROUTES.PROTECTED.SUBMISSIONS_CREATE}>
            <Button>Create Submission</Button>
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-4 items-end mb-6 bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
        <div className="w-64">
          <TextInput
            placeholder="Search Submission No, Party..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>
      
      <div className="flex justify-end mb-4 -mt-2">
        <Button variant="outline" size="sm" onClick={() => refetch()}>Refresh Data</Button>
      </div>

      <DataTable
        columns={columns}
        data={data?.data?.data || []}
        isLoading={isLoading}
        page={data?.data?.meta?.page || 1}
        totalPages={data?.data?.meta?.totalPages || 1}
        onNextPage={() => setPage((p) => p + 1)}
        onPrevPage={() => setPage((p) => Math.max(1, p - 1))}
      />
    </div>
  );
};
