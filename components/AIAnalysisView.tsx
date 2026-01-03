import React, { useState, useMemo } from 'react';
import { type ReviewCard, type FrameworkTopic, type FrameworkAnalysisItem, type CitationNetworkData } from '../types';
import Loader from './Loader';
import CitationNetworkAnalysis from './CitationNetworkAnalysis';

interface AIAnalysisViewProps {
  selectedCards: ReviewCard[];
  onGenerateConversation: () => void;
  isConversationLoading: boolean;
  conversationResult: string | null;
  conversationError: string | null;
  onGenerateQuestions: () => void;
  isQuestionsLoading: boolean;
  questionsResult: string[] | null;
  questionsError: string | null;
  onGenerateProblemStatement: () => void;
  isProblemStatementLoading: boolean;
  problemStatementResult: string | null;
  problemStatementError: string | null;
  theoreticalFramework: FrameworkTopic[];
  onAnalyzeFramework: (topicTitle: string) => void;
  isFrameworkLoading: boolean;
  frameworkResult: FrameworkAnalysisItem[] | null;
  frameworkError: string | null;
  onViewCard: (cardId: string) => void;
  onGenerateCitationNetwork: () => void;
  isCitationNetworkLoading: boolean;
  citationNetworkResult: CitationNetworkData | null;
  citationNetworkError: string | null;
}

