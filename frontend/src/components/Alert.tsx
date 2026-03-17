import React from 'react';
import { Info, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface AlertProps {
  type?: 'info' | 'warning' | 'success' | 'error';
  message: string;
  className?: string;
}

const Alert: React.FC<AlertProps> = ({ type = 'info', message, className = '' }) => {
  const styles = {
    info: 'bg-blue-50 text-blue-800 border-blue-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    success: 'bg-green-50 text-green-800 border-green-200',
    error: 'bg-red-50 text-red-800 border-red-200'
  };

  const icons = {
    info: <Info size={18} />,
    warning: <AlertCircle size={18} />,
    success: <CheckCircle size={18} />,
    error: <XCircle size={18} />
  };

  return (
    <div className={`flex items-center gap-3 p-4 rounded-lg border ${styles[type]} ${className}`}>
      {icons[type]}
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
};

export default Alert;
