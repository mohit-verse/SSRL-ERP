import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useBillsQuery } from '../../features/billing/billing.hooks';
import { DataTable, Column } from '../../components/table/DataTable';
import { Bill } from '../../features/billing/billing.types';
import { useDebounce } from '../../hooks/useDebounce';
import { Button } from '../../components/form/Button';
import { ROUTES } from '../../constants';
import { BillFilters } from './components/BillFilters';
import { BillStatusBadge } from './components/BillStatusBadge';
import { useAuth } from '../../hooks/useAuth';

export const BillsListPage: React.FC = () => {
  const { hasRole } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  
  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading, refetch } = useBillsQuery({
    page,
    limit: 10,
    q: debouncedSearch,
  });

  const columns: Column<Bill>[] = [
    { key: 'bill_number', header: 'Bill No', cell: (item) => (
      <Link to={`${ROUTES.PROTECTED.BILLS}/${item.id}`} className="text-blue-600 hover:underline font-medium">
        {item.bill_number}
      </Link>
    )},
    { key: 'bill_date', header: 'Date', cell: (item) => new Date(item.bill_date).toLocaleDateString() },
    { key: 'party_name', header: 'Party', cell: (item) => item.party_name_snapshot },
    { key: 'bill_type', header: 'Type', cell: (item) => item.bill_type },
    { key: 'total_amount', header: 'Amount', cell: (item) => `₹${Number(item.total_amount).toFixed(2)}` },
    { key: 'status', header: 'Status', cell: (item) => <BillStatusBadge status={item.status} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bills</h1>
        {!hasRole('CA') && (
          <Link to={ROUTES.PROTECTED.BILLING}>
            <Button>Generate New Bill</Button>
          </Link>
        )}
      </div>

      <BillFilters 
        search={search}
        onSearchChange={(val) => { setSearch(val); setPage(1); }}
      />
      
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
