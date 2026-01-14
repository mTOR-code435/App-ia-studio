
import React, { useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { type ReviewCard, type RelevanceResult } from '../types';

interface ReviewCardTableProps {
  cards: ReviewCard[];
  totalCards: number;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
  onLinkToTopic: (id: string) => void;
  selectedCardIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  relevanceData: Record<string, RelevanceResult>;
  onGenerateTopicFromSelection: () => void;
  isGeneratingTopic: boolean;
  searchTerm?: string;
}

type IconType = 'findings' | 'usage' | 'ethics' | 'quote' | 'conclusions' | 'concepts' | 'theory' | 'antecedents' | 'variables' | 'method' | 'discussion' | 'comparative' | 'challenges';

const Highlight: React.FC<{ text: string; highlight?: string }> = ({ text, highlight }) => {
    if (!highlight || !highlight.trim()) return <>{text}</>;
    const terms = highlight.trim().split(/\s+/).filter(t => t.length > 0).map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    if (terms.length === 0) return <>{text}</>;
    const regex = new RegExp(`(${terms.join('|')})`, 'gi');
    const parts = text.split(regex);
    return (
        <span>{parts.map((part, i) => regex.test(part) ? <mark key={i} className="bg-yellow-200 text-slate-900 rounded-sm px-0.5 font-medium">{part}</mark> : part)}</span>
    );
};

const SectionIcon: React.FC<{ type: IconType }> = ({ type }) => {
    switch (type) {
        case 'concepts': return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>;
        case 'theory': return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
        case 'antecedents': return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
        case 'variables': return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>;
        case 'method': return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
        case 'discussion': return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>;
        case 'findings': return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
        case 'usage': return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
        case 'ethics': return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 3c1.72 0 3.347.433 4.774 1.214m.334 14.854l.066.103a10.107 10.107 0 01-2.24 2.366" /></svg>;
        case 'quote': return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>;
        case 'conclusions': return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>;
        case 'comparative': return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>;
        case 'challenges': return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
    }
    return null;
};

const ReviewCardTable: React.FC<ReviewCardTableProps> = ({ cards, onEdit, onDelete, onView, selectedCardIds, onToggleSelection, onSelectAll, onClearSelection, relevanceData, searchTerm }) => {
  const [expandedCardIds, setExpandedCardIds] = useLocalStorage<string[]>('expanded_cards_state', []);
  const toggleExpansion = (id: string) => setExpandedCardIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  if (cards.length === 0) return (
    <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300">
        <h3 className="text-lg font-bold text-slate-800">No hay evidencias disponibles</h3>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Controles de Selección Masiva */}
      <div className="flex items-center justify-between bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={cards.length > 0 && selectedCardIds.size === cards.length}
                    onChange={(e) => e.target.checked ? onSelectAll() : onClearSelection()}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                  />
                  <span className="text-xs font-bold text-slate-600 uppercase">Seleccionar Todas ({selectedCardIds.size})</span>
              </label>
          </div>
          <div className="flex gap-2">
              <button 
                onClick={onClearSelection}
                className="text-[10px] font-bold text-slate-400 hover:text-red-500 uppercase transition-colors"
                disabled={selectedCardIds.size === 0}
              >
                  Limpiar Selección
              </button>
          </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {cards.map((card) => {
          const isExpanded = expandedCardIds.includes(card.id);
          const rel = relevanceData[card.id];
          const isSelected = selectedCardIds.has(card.id);

          return (
            <div key={card.id} className={`group bg-white rounded-2xl border transition-all ${isSelected ? 'ring-2 ring-indigo-500 shadow-md' : 'border-slate-200 hover:shadow-lg'}`}>
              <div className="p-5 flex items-start gap-4">
                  <input type="checkbox" checked={isSelected} onChange={() => onToggleSelection(card.id)} className="h-5 w-5 rounded border-slate-300 text-indigo-600 mt-1" />
                  <div className="flex-grow min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                              <Highlight text={card.participantRole} highlight={searchTerm} />
                          </span>
                          {rel && <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-green-100 text-green-700">Relevancia {rel.relevance}</span>}
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 leading-snug cursor-pointer hover:text-indigo-700" onClick={() => toggleExpansion(card.id)}>
                          <Highlight text={card.source} highlight={searchTerm} />
                      </h3>
                      <p className="text-sm font-medium text-slate-500 mt-1">
                          <Highlight text={card.topic} highlight={searchTerm} />
                      </p>
                  </div>
                  <div className="flex gap-1">
                      <button onClick={() => onView(card.id)} className="p-2 text-slate-400 hover:text-indigo-600" title="Ver Pantalla Completa"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>
                      <button onClick={() => onEdit(card.id)} className="p-2 text-slate-400 hover:text-slate-600" title="Editar"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                      <button onClick={() => onDelete(card.id)} className="p-2 text-slate-400 hover:text-red-600" title="Eliminar"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                  </div>
              </div>

              <div className="px-5 pb-5 ml-9">
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <p className="text-sm text-slate-600 italic leading-relaxed line-clamp-3">
                          <Highlight text={card.summary} highlight={searchTerm} />
                      </p>
                      <button onClick={() => toggleExpansion(card.id)} className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                          {isExpanded ? 'Ver menos detalles' : 'Ver análisis académico detallado'}
                          <svg className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 9l-7 7-7-7" /></svg>
                      </button>
                  </div>
              </div>

              {isExpanded && (
                  <div className="px-5 pb-6 ml-9 animate-view-change border-t border-slate-50 pt-5">
                      <div className="mb-8">
                          <div className="flex items-center gap-2 mb-4">
                              <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-widest">Análisis Académico & Teórico</h4>
                              <div className="flex-grow h-px bg-indigo-100"></div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="md:col-span-2">
                                  <Section blockTitle="Conclusiones del Artículo" icon="conclusions" content={card.conclusions} highlight={searchTerm} />
                              </div>
                              <Section blockTitle="Conceptos y Definiciones" icon="concepts" content={card.conceptsDefinitions} highlight={searchTerm} />
                              <Section blockTitle="Teorías de Sustento" icon="theory" content={card.theoreticalFoundation} highlight={searchTerm} />
                              <Section blockTitle="Antecedentes (Estado del Arte)" icon="antecedents" content={card.antecedents} highlight={searchTerm} />
                              <Section blockTitle="Dimensiones y Variables" icon="variables" content={card.dimensionsVariables} highlight={searchTerm} />
                              <Section blockTitle="Evidencia Metodológica" icon="method" content={card.methodologicalEvidence} highlight={searchTerm} />
                              <Section blockTitle="Discusión y Referencias" icon="discussion" content={card.discussionReferences} highlight={searchTerm} />
                          </div>
                      </div>
                      <div>
                          <div className="flex items-center gap-2 mb-4">
                              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Datos del Estudio de Caso (I.E. Nueva Granada)</h4>
                              <div className="flex-grow h-px bg-slate-200"></div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <Section blockTitle="Hallazgos Clave" icon="findings" content={card.keyFindings} highlight={searchTerm} />
                              <Section blockTitle="Uso Común vs Académico" icon="usage" content={card.usageDetails} highlight={searchTerm} />
                              <Section blockTitle="Notas Comparativas" icon="comparative" content={card.comparativeNotes} highlight={searchTerm} />
                              <Section blockTitle="Desafíos y Oportunidades" icon="challenges" content={card.challengesOpportunities} highlight={searchTerm} />
                              <Section blockTitle="Conocimiento y Ética" icon="ethics" content={card.contextualFactors} highlight={searchTerm} />
                              <div className="md:col-span-2">
                                  <Section blockTitle="Evidencia Directa / Citas" icon="quote" content={card.keyEvidence} highlight={searchTerm} />
                              </div>
                          </div>
                      </div>
                  </div>
              )}

              {card.tags && card.tags.length > 0 && (
                  <div className="px-5 pb-4 ml-9 flex flex-wrap gap-1.5">
                      {card.tags.slice(0, 5).map(tag => (
                          <span key={tag} className="px-2 py-0.5 bg-indigo-50 text-indigo-500 rounded text-[10px] font-bold border border-indigo-100">
                               <Highlight text={tag} highlight={searchTerm} />
                          </span>
                      ))}
                  </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Section: React.FC<{ blockTitle: string, content: string, icon: IconType, highlight?: string }> = ({ blockTitle, content, icon, highlight }) => (
    <div className="space-y-2 h-full flex flex-col">
        <h4 className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <span className="text-indigo-500"><SectionIcon type={icon} /></span>{blockTitle}
        </h4>
        <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-white border border-slate-100 p-3 rounded-xl flex-grow shadow-sm">
            {content ? <Highlight text={content} highlight={highlight} /> : <span className="text-slate-300 italic text-xs">Información no extraída o no disponible.</span>}
        </div>
    </div>
);

export default ReviewCardTable;
