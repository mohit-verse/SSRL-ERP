import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTripQuery, useAddTripExpenseMutation } from '../../features/trips/trips.hooks';
import { Button } from '../../components/form/Button';
import { TripStatusBadge } from './components/TripStatusBadge';
import { TripFinancialSummary } from './components/TripFinancialSummary';
import { TripTimeline } from './components/TripTimeline';
import { TripDocumentSection } from './components/TripDocumentSection';
import { TripExpenseForm } from './components/TripExpenseForm';
import { Dialog } from '../../components/ui/Dialog';
import { ROUTES } from '../../constants';
import { toast } from 'sonner';

export const TripDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: response, isLoading } = useTripQuery(id!);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const expenseMutation = useAddTripExpenseMutation();

  if (isLoading) return <div>Loading...</div>;
  if (!response?.data) return <div>Trip not found.</div>;

  const trip = response.data;

  const handleAddExpense = (data: any) => {
    expenseMutation.mutate({ id: id!, data }, {
      onSuccess: () => {
        toast.success('Expense added successfully');
        setIsExpenseModalOpen(false);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to add expense');
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            Trip {trip.trip_number}
            <TripStatusBadge status={trip.status} />
            {trip.deleted_at && <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded font-medium">Deleted</span>}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {trip.from_city} → {trip.to_city} | {new Date(trip.loading_date).toLocaleDateString()}
          </p>
        </div>
        
        <div className="flex gap-2">
          {trip.vehicle_type === 'OWN_FLEET' && (
            <Button variant="outline" onClick={() => setIsExpenseModalOpen(true)}>
              Add Expense
            </Button>
          )}
          <Link to={`${ROUTES.PROTECTED.TRIPS}/${trip.id}/edit`}>
            <Button>Edit Trip</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          
          <TripFinancialSummary trip={trip} />

          {/* Core Info */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Trip Information</h3>
            <div className="grid grid-cols-2 gap-y-4 gap-x-6">
              <div>
                <p className="text-sm text-gray-500">Party</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{trip.party?.party_name}</p>
                <p className="text-xs text-gray-400">{trip.party?.party_type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Vehicle</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{trip.vehicle_number}</p>
                <p className="text-xs text-gray-400">{trip.vehicle_type.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Driver Mobile</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{trip.driver_mobile}</p>
              </div>
              {trip.vehicle_type === 'EXTERNAL' && (
                <div>
                  <p className="text-sm text-gray-500">Vehicle Owner</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {trip.vehicle_owner_name || 'N/A'} {trip.vehicle_owner_mobile ? `(${trip.vehicle_owner_mobile})` : ''}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Freight Rate</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">₹{trip.freight_rate.toFixed(2)}</p>
              </div>
              {trip.vehicle_rate && (
                <div>
                  <p className="text-sm text-gray-500">Vehicle Rate</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">₹{trip.vehicle_rate.toFixed(2)}</p>
                </div>
              )}
              {trip.weight && (
                <div>
                  <p className="text-sm text-gray-500">Weight</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{trip.weight} MT</p>
                </div>
              )}
              {trip.lr_number && (
                <div>
                  <p className="text-sm text-gray-500">LR Number</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{trip.lr_number}</p>
                </div>
              )}
              {trip.remarks && (
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Remarks</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{trip.remarks}</p>
                </div>
              )}
            </div>
          </div>

          <TripDocumentSection tripId={trip.id} />

        </div>

        {/* Right Column */}
        <div className="space-y-6">
          
          <TripTimeline trip={trip} />
          
          {/* Expenses */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Expenses</h3>
            {!trip.expenses || trip.expenses.length === 0 ? (
              <p className="text-sm text-gray-500">No expenses recorded.</p>
            ) : (
              <ul className="space-y-3">
                {trip.expenses.map(exp => (
                  <li key={exp.id} className="flex justify-between items-start border-b border-gray-100 dark:border-gray-800 pb-2 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{exp.expense_type.replace('_', ' ')}</p>
                      <p className="text-xs text-gray-500">{new Date(exp.expense_date).toLocaleDateString()} {exp.remarks ? `- ${exp.remarks}` : ''}</p>
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">₹{exp.amount.toFixed(2)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
        </div>
      </div>

      <Dialog isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} title="Add Trip Expense">
        <TripExpenseForm 
          onSubmit={handleAddExpense} 
          isLoading={expenseMutation.isPending} 
          onCancel={() => setIsExpenseModalOpen(false)}
        />
      </Dialog>
    </div>
  );
};
