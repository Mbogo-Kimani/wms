import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isUp: boolean;
  };
  className?: string;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, trend, className = '', onClick }) => {
  return (
    <div 
      className={`card flex items-center justify-between ${className} ${onClick ? 'cursor-pointer hover:border-industrial-blue transition-all' : ''}`}
      onClick={onClick}
    >
      <div>
        <p className="text-industrial-gray font-medium text-sm mb-1">{label}</p>
        <p className="text-3xl font-bold text-industrial-slate">{value}</p>
        {trend && (
          <p className={`text-xs mt-2 font-semibold ${trend.isUp ? 'text-green-600' : 'text-red-500'}`}>
            {trend.value} <span className="text-gray-400 font-normal">vs last week</span>
          </p>
        )}
      </div>
      {icon && (
        <div className="bg-industrial-light p-4 rounded-xl text-industrial-blue">
          {icon}
        </div>
      )}
    </div>
  );
};

export default StatCard;
