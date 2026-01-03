import React from 'react';
import { type ReviewCard } from '../types';
import { type SynthesisMatrixData } from '../types';

interface MatrixDisplayTableProps {
  matrixData: SynthesisMatrixData;
  themes: string[];
  selectedCards: ReviewCard[];
}

const MatrixDisplayTable: React.FC<MatrixDisplayTableProps> = ({ matrixData, themes, selectedCards }) => {
  return (
    <div className="overflow-x-auto border border-slate-200 rounded-lg mt-6">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th scope="col" className="sticky left-0 bg-slate-100 z-10 px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider shadow-sm">
              Fuente
            </th>
            {themes.map(theme => (
              <th key={theme} scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                {theme}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {selectedCards.map(card => (
            <tr key={card.id}>
              <th scope="row" className="sticky left-0 bg-white z-10 px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 shadow-sm">
                {card.source || card.topic || 'Ficha sin título'}
              </th>
              {themes.map(theme => {
                const cellData = matrixData[card.id]?.[theme];
                const summary = cellData?.summary || '...';
                const justification = cellData?.justification;
                const hasJustification = justification && justification.trim() && justification.trim().toLowerCase() !== 'n/a' && justification.trim().toLowerCase() !== 'no aplica';

                return (
                  <td key={theme} className="px-6 py-4 whitespace-pre-wrap text-sm text-slate-600 align-top">
                    <div className={hasJustification ? 'tooltip' : ''}>
                      {summary}
                      {hasJustification && (
                          <span className="tooltip-text">
                              <strong>Justificación:</strong> {justification}
                          </span>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MatrixDisplayTable;
