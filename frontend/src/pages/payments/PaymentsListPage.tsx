import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePaymentsQuery } from '../../features/payments/payments.hooks';
import { DataTable, Column } from '../../components/table/DataTable';
import { Payment } from '../../features/payments/payments.types';
import { useDebounce } from '../../hooks/useDebounce';
import { Button } from '../../components/form/Button';
import { TextInput } from '../../components/form/TextInput';
import { ROUTES } from '../../constants';
import { PaymentStatusBadge } from './components/PaymentStatusBadge';

export const PaymentsListPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  
  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading, refetch } = usePaymentsQuery({
    page,
    limit: 10,
    q: debouncedSearch,
  });

  const columns: Column<Payment>[] = [
    { key: 'payment_number', header: 'Payment No', cell: (item) => (
      <Link to={`${ROUTES.PROTECTED.PAYMENTS}/${item.id}`} className="text-blue-600 hover:underline font-medium">
        {item.payment_number}
      </Link>
    )},
    { key: 'payment_date', header: 'Date', cell: (item) => new Date(item.payment_date).toLocaleDateString() },
    { key: 'party_name', header: 'Party', cell: (item) => item.party?.party_name || 'Unknown' },
    { key: 'amount', header: 'Amount', cell: (item) => `₹${Number(item.amount).toFixed(2)}` },
    { key: 'reference_number', header: 'Ref No', cell: (item) => item.reference_number },
    { key: 'status', header: 'Status', cell: (item) => <PaymentStatusBadge status={item.status} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payments</h1>
        <Link to={ROUTES.PROTECTED.PAYMENTS_CREATE}>
          <Button>Record Payment</Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-4 items-end mb-6 bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
        <div className="w-64">
          <TextInput
            placeholder="Search Payment No, Ref No..."
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
