
import React, { useMemo, useState } from 'react';
import { type CitationNetworkData, type ReviewCard } from '../types';
import { runLibrarianAgent } from '../services/geminiService';

interface CitationNetworkAnalysisProps {
  data: CitationNetworkData;
  cards: ReviewCard[];
}

const CitationNetworkAnalysis: React.FC<CitationNetworkAnalysisProps> = ({ data, cards }) => {
  const cardMap = useMemo(() => {
    return new Map(cards.map(card => [card.id, card.source]));
  }, [cards]);

  const { internalCitations, seminalWorks } = data;
  
  // Local state for verification to avoid full re-renders of parent
  const [works, setWorks] = useState(seminalWorks);
  const [verifyingIndex, setVerifyingIndex] = useState<number | null>(null);

  const handleVerify = async (index: number) => {
      if (verifyingIndex !== null) return;
      setVerifyingIndex(index);
      const work = works[index];
      
      const result = await runLibrarianAgent(work.work);
      
      const newWorks = [...works];
      newWorks[index] = {
          ...work,
          verificationStatus: result.status as any,
          verificationUrl: result.url,
          verificationNote: result.note
      };
      setWorks(newWorks);
      setVerifyingIndex(null);
  };

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

      {/* Seminal Works with Librarian Agent */}
      <div>
        <div className="flex items-center gap-2 mb-3">
             <h4 className="text-md font-semibold text-fuchsia-700">Obras Externas (Trabajos Seminales)</h4>
             <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold uppercase rounded-full flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                Agente Bibliotecario Disponible
             </span>
        </div>
        
        {works.length > 0 ? (
          <ol className="list-decimal list-inside space-y-3 text-slate-800">
            {works.map((work, index) => (
              <li key={index} className="text-sm p-3 rounded-md bg-slate-50 border border-slate-100 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                    <span className="flex-1 pr-4 font-medium">{work.work}</span>
                    <span className="flex-shrink-0 font-bold text-fuchsia-800 bg-fuchsia-100 px-2.5 py-1 rounded-full text-xs">
                    {work.count} {work.count > 1 ? 'citas' : 'cita'}
                    </span>
                </div>
                
                {/* Verification UI */}
                <div className="flex items-center gap-2 mt-1">
                    {!work.verificationStatus && (
                        <button 
                            onClick={() => handleVerify(index)}
                            disabled={verifyingIndex !== null}
                            className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold disabled:opacity-50"
                        >
                            {verifyingIndex === index ? (
                                <><svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Verificando...</>
                            ) : (
                                <>🔍 Verificar Existencia (Google Grounding)</>
                            )}
                        </button>
                    )}
                    
                    {work.verificationStatus === 'verified' && (
                        <div className="flex items-center gap-2 text-xs">
                            <span className="text-green-600 font-bold flex items-center gap-1">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                Verificado
                            </span>
                            {work.verificationUrl && (
                                <a href={work.verificationUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline truncate max-w-[200px]">
                                    Fuente Detectada
                                </a>
                            )}
                        </div>
                    )}
                    
                    {work.verificationStatus === 'not_found' && (
                         <span className="text-red-500 font-bold text-xs flex items-center gap-1">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            No encontrado en fuentes académicas
                        </span>
                    )}
                    
                     {work.verificationStatus === 'unverified' && (
                         <span className="text-amber-500 font-bold text-xs">No se pudo verificar (Error)</span>
                    )}
                </div>
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
