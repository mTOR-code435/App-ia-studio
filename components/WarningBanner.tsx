
import React from 'react';

interface WarningBannerProps {
  message: string;
  onDismiss: () => void;
  isError?: boolean;
}

const WarningBanner: React.FC<WarningBannerProps> = ({ message, onDismiss, isError = false }) => {
  const baseClasses = "border-l-4 p-4 rounded-md";
  const colorClasses = isError 
    ? "bg-red-100 border-red-500 text-red-700"
    : "bg-yellow-100 border-yellow-500 text-yellow-700";
  const iconColor = isError ? "text-red-500" : "text-yellow-500";
  const buttonHover = isError ? "hover:bg-red-200" : "hover:bg-yellow-200";
  const buttonColor = isError ? "text-red-600" : "text-yellow-600";
  const title = isError ? "Error Crítico" : "Advertencia Importante";

  return (
    <div className={`${baseClasses} ${colorClasses}`} role="alert">
      <div className="flex">
        <div className="py-1">
          <svg className={`fill-current h-6 w-6 ${iconColor} mr-4`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            {isError 
              ? <path d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zM9 11v-6h2v6H9zm0 4v-2h2v2H9z"/>
              : <path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zM9 5v6h2V5H9zm0 8v2h2v-2H9z"/>
            }
          </svg>
        </div>
        <div>
          <p className="font-bold">{title}</p>
          <p className="text-sm">{message}</p>
        </div>
        <div className="ml-auto pl-3">
          <button onClick={onDismiss} aria-label="Cerrar advertencia" className={`p-1 rounded-full ${buttonHover} transition-colors`}>
            <svg className={`fill-current h-6 w-6 ${buttonColor}`} role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Cerrar</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WarningBanner;
