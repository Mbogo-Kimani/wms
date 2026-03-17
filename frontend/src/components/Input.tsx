import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-semibold text-industrial-slate mb-1.5 ml-1">{label}</label>}
      <input 
        className={`input-field ${error ? 'border-red-500 focus:ring-red-500' : ''} ${className}`} 
        {...props} 
      />
      {error && <p className="text-red-500 text-xs mt-1 ml-1">{error}</p>}
    </div>
  );
};

export default Input;
