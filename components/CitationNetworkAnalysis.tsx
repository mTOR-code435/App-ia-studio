import React, { useMemo } from 'react';
import { type CitationNetworkData, type ReviewCard } from '../types';

interface CitationNetworkAnalysisProps {
  data: CitationNetworkData;
  cards: ReviewCard[];
}

const CitationNetworkAnalysis: React.FC<CitationNetworkAnalysisProps> = ({ data, cards }) => {
  const cardMap = useMemo(() => {
    return new Map(cards.map(card => [card.id, card.source]));
  }, [cards]);

  const { internalCitations, seminalWorks } = data;

  return (
    <div className="mt-4 p-4 bg-white rounded-lg border border-slate-200 animate-fade-in space-y-6">
      {/* Internal Citations */}
      <div>
        <h4 className="text-md font-semibold text-fuchsia-700 mb-3">Citas Internas</h4>
        {internalCitations.length > 0 ? (
          <ul className="space-y-2">
            {internalCitations.map((citation, index) => {
              const sourceRef = cardMap.get(citation.citingCardId) || `ID: ${citation.citingCardId}`;
              const targetRef = cardMap.get(citation.citedCardId) || `ID: ${citation.citedCardId}`;
              return (
                <li key={index} className="flex items-center text-sm text-slate-700 bg-slate-50 p-2 rounded-md">
                  <span className="font-medium text-indigo-600">{sourceRef}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mx-2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                  <span className="font-medium text-teal-600">{targetRef}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No se encontraron citas directas entre las fichas seleccionadas.</p>
        )}
      </div>

      {/* Seminal Works */}
      <div>
        <h4 className="text-md font-semibold text-fuchsia-700 mb-3">Obras Externas Más Citadas (Trabajos Seminales)</h4>
        {seminalWorks.length > 0 ? (
          <ol className="list-decimal list-inside space-y-2 text-slate-800">
            {seminalWorks.map((work, index) => (
              <li key={index} className="text-sm p-2 rounded-md flex justify-between items-center bg-slate-50">
                <span className="flex-1 pr-4">{work.work}</span>
                <span className="flex-shrink-0 font-bold text-fuchsia-800 bg-fuchsia-100 px-2.5 py-1 rounded-full text-xs">
                  {work.count} {work.count > 1 ? 'citas' : 'cita'}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-slate-500">No se identificaron obras externas citadas con frecuencia en este conjunto.</p>
        )}
      </div>
    </div>
  );
};

export default CitationNetworkAnalysis;