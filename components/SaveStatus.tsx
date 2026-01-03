import React from 'react';

interface SaveStatusProps {
  isVisible: boolean;
}

const SaveStatus: React.FC<SaveStatusProps> = ({ isVisible }) => {
  return (
    <div className={`transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`} aria-live="polite">
      <div className="flex items-center text-sm text-green-600 bg-green-50 px-2 py-1 rounded-full">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        <span className="font-medium">Guardado</span>
      </div>
    </div>
  );
};

export default SaveStatus;
