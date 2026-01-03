import React from 'react';
import { type ReviewCard } from '../types';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';

interface ExportButtonsProps {
  cards: ReviewCard[];
  onExportJSON: () => void;
  onImportJSON: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const ExportButtons: React.FC<ExportButtonsProps> = ({ cards, onExportJSON, onImportJSON }) => {
  const handleExportCSV = () => {
    exportToCSV(cards, 'revision-literatura.csv');
  };

  const handleExportPDF = () => {
    exportToPDF(cards, 'Revisión de Literatura');
  };

  const isDisabled = cards.length === 0;

  return (
    <div className="flex flex-wrap gap-2">
        {/* Backup and Restore */}
        <div className="flex rounded-md shadow-sm">
            <label
                htmlFor="import-json-backup"
                className="cursor-pointer relative inline-flex items-center px-4 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 focus:z-10 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            >
                Importar JSON
            </label>
            <input id="import-json-backup" type="file" className="hidden" accept=".json" onChange={onImportJSON} />
            <button
                type="button"
                onClick={onExportJSON}
                disabled={isDisabled}
                className="-ml-px relative inline-flex items-center px-4 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 focus:z-10 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
            >
                Exportar JSON
            </button>
        </div>
         {/* Standard Exports */}
        <div className="flex rounded-md shadow-sm">
            <button
                onClick={handleExportCSV}
                disabled={isDisabled}
                className="relative inline-flex items-center px-4 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 focus:z-10 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
            >
                Exportar CSV
            </button>
            <button
                onClick={handleExportPDF}
                disabled={isDisabled}
                className="-ml-px relative inline-flex items-center px-4 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 focus:z-10 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
            >
                Exportar PDF
            </button>
        </div>
    </div>
  );
};

export default ExportButtons;