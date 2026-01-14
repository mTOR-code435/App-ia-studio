
import React, { useState, useMemo } from 'react';
import { type ReviewCard, type FrameworkTopic, type FrameworkAnalysisItem, type CitationNetworkData } from '../types';
import Loader from './Loader';
import CitationNetworkAnalysis from './CitationNetworkAnalysis';

interface AIAnalysisViewProps {
  selectedCards: ReviewCard[];
  onGenerateConversation: (focusMode: 'integration' | 'debate' | 'methodological' | 'chronological' | 'pedagogical_critique', customInstructions: string) => void;
  isConversationLoading: boolean;
  conversationResult: string | null;
  conversationError: string | null;
  // Eliminadas props de preguntas de investigación
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
  researchFocus: { question: string; objectives: string };
}

const AIAnalysisView: React.FC<AIAnalysisViewProps> = ({
  selectedCards,
  onGenerateConversation,
  isConversationLoading,
  conversationResult,
  conversationError,
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
  researchFocus,
}) => {
  const [selectedTopic, setSelectedTopic] = useState<string>(
    theoreticalFramework.find(t => t.level === 1)?.title || theoreticalFramework[0]?.title || ''
  );
  const [writingFocus, setWritingFocus] = useState<'integration' | 'debate' | 'methodological' | 'chronological' | 'pedagogical_critique'>('integration');
  const [customInstructions, setCustomInstructions] = useState('');

  const cardMap = useMemo(() => new Map(selectedCards.map(card => [card.id, card])), [selectedCards]);

  const anyLoading = isConversationLoading || isFrameworkLoading || isProblemStatementLoading || isCitationNetworkLoading;
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
                                    <div className="mt-1 flex gap-2">
                                        <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{item.region}</span>
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

      {/* Academic Conversation Analysis (Renamed for clarity) */}
      <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 border-l-4 border-l-indigo-500">
        <h3 className="text-xl font-bold text-indigo-900">Redacción Narrativa y Análisis Crítico</h3>
        <p className="text-sm text-slate-600 mt-2">
            <strong>Objetivo:</strong> Generar un texto integrado que vincule lógicamente las evidencias seleccionadas.
        </p>
        
        {!researchFocus.question ? (
            <div className="bg-yellow-50 p-3 rounded text-sm text-yellow-700 mb-4 mt-4">
                ⚠️ Debes definir tu Pregunta de Investigación en la pestaña "Fichas de Evidencia" para que esta función opere con precisión académica.
            </div>
        ) : (
             <div className="text-xs text-indigo-600 mt-2 mb-4 bg-indigo-50 p-2 rounded">
                <strong>Enfoque de Investigación:</strong> {researchFocus.question}
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Enfoque de Análisis</label>
                <select 
                    value={writingFocus}
                    onChange={(e) => setWritingFocus(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="integration">Síntesis Conceptual (Estándar)</option>
                    <option value="debate">Contraste y Debate (Crítico)</option>
                    <option value="chronological">Evolución Histórica/Cronológica</option>
                    <option value="methodological">Comparación Metodológica</option>
                    <option value="pedagogical_critique" className="font-bold text-amber-700">🔍 Crítica: Replicación vs. Innovación</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-1">Define el hilo conductor que usará la IA.</p>
            </div>
             <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Instrucciones Adicionales (Opcional)</label>
                <textarea 
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    placeholder="Ej: Prioriza autores locales; usa un tono formal..."
                    rows={1}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-[42px]"
                />
            </div>
        </div>
        
        {/* Banner de Teoría Crítica (Se muestra solo si se selecciona la opción) */}
        {writingFocus === 'pedagogical_critique' && (
            <div className="mb-4 bg-amber-50 border border-amber-200 p-3 rounded-lg flex gap-3 animate-fade-in">
                 <div className="flex-shrink-0 pt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                 </div>
                 <div>
                     <h4 className="text-xs font-bold text-amber-800 uppercase">Lente Teórica Aplicada</h4>
                     <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                        Este análisis sostendrá la hipótesis de que, a pesar de los avances tecnológicos, <strong>la IA tiende a replicar modelos tradicionales (conductismo, cognitivismo)</strong> en lugar de innovar pedagógicamente. La IA buscará evidencia que confirme o refute esta tensión en tus fichas.
                     </p>
                 </div>
            </div>
        )}

        <button
          onClick={() => onGenerateConversation(writingFocus, customInstructions)}
          disabled={isMultiCardAnalysisDisabled || !researchFocus.question}
          className="w-full bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-800 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors duration-300 flex items-center justify-center shadow-md"
        >
          {isConversationLoading ? 'Analizando Evidencias...' : 'Ejecutar Análisis'}
        </button>
        
        {isConversationLoading && <div className="mt-4"><Loader message="La IA está integrando conceptos bajo el enfoque seleccionado..." /></div>}
        {conversationError && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4" role="alert">{conversationError}</div>}
        {conversationResult && !isConversationLoading && (
          <div className="mt-4 p-5 bg-white rounded-lg border border-slate-200 animate-fade-in shadow-sm">
            <h4 className="text-md font-bold text-indigo-800 mb-3 border-b border-slate-100 pb-2">Resultado del Análisis:</h4>
            <div className="text-slate-800 whitespace-pre-wrap leading-relaxed prose prose-sm max-w-none">
                {conversationResult}
            </div>
            <div className="mt-4 text-right">
                <button 
                    onClick={() => navigator.clipboard.writeText(conversationResult)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                >
                    Copiar al portapapeles
                </button>
            </div>
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
    </div>
  );
};

export default AIAnalysisView;
