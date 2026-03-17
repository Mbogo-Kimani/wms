import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}

const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral' }) => {
  const styles = {
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-industrial-blue',
    neutral: 'bg-gray-100 text-gray-700'
  };

  return (
    <span className={`badge ${styles[variant]}`}>
      {children}
    </span>
  );
};

export default Badge;
