


import React, { useState, useMemo } from 'react';
import { type FrameworkTopic, type FrameworkAnalysisResult, type ReviewCard } from '../types';

interface ResearchFocusProps {
  focus: { question: string; objectives: string };
  setFocus: (focus: { question: string; objectives: string }) => void;
  onAnalyze: () => void;
  isLoading: boolean;
  progress: { processed: number; total: number } | null;
  error: string | null;
  // Framework props
  cards: ReviewCard[];
  onAnalyzeFramework: (topicId: string, topicTitle: string) => void;
  frameworkAnalysis: FrameworkAnalysisResult;
  frameworkLoadingStates: Record<string, boolean>;
  frameworkError: string | null;
  onViewCard: (cardId: string) => void;
  theoreticalFramework: FrameworkTopic[];
}

const ResearchFocus: React.FC<ResearchFocusProps> = ({ 
    focus, setFocus, onAnalyze, isLoading, progress, error,
    cards, onAnalyzeFramework, frameworkAnalysis, frameworkLoadingStates, frameworkError, onViewCard,
    theoreticalFramework
}) => {
  const [activeTab, setActiveTab] = useState<'framework' | 'general'>('framework');
  
  const isGeneralButtonDisabled = !focus.question.trim() || !focus.objectives.trim() || isLoading;
  
  const cardMap = useMemo(() => new Map(cards.map(card => [card.id, card])), [cards]);

  const renderTopic = (topic: FrameworkTopic) => {
    const isLoading = frameworkLoadingStates[topic.id];
    let results = frameworkAnalysis[topic.id];
    
     // Sort results by relevanceScore if they exist
    if (results) {
        results = [...results].sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
    }

    return (
      <div 
        key={topic.id} 
        style={{ marginLeft: `${topic.level * 24}px` }} 
        className="py-3 border-b border-slate-200 last:border-b-0"
      >
        <div className="flex justify-between items-center">
            <p className={`flex-1 text-slate-800 ${topic.level === 0 ? 'font-bold' : ''}`}>{topic.title}</p>
            <button
                onClick={() => onAnalyzeFramework(topic.id, topic.title)}
                disabled={isLoading || cards.length === 0}
                className="ml-4 flex-shrink-0 text-xs bg-indigo-100 text-indigo-700 font-semibold hover:bg-indigo-200 px-3 py-1 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? (
                  <svg className="animate-spin h-4 w-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : 'Analizar'}
            </button>
        </div>
        {results && results.length > 0 && (
          <div className="mt-3 space-y-2 pl-4 border-l-2 border-indigo-200">
            {results.map(item => {
              const card = cardMap.get(item.cardId);
              if (!card) return null;
              return (
                <div key={item.cardId} className="p-2 bg-indigo-50 rounded-md">
                  <div className="flex justify-between items-start">
                      <button onClick={() => onViewCard(card.id)} className="font-bold text-indigo-700 hover:underline text-left">
                        {card.source || card.topic || 'Ficha sin título'}
                      </button>
                      <span className="flex-shrink-0 font-bold text-indigo-800 bg-indigo-200 px-2.5 py-1 rounded-full text-xs" title={`Puntaje de relevancia: ${item.relevanceScore} de 10`}>
                        {item.relevanceScore}/10
                      </span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{item.justification}</p>
                </div>
              );
            })}
          </div>
        )}
         {results && results.length === 0 && !isLoading && (
            <p className="mt-2 text-sm text-slate-500 pl-4">No se encontraron fichas relevantes para este tema.</p>
         )}
      </div>
    );
  };

  return (
    <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-6">
      <div className="border-b border-slate-200 -mx-6 px-6 mb-4">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
            <button onClick={() => setActiveTab('framework')} className={`${activeTab === 'framework' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>
                Análisis por Marco Teórico
            </button>
            <button onClick={() => setActiveTab('general')} className={`${activeTab === 'general' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>
                Análisis General
            </button>
        </nav>
      </div>

      {activeTab === 'general' && (
        <div className="animate-view-change">
          <h3 className="text-xl font-bold text-slate-700">Enfoque de Investigación General</h3>
          <p className="text-sm text-slate-500 mt-1 mb-4">
            Define tu pregunta y objetivos para que la IA pueda analizar la relevancia de cada ficha para tu estudio.
          </p>
          <div className="space-y-4">
            <div>
              <label htmlFor="research-question" className="block text-sm font-medium text-slate-600 mb-1">
                Pregunta de Investigación Principal
              </label>
              <textarea
                id="research-question"
                rows={2}
                value={focus.question}
                onChange={(e) => setFocus({ ...focus, question: e.target.value })}
                className="w-full px-3 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                placeholder="Ej: ¿Cuáles son las prácticas y percepciones del uso de IA en docentes de secundaria...?"
              />
            </div>
            <div>
              <label htmlFor="research-objectives" className="block text-sm font-medium text-slate-600 mb-1">
                Objetivos Específicos
              </label>
              <textarea
                id="research-objectives"
                rows={3}
                value={focus.objectives}
                onChange={(e) => setFocus({ ...focus, objectives: e.target.value })}
                className="w-full px-3 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                placeholder="Ej: 1. Describir las prácticas de uso. 2. Analizar las percepciones de los docentes. 3. Comparar entre instituciones públicas y privadas."
              />
            </div>
          </div>
          <button
            onClick={onAnalyze}
            disabled={isGeneralButtonDisabled}
            className="mt-4 w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors duration-300 flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {progress ? `Analizando ${progress.processed} de ${progress.total}...` : 'Analizando...'}
              </>
            ) : 'Analizar Relevancia General con IA'}
          </button>
          {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-800 p-4 rounded-md mt-4" role="alert"><p className="font-bold">Error en el Análisis</p><p>{error}</p></div>}
        </div>
      )}
      
      {activeTab === 'framework' && (
        <div className="animate-view-change">
            <h3 className="text-xl font-bold text-slate-700">Análisis por Marco Teórico</h3>
            <p className="text-sm text-slate-500 mt-1 mb-4">
                Analiza tus fichas en función de cada punto de tu marco teórico para encontrar la evidencia más relevante.
            </p>
            {frameworkError && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-800 p-4 rounded-md mb-4" role="alert">
                    <p className="font-bold">Error en el Análisis del Tema</p>
                    <p>{frameworkError}</p>
                </div>
            )}
            <div className="mt-4 border-t border-slate-200">
                {theoreticalFramework.map(topic => renderTopic(topic))}
            </div>
        </div>
      )}
    </div>
  );
};

export default ResearchFocus;