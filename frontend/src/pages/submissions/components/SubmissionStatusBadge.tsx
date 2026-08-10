import React from 'react';

export const SubmissionStatusBadge: React.FC<{ status: 'INITIAL' | 'REISSUE' }> = ({ status }) => {
  let colorClass = 'bg-gray-100 text-gray-800';
  
  if (status === 'INITIAL') {
    colorClass = 'bg-blue-100 text-blue-800';
  } else if (status === 'REISSUE') {
    colorClass = 'bg-purple-100 text-purple-800';
  }

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${colorClass}`}>
      {status}
    </span>
  );
};
