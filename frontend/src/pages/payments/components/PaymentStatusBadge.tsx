import React from 'react';

export const PaymentStatusBadge: React.FC<{ status: 'COMPLETED' | 'CANCELLED' }> = ({ status }) => {
  let colorClass = 'bg-gray-100 text-gray-800';
  
  if (status === 'COMPLETED') {
    colorClass = 'bg-green-100 text-green-800';
  } else if (status === 'CANCELLED') {
    colorClass = 'bg-red-100 text-red-800';
  }

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${colorClass}`}>
      {status}
    </span>
  );
};
