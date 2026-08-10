import React from 'react';

export const BillStatusBadge: React.FC<{ status: 'GENERATED' | 'SUBMITTED' | 'CANCELLED' }> = ({ status }) => {
  let colorClass = 'bg-gray-100 text-gray-800';
  
  switch (status) {
    case 'GENERATED':
      colorClass = 'bg-blue-100 text-blue-800';
      break;
    case 'SUBMITTED':
      colorClass = 'bg-green-100 text-green-800';
      break;
    case 'CANCELLED':
      colorClass = 'bg-red-100 text-red-800';
      break;
  }

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${colorClass}`}>
      {status}
    </span>
  );
};
