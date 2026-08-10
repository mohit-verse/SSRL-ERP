import React from 'react';

type TripStatus = 'CREATED' | 'IN_PROGRESS' | 'DELIVERED' | 'POD_RECEIVED' | 'BILLED' | 'SUBMITTED' | 'PAYMENT_PENDING' | 'PAID' | 'CLOSED';

export const TripStatusBadge: React.FC<{ status: TripStatus }> = ({ status }) => {
  let colorClass = 'bg-gray-100 text-gray-800';
  
  switch (status) {
    case 'CREATED':
      colorClass = 'bg-blue-100 text-blue-800';
      break;
    case 'IN_PROGRESS':
      colorClass = 'bg-yellow-100 text-yellow-800';
      break;
    case 'DELIVERED':
      colorClass = 'bg-purple-100 text-purple-800';
      break;
    case 'POD_RECEIVED':
      colorClass = 'bg-indigo-100 text-indigo-800';
      break;
    case 'BILLED':
    case 'SUBMITTED':
      colorClass = 'bg-teal-100 text-teal-800';
      break;
    case 'PAYMENT_PENDING':
      colorClass = 'bg-orange-100 text-orange-800';
      break;
    case 'PAID':
    case 'CLOSED':
      colorClass = 'bg-green-100 text-green-800';
      break;
  }

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${colorClass}`}>
      {status.replace('_', ' ')}
    </span>
  );
};
