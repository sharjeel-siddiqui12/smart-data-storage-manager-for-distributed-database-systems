import React from 'react';

const StatusBadge = ({ status, className = '' }) => {
  // Updated status styling to handle CRITICAL status correctly
  let statusClasses = '';
  
  switch (status?.toUpperCase()) {
    case 'HEALTHY':
      statusClasses = 'bg-gradient-to-r from-success-500 to-success-600 text-white ring-success-200';
      break;
    case 'WARNING':
      statusClasses = 'bg-gradient-to-r from-primary-400 to-primary-500 text-white ring-primary-200';
      break;
    case 'DEGRADED':
      statusClasses = 'bg-gradient-to-r from-warning-400 to-warning-500 text-white ring-warning-200';
      break;
    case 'CRITICAL': // Added explicit handling for CRITICAL status
      statusClasses = 'bg-gradient-to-r from-danger-600 to-danger-700 text-white ring-danger-300 pulse-alert';
      break;
    case 'FAILING':
      statusClasses = 'bg-gradient-to-r from-danger-500 to-danger-600 text-white ring-danger-200';
      break;
    case 'FAILED':
      statusClasses = 'bg-gradient-to-r from-danger-700 to-danger-800 text-white ring-danger-300';
      break;
    case 'MAINTENANCE':
      statusClasses = 'bg-gradient-to-r from-secondary-500 to-secondary-600 text-white ring-secondary-200';
      break;
    case 'ACTIVE':
      statusClasses = 'bg-gradient-to-r from-success-500 to-success-600 text-white ring-success-200';
      break;
    case 'REDISTRIBUTING':
      statusClasses = 'bg-gradient-to-r from-primary-500 to-primary-600 text-white ring-primary-200';
      break;
    case 'CORRUPTED':
      statusClasses = 'bg-gradient-to-r from-danger-500 to-danger-600 text-white ring-danger-200';
      break;
    default:
      statusClasses = 'bg-gradient-to-r from-slate-500 to-slate-600 text-white ring-slate-200';
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium shadow-sm ring-1 ring-opacity-50 ${statusClasses} ${className}`}
    >
      {status}
    </span>
  );
};

export default StatusBadge;