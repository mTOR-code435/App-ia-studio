
import React, { useState } from 'react';
import { type ReviewCard, type SynthesisMatrixData } from '../types';
import Loader from './Loader';
import MatrixDisplayTable from './MatrixDisplayTable';
import SelectionPicker from './SelectionPicker';
import { suggestThemesFromCards } from '../services/geminiService';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface SynthesisMatrixViewProps {
  allCards: ReviewCard[];
  selectedCardIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onGenerate: (themes: string[]) => void;
  isLoading: boolean;
  error: string | null;
  matrixData: SynthesisMatrixData | null;
  matrixThemes: string[];
}

const SynthesisMatrixView: React.FC<SynthesisMatrixViewProps> = ({
  allCards,
  selectedCardIds,
  onToggleSelection,
  onGenerate,
  isLoading,
  error,
  matrixData,
  matrixThemes,
}) => {
  const [themesInput, setThemesInput] = useLocalStorage<string>('matrix_themesInput', 'Metodología, Hallazgos Principales, Limitaciones');
  const [isSuggestingThemes, setIsSuggestingThemes] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);

  const selectedCards = allCards.filter(c => selectedCardIds.has(c.id));

  const handleGenerateClick = () => {
    const themes = themesInput.split(',').map(t => t.trim()).filter(Boolean);
    if (themes.length > 0) {
      onGenerate(themes);
    }
  };
  
  const handleSuggestThemes = async () => {
    if (selectedCards.length === 0) return;
    setIsSuggestingThemes(true);
    setSuggestionError(null);
    try {
      const suggestedThemes = await suggestThemesFromCards(selectedCards);
      setThemesInput(suggestedThemes.join(', '));
    } catch (err) {
      setSuggestionError(err instanceof Error ? err.message : 'Error al sugerir temas.');
    } finally {
      setIsSuggestingThemes(false);
    }
  };

  return (
    <div className="space-y-6">
      <SelectionPicker 
        allCards={allCards} 
        selectedCardIds={selectedCardIds} 
        onToggleSelection={onToggleSelection} 
        title="Fichas para Comparar"
      />

      <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
        <h3 className="text-xl font-bold text-slate-700">Generador de Matriz de Síntesis</h3>
        <p className="text-sm text-slate-500 mt-1">
          Compara los temas transversales entre las {selectedCardIds.size} fichas seleccionadas.
        </p>
        
        {selectedCardIds.size < 2 && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 text-amber-700 text-xs rounded-lg flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                Selecciona al menos 2 fichas arriba para realizar una comparación válida.
            </div>
        )}

        <div className="mt-4">
          <div className="flex justify-between items-center mb-1">
              <label htmlFor="themes" className="block text-sm font-medium text-slate-600">
                Temas (columnas) a comparar
              </label>
              <button
                onClick={handleSuggestThemes}
                disabled={isSuggestingThemes || isLoading || selectedCards.length === 0}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 disabled:opacity-50"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  {isSuggestingThemes ? 'Sugiriendo...' : 'Sugerir con IA'}
              </button>
          </div>
          <input
            type="text"
            id="themes"
            value={themesInput}
            onChange={(e) => setThemesInput(e.target.value)}
            className="w-full px-3 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            placeholder="Ej: Metodología, Hallazgos, Limitaciones"
            disabled={isLoading || isSuggestingThemes}
          />
          {suggestionError && <p className="mt-1 text-xs text-red-600">{suggestionError}</p>}
        </div>
        
        <button
          onClick={handleGenerateClick}
          disabled={isLoading || !themesInput.trim() || isSuggestingThemes || selectedCardIds.size < 2}
          className="mt-4 w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors duration-300 shadow-md"
        >
          {isLoading ? 'Analizando...' : 'Generar Matriz Académica'}
        </button>
      </div>

      {isLoading && <div className="mt-6"><Loader message="Gemini 3 Pro está realizando la síntesis transversal de las fuentes seleccionadas..." /></div>}
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-6" role="alert">{error}</div>}
      
      {matrixData && matrixThemes.length > 0 && (
        <MatrixDisplayTable
          matrixData={matrixData}
          themes={matrixThemes}
          selectedCards={selectedCards}
        />
      )}
    </div>
  );
};

export default SynthesisMatrixView;
