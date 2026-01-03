import React, { useState } from 'react';
import { type ReviewCard, type SynthesisMatrixData } from '../types';
import Loader from './Loader';
import MatrixDisplayTable from './MatrixDisplayTable';
import { suggestThemesFromCards } from '../services/geminiService';

interface SynthesisMatrixViewProps {
  selectedCards: ReviewCard[];
  onGenerate: (themes: string[]) => void;
  isLoading: boolean;
  error: string | null;
  matrixData: SynthesisMatrixData | null;
  matrixThemes: string[];
}

const SynthesisMatrixView: React.FC<SynthesisMatrixViewProps> = ({
  selectedCards,
  onGenerate,
  isLoading,
  error,
  matrixData,
  matrixThemes,
}) => {
  const [themesInput, setThemesInput] = useState('Metodología, Hallazgos Principales, Limitaciones');
  const [isSuggestingThemes, setIsSuggestingThemes] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);

  const handleGenerateClick = () => {
    const themes = themesInput.split(',').map(t => t.trim()).filter(Boolean);
    if (themes.length > 0) {
      onGenerate(themes);
    }
  };
  
  const handleSuggestThemes = async () => {
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


  if (selectedCards.length < 2) {
    return (
      <div className="text-center py-12">
        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
        <h3 className="mt-2 text-lg font-medium text-slate-800">Selecciona Fichas para Comparar</h3>
        <p className="mt-1 text-sm text-slate-500">
          Ve a la pestaña "Fichas de Revisión" y selecciona al menos dos fichas para generar una matriz de síntesis.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
        <h3 className="text-xl font-bold text-slate-700">Generador de Matriz de Síntesis</h3>
        <p className="text-sm text-slate-500 mt-1">
          Define los temas (columnas) que quieres comparar entre las {selectedCards.length} fichas seleccionadas.
        </p>
        <div className="mt-4">
          <div className="flex justify-between items-center mb-1">
              <label htmlFor="themes" className="block text-sm font-medium text-slate-600">
                Temas (separados por comas)
              </label>
              <button
                onClick={handleSuggestThemes}
                disabled={isSuggestingThemes || isLoading}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  {isSuggestingThemes ? 'Sugiriendo...' : 'Sugerir Temas con IA'}
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
          disabled={isLoading || !themesInput.trim() || isSuggestingThemes}
          className="mt-4 w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors duration-300 flex items-center justify-center"
        >
          {isLoading ? 'Generando...' : 'Generar Matriz con IA'}
        </button>
      </div>

      {isLoading && <div className="mt-6"><Loader message="La IA está analizando las fichas y construyendo la matriz..." /></div>}
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