const AIAnalysisView: React.FC<AIAnalysisViewProps> = ({
  selectedCards,
  onGenerateConversation,
  isConversationLoading,
  conversationResult,
  conversationError,
  onGenerateQuestions,
  isQuestionsLoading,
  questionsResult,
  questionsError,
  onGenerateProblemStatement,
  isProblemStatementLoading,
  problemStatementResult,
  problemStatementError,
  theoreticalFramework,
  onAnalyzeFramework,
  isFrameworkLoading,
  frameworkResult,
  frameworkError,
  onViewCard,
  onGenerateCitationNetwork,
  isCitationNetworkLoading,
  citationNetworkResult,
  citationNetworkError,
}) => {
  const [selectedTopic, setSelectedTopic] = useState<string>(
    theoreticalFramework.find(t => t.level === 1)?.title || theoreticalFramework[0]?.title || ''
  );

  const cardMap = useMemo(() => new Map(selectedCards.map(card => [card.id, card])), [selectedCards]);

  const anyLoading = isConversationLoading || isQuestionsLoading || isFrameworkLoading || isProblemStatementLoading || isCitationNetworkLoading;
  const isMultiCardAnalysisDisabled = selectedCards.length < 2 || anyLoading;
  const isFrameworkAnalysisDisabled = selectedCards.length < 1 || anyLoading;

  if (selectedCards.length === 0) {
    return (
      <div className="text-center py-12">
        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h3 className="mt-2 text-lg font-medium text-slate-800">Selecciona Fichas para Analizar</h3>
        <p className="mt-1 text-sm text-slate-500">
          Ve a la pestaña "Fichas de Evidencia" y selecciona al menos una ficha para usar las herramientas de análisis de IA.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
       {/* Framework Analysis */}
      <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
        <h3 className="text-xl font-bold text-slate-700">Análisis por Marco Teórico</h3>
        <p className="text-sm text-slate-500 mt-1">
          Analiza las {selectedCards.length} fichas seleccionadas para encontrar la evidencia más relevante para un punto específico de tu marco teórico.
        </p>
        <div className="mt-4">
          <label htmlFor="framework-topic-select" className="block text-sm font-medium text-slate-600 mb-1">
            Selecciona un Tema del Marco Teórico
          </label>
          <select
            id="framework-topic-select"
            value={selectedTopic}
            onChange={e => setSelectedTopic(e.target.value)}
            disabled={isFrameworkAnalysisDisabled}
            className="w-full px-3 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition disabled:opacity-50"
          >
            {theoreticalFramework.map(topic => (
              <option key={topic.id} value={topic.title} style={{ paddingLeft: `${topic.level * 10}px` }}>
                {topic.title}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => onAnalyzeFramework(selectedTopic)}
          disabled={isFrameworkAnalysisDisabled || !selectedTopic}
          className="mt-4 w-full bg-teal-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors duration-300 flex items-center justify-center"
        >
          {isFrameworkLoading ? 'Analizando Tema...' : 'Analizar Tema Seleccionado'}
        </button>

        {isFrameworkLoading && <div className="mt-4"><Loader message="La IA está evaluando la relevancia de las fichas para este tema..." /></div>}
        {frameworkError && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4" role="alert">{frameworkError}</div>}
        {frameworkResult && !isFrameworkLoading && (
            <div className="mt-4 animate-fade-in">
                {frameworkResult.length > 0 ? (
                    <div className="space-y-3">
                        {frameworkResult.map(item => {
                            const card = cardMap.get(item.cardId);
                            if (!card) return null;
                            return (
                                <div key={item.cardId} className="p-3 bg-white border border-slate-200 rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <button onClick={() => onViewCard(card.id)} className="font-bold text-teal-700 hover:underline text-left text-md">
                                            {card.source}
                                        </button>
                                        <span className="flex-shrink-0 font-bold text-teal-800 bg-teal-200 px-2.5 py-1 rounded-full text-xs" title={`Puntaje de relevancia: ${item.relevanceScore} de 10`}>
                                            {item.relevanceScore}/10
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600 mt-1">{item.justification}</p>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-center text-sm text-slate-500 mt-4 py-4">No se encontraron fichas relevantes para este tema en tu selección.</p>
                )}
            </div>
        )}
      </div>

      {/* Citation Network Analysis */}
      <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
        <h3 className="text-xl font-bold text-slate-700">Análisis de Red de Citas</h3>
        <p className="text-sm text-slate-500 mt-1">
          La IA identificará citas entre tus fichas y las obras externas más influyentes. Se requieren al menos 2 fichas.
        </p>
        <button
          onClick={onGenerateCitationNetwork}
          disabled={isMultiCardAnalysisDisabled}
          className="mt-4 w-full bg-fuchsia-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-fuchsia-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors duration-300 flex items-center justify-center"
        >
          {isCitationNetworkLoading ? 'Generando Red...' : 'Analizar Red de Citas'}
        </button>
        
        {isCitationNetworkLoading && <div className="mt-4"><Loader message="La IA está analizando las conexiones entre documentos..." /></div>}
        {citationNetworkError && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4" role="alert">{citationNetworkError}</div>}
        {citationNetworkResult && !isCitationNetworkLoading && (
          <CitationNetworkAnalysis data={citationNetworkResult} cards={selectedCards} />
        )}
      </div>

       {/* Problem Statement Generator */}
      <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
        <h3 className="text-xl font-bold text-slate-700">Planteamiento del Problema</h3>
        <p className="text-sm text-slate-500 mt-1">
          La IA identificará deficiencias en el conocimiento actual y sugerirá nuevas perspectivas para orientar el estudio. Se requieren al menos 2 fichas.
        </p>
        <button
          onClick={onGenerateProblemStatement}
          disabled={isMultiCardAnalysisDisabled}
          className="mt-4 w-full bg-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-purple-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors duration-300 flex items-center justify-center"
        >
          {isProblemStatementLoading ? 'Generando...' : 'Construir Planteamiento del Problema'}
        </button>
        
        {isProblemStatementLoading && <div className="mt-4"><Loader message="La IA está analizando las brechas en el conocimiento..." /></div>}
        {problemStatementError && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4" role="alert">{problemStatementError}</div>}
        {problemStatementResult && !isProblemStatementLoading && (
          <div className="mt-4 p-4 bg-white rounded-lg border border-slate-200 animate-fade-in">
            <h4 className="text-md font-semibold text-purple-700 mb-2">Propuesta de Planteamiento del Problema:</h4>
            {problemStatementResult.split('\n\n').map((paragraph, index) => {
              if (paragraph.startsWith('### ')) {
                return <h5 key={index} className="text-lg font-bold text-slate-700 mt-4 mb-2">{paragraph.replace('### ', '')}</h5>;
              }
              return <p key={index} className="text-slate-700 whitespace-pre-wrap">{paragraph}</p>;
            })}
          </div>
        )}
      </div>

      {/* Academic Conversation Analysis */}
      <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
        <h3 className="text-xl font-bold text-slate-700">Análisis de "Conversación de Evidencias"</h3>
        <p className="text-sm text-slate-500 mt-1">
          La IA generará un párrafo sintetizando cómo las {selectedCards.length} evidencias seleccionadas dialogan entre sí. Se requieren al menos 2 fichas.
        </p>
        <button
          onClick={onGenerateConversation}
          disabled={isMultiCardAnalysisDisabled}
          className="mt-4 w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors duration-300 flex items-center justify-center"
        >
          {isConversationLoading ? 'Analizando...' : 'Analizar Conversación de Evidencias'}
        </button>
        
        {isConversationLoading && <div className="mt-4"><Loader message="La IA está sintetizando el diálogo entre las evidencias..." /></div>}
        {conversationError && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4" role="alert">{conversationError}</div>}
        {conversationResult && !isConversationLoading && (
          <div className="mt-4 p-4 bg-white rounded-lg border border-slate-200 animate-fade-in">
            <h4 className="text-md font-semibold text-indigo-700 mb-2">Resultado del Análisis:</h4>
            <p className="text-slate-700 whitespace-pre-wrap">{conversationResult}</p>
          </div>
        )}
      </div>

      {/* Research Question Generator */}
      <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
        <h3 className="text-xl font-bold text-slate-700">Generador de Preguntas de Investigación Futuras</h3>
        <p className="text-sm text-slate-500 mt-1">
          La IA analizará las tensiones y hallazgos de las evidencias para sugerir nuevas áreas de investigación. Se requieren al menos 2 fichas.
        </p>
        <button
          onClick={onGenerateQuestions}
          disabled={isMultiCardAnalysisDisabled}
          className="mt-4 w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors duration-300 flex items-center justify-center"
        >
          {isQuestionsLoading ? 'Generando...' : 'Sugerir Preguntas Futuras'}
        </button>
        
        {isQuestionsLoading && <div className="mt-4"><Loader message="La IA está buscando tensiones y áreas de oportunidad..." /></div>}
        {questionsError && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4" role="alert">{questionsError}</div>}
        {questionsResult && !isQuestionsLoading && (
          <div className="mt-4 p-4 bg-white rounded-lg border border-slate-200 animate-fade-in">
            <h4 className="text-md font-semibold text-green-700 mb-2">Sugerencias de Preguntas:</h4>
            <ul className="list-disc list-inside space-y-2 text-slate-700">
              {questionsResult.map((q, index) => <li key={index}>{q}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAnalysisView;