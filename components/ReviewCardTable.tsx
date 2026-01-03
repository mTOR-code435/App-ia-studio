
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
  relevanceData: Record<string, RelevanceResult>;
  onGenerateTopicFromSelection: () => void;
  isGeneratingTopic: boolean;
}

const SectionIcon: React.FC<{ type: 'findings' | 'usage' | 'ethics' | 'quote' | 'conclusions' }> = ({ type }) => {
    switch (type) {
        case 'findings': return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
        case 'usage': return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
        case 'ethics': return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 3c1.72 0 3.347.433 4.774 1.214m.334 14.854l.066.103a10.107 10.107 0 01-2.24 2.366" /></svg>;
        case 'quote': return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>;
        case 'conclusions': return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>;
    }
};

const ReviewCardTable: React.FC<ReviewCardTableProps> = ({ cards, onEdit, onDelete, onView, onLinkToTopic, selectedCardIds, onToggleSelection, relevanceData }) => {
  const [expandedCardIds, setExpandedCardIds] = useLocalStorage<string[]>('expanded_cards_state', []);
  const toggleExpansion = (id: string) => setExpandedCardIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  if (cards.length === 0) return (
    <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300">
        <h3 className="text-lg font-bold text-slate-800">No hay evidencias disponibles</h3>
    </div>
  );

  return (
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
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-100 text-slate-700">{card.participantRole}</span>
                        {rel && <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-green-100 text-green-700">Relevancia {rel.relevance}</span>}
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 leading-snug cursor-pointer" onClick={() => toggleExpansion(card.id)}>{card.source}</h3>
                    <p className="text-sm font-medium text-slate-500 mt-1">{card.topic}</p>
                </div>
                <div className="flex gap-1">
                    <button onClick={() => onView(card.id)} className="p-2 text-slate-400 hover:text-indigo-600"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>
                    <button onClick={() => onEdit(card.id)} className="p-2 text-slate-400 hover:text-slate-600"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                    <button onClick={() => onDelete(card.id)} className="p-2 text-slate-400 hover:text-red-600"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                </div>
            </div>

            <div className="px-5 pb-5 ml-9">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <p className="text-sm text-slate-600 italic leading-relaxed line-clamp-3">{card.summary}</p>
                    <button onClick={() => toggleExpansion(card.id)} className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                        {isExpanded ? 'Ver menos' : 'Ver conclusiones y detalles'}
                        <svg className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 9l-7 7-7-7" /></svg>
                    </button>
                </div>
            </div>

            {isExpanded && (
                <div className="px-5 pb-6 ml-9 grid grid-cols-1 md:grid-cols-2 gap-6 animate-view-change border-t border-slate-50 pt-5">
                    <div className="space-y-4 md:col-span-2">
                        <Section blockTitle="Conclusiones del Artículo" icon="conclusions" content={card.conclusions} />
                    </div>
                    <div className="space-y-4">
                        <Section blockTitle="Hallazgos Clave" icon="findings" content={card.keyFindings} />
                        <Section blockTitle="Uso Común vs Académico" icon="usage" content={card.usageDetails} />
                    </div>
                    <div className="space-y-4">
                        <Section blockTitle="Conocimiento y Ética" icon="ethics" content={card.contextualFactors} />
                        <Section blockTitle="Evidencia Directa" icon="quote" content={card.keyEvidence} />
                    </div>
                </div>
            )}

            {card.tags && card.tags.length > 0 && (
                <div className="px-5 pb-4 ml-9 flex flex-wrap gap-1.5">
                    {card.tags.slice(0, 5).map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-indigo-50 text-indigo-500 rounded text-[10px] font-bold border border-indigo-100">{tag}</span>
                    ))}
                    {card.tags.length > 5 && <span className="text-[10px] text-slate-400 pt-1">+{card.tags.length - 5} más</span>}
                </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const Section: React.FC<{ blockTitle: string, content: string, icon: 'findings' | 'usage' | 'ethics' | 'quote' | 'conclusions' }> = ({ blockTitle, content, icon }) => (
    <div className="space-y-2">
        <h4 className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <span className="text-indigo-500"><SectionIcon type={icon} /></span>{blockTitle}
        </h4>
        <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-white border border-slate-100 p-3 rounded-xl">
            {content || <span className="text-slate-300 italic">No disponible.</span>}
        </div>
    </div>
);

export default ReviewCardTable;
