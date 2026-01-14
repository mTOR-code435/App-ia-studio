
import React from 'react';
import { type ReviewCard } from '../types';

interface SelectionPickerProps {
  allCards: ReviewCard[];
  selectedCardIds: Set<string>;
  onToggleSelection: (id: string) => void;
  title?: string;
}

const SelectionPicker: React.FC<SelectionPickerProps> = ({ allCards, selectedCardIds, onToggleSelection, title = "Fuentes para Análisis" }) => {
  if (allCards.length === 0) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm mb-6">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
          <svg className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
          {title} ({selectedCardIds.size})
        </h3>
        <span className="text-[10px] text-slate-400 font-medium">Haz clic para incluir/excluir en el análisis</span>
      </div>
      
      <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
        {allCards.map(card => {
          const isSelected = selectedCardIds.has(card.id);
          return (
            <button
              key={card.id}
              onClick={() => onToggleSelection(card.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                isSelected 
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' 
                  : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-slate-50'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : 'bg-slate-300'}`}></div>
              <span className="truncate max-w-[150px]">{card.source}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SelectionPicker;
