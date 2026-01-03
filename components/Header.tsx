import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 md:px-8 py-6">
        <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-600 rounded-full text-white">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
            </div>
            <div>
                 <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Estudio de Caso IA: I.E. Nueva Granada</h1>
                 <p className="text-slate-500">Caracterización del uso académico y común de IA por docentes y estudiantes.</p>
            </div>
        </div>
      </div>
    </header>
  );
};

export default Header;