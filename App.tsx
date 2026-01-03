
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { type ReviewCard, type ReviewCardData, type SynthesisMatrixData, type RelevanceResult, type FrameworkAnalysisResult, type FrameworkTopic, type FrameworkAnalysisItem, type CitationNetworkData } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { extractTextFromPdf } from './utils/pdfUtils';
import { 
    extractInfoFromText, 
    generateSynthesisMatrix,
    generateAcademicConversation,
    generateResearchQuestions,
    analyzeCardRelevance,
    analyzeFrameworkRelevance,
    generateProblemStatement,
    generateTopicFromCards,
    generateCitationNetwork
} from './services/geminiService';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import DataForm from './components/DataForm';
import ReviewCardTable from './components/ReviewCardTable';
import Loader from './components/Loader';
import ExportButtons from './components/ExportButtons';
import SynthesisMatrixView from './components/SynthesisMatrixView';
import AIAnalysisView from './components/AIAnalysisView';
import SaveStatus from './components/SaveStatus';
import WarningBanner from './components/WarningBanner';
import ResearchFocus from './components/ResearchFocus';
import ReviewCardModal from './components/ReviewCardModal';
import TheoreticalFrameworkGuide from './components/TheoreticalFrameworkGuide';
import LinkToTopicModal from './components/LinkToTopicModal';

const EMPTY_CARD: ReviewCardData = {
  source: '',
  topic: '',
  participantRole: 'Docente',
  evidenceType: '',
  keyFindings: '',
  usageDetails: '',
  summary: '',
  conclusions: '',
  comparativeNotes: '',
  challengesOpportunities: '',
  contextualFactors: '',
  keyEvidence: '',
  tags: '',
  fullText: '',
};

const SUGGESTED_FRAMEWORK_TEMPLATE: FrameworkTopic[] = [
    { id: '1', title: '1. La Inteligencia Artificial en el Contexto Educativo', level: 0, description: 'Bases conceptuales sobre IA en educación.' },
    { id: '1_1', title: '1.1. Definición y tipologías de herramientas de IA relevantes', level: 1, parentId: '1' },
    { id: '2', title: '2. Caracterización del Uso de la IA (Uso Común vs. Académico)', level: 0, description: 'Responde al Objetivo Específico 2.' },
    { id: '2_1', title: '2.1. Uso Común vs. Académico en Docentes', level: 1, parentId: '2' },
    { id: '2_2', title: '2.2. Uso Común vs. Académico en Estudiantes', level: 1, parentId: '2' },
    { id: '3', title: '3. Conocimiento Tecnológico y Pedagógico (TPACK)', level: 0 },
    { id: '4', title: '4. Dimensión Ética y Percepción del Riesgo', level: 0 }
];

const INITIAL_RESEARCH_FOCUS = {
    question: '¿Cuál es la condición de uso académico y común de la IA en la I.E. Nueva Granada?',
    objectives: '1. Identificar herramientas. 2. Describir frecuencia. 3. Establecer nivel TPACK. 4. Contrastar percepciones éticas.'
};

function App() {
  const [cards, setCards, cardsError] = useLocalStorage<ReviewCard[]>('reviewCards', []);
  const [currentCardData, setCurrentCardData, currentCardError] = useLocalStorage<ReviewCardData>('currentCardData', EMPTY_CARD);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'default' | 'relevance'>('default');
  const [relevanceFilter, setRelevanceFilter] = useState<string>('all');
  const [evidenceTypeFilter, setEvidenceTypeFilter] = useState<string>('all');
  
  // UI States
  const [isInputPanelOpen, setIsInputPanelOpen] = useState<boolean>(false);
  const [viewingCard, setViewingCard] = useState<ReviewCard | null>(null);
  const [activeView, setActiveView] = useState<'cards' | 'matrix' | 'analysis' | 'framework'>('cards');
  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set());
  
  // Data states
  const [matrixData, setMatrixData] = useState<SynthesisMatrixData | null>(null);
  const [matrixThemes, setMatrixThemes] = useState<string[]>([]);
  const [isMatrixLoading, setIsMatrixLoading] = useState(false);
  const [matrixError, setMatrixError] = useState<string | null>(null);
  const [conversationResult, setConversationResult] = useState<string | null>(null);
  const [isConversationLoading, setIsConversationLoading] = useState(false);
  const [questionsResult, setQuestionsResult] = useState<string[] | null>(null);
  const [isQuestionsLoading, setIsQuestionsLoading] = useState(false);
  const [problemStatementResult, setProblemStatementResult] = useState<string | null>(null);
  const [isProblemStatementLoading, setIsProblemStatementLoading] = useState(false);
  const [citationNetworkResult, setCitationNetworkResult] = useState<CitationNetworkData | null>(null);
  const [isCitationNetworkLoading, setIsCitationNetworkLoading] = useState(false);
  const [isSaveStatusVisible, setSaveStatusVisible] = useState(false);
  const isInitialMount = useRef(true);

  // Success message state
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Analysis states
  const [researchFocus, setResearchFocus] = useLocalStorage('researchFocus', INITIAL_RESEARCH_FOCUS);
  const [relevanceData, setRelevanceData] = useLocalStorage<Record<string, RelevanceResult>>('relevanceData', {});
  const [isRelevanceLoading, setIsRelevanceLoading] = useState(false);
  const [relevanceError, setRelevanceError] = useState<string | null>(null);
  const [relevanceAnalysisProgress, setRelevanceAnalysisProgress] = useState<{ processed: number; total: number } | null>(null);
  
  // Framework states
  const [frameworkTopics, setFrameworkTopics] = useLocalStorage<FrameworkTopic[]>('frameworkTopics', SUGGESTED_FRAMEWORK_TEMPLATE);
  const [frameworkAnalysis, setFrameworkAnalysis] = useLocalStorage<FrameworkAnalysisResult>('frameworkAnalysis', {});
  const [frameworkLoadingStates, setFrameworkLoadingStates] = useState<Record<string, boolean>>({});
  const [frameworkError, setFrameworkError] = useState<string | null>(null);
  const [linkingCardId, setLinkingCardId] = useState<string | null>(null);
  const [isTopicFromCardsLoading, setIsTopicFromCardsLoading] = useState(false);

  useEffect(() => {
    if (isInitialMount.current) { isInitialMount.current = false; return; }
    setSaveStatusVisible(true);
    const timer = setTimeout(() => setSaveStatusVisible(false), 2000);
    return () => clearTimeout(timer);
  }, [cards]);

  const handleProcessPDF = useCallback(async (file: File) => {
    setIsLoading(true);
    setLoadingMessage('Iniciando proceso...');
    setError(null);
    try {
      setLoadingMessage('Extrayendo texto del PDF...');
      const text = await extractTextFromPdf(file);
      const onProgress = (msg: string) => setLoadingMessage(msg);
      const extractedData = await extractInfoFromText(text, onProgress);
      if (extractedData) {
        setCurrentCardData({ ...extractedData, fullText: text });
        setIsInputPanelOpen(true); 
      } else {
        throw new Error('La IA no pudo extraer los datos.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [setCurrentCardData]);

  const handleDataChange = (field: keyof ReviewCardData, value: string) => {
    setCurrentCardData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddOrUpdateCard = () => {
    const tagsArray = currentCardData.tags.split(',').map(tag => tag.trim()).filter(Boolean);
    if (editingId) {
      setCards(cards.map(card => card.id === editingId ? { ...currentCardData, tags: tagsArray, id: editingId } : card));
      setEditingId(null);
    } else {
      const newCard: ReviewCard = { ...currentCardData, tags: tagsArray, id: Date.now().toString() };
      setCards([...cards, newCard]);
    }
    setCurrentCardData(EMPTY_CARD);
    setIsInputPanelOpen(false);
    setSuccessMessage(editingId ? "Ficha actualizada correctamente." : "Nueva ficha añadida.");
  };

  const handleEditCard = (id: string) => {
    const cardToEdit = cards.find(card => card.id === id);
    if (cardToEdit) {
      setEditingId(id);
      const { id: cardId, tags, ...data } = cardToEdit;
      setCurrentCardData({ ...data, tags: (tags || []).join(', ') });
      setIsInputPanelOpen(true);
      setActiveView('cards');
    }
  };

  const handleDeleteCard = (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar esta ficha?')) {
        setCards(cards.filter(card => card.id !== id));
        setSelectedCardIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
  };

  const handleExportJSON = () => {
    const projectBackup = {
        cards,
        researchFocus,
        frameworkTopics,
        frameworkAnalysis,
        relevanceData,
        exportDate: new Date().toISOString(),
        version: "2.0"
    };
    const dataStr = JSON.stringify(projectBackup, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `respaldo_proyecto_ia_${new Date().toISOString().slice(0,10)}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const rawContent = e.target?.result as string;
        const json = JSON.parse(rawContent);
        
        if (json && typeof json === 'object' && !Array.isArray(json) && json.cards) {
            if (Array.isArray(json.cards)) {
                setCards(json.cards);
                if (json.researchFocus) setResearchFocus(json.researchFocus);
                if (json.frameworkTopics) setFrameworkTopics(json.frameworkTopics);
                if (json.frameworkAnalysis) setFrameworkAnalysis(json.frameworkAnalysis);
                if (json.relevanceData) setRelevanceData(json.relevanceData);
                setSuccessMessage("Proyecto completo restaurado correctamente.");
                setError(null);
            } else {
                setError("El archivo contiene un objeto pero la sección de fichas no es válida.");
            }
            return;
        }

        if (Array.isArray(json)) {
          setCards(json);
          setSuccessMessage("Fichas importadas correctamente.");
          setError(null);
        } else {
          setError("El archivo JSON no tiene un formato reconocido (se esperaba un array de fichas o un respaldo de proyecto).");
        }
      } catch (err) {
        setError("Error crítico: El archivo no es un JSON válido.");
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const filteredAndSortedCards = useMemo(() => {
    let processed = [...cards];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      processed = processed.filter(c => 
        [c.source, c.topic, c.summary].join(' ').toLowerCase().includes(term)
      );
    }
    if (evidenceTypeFilter !== 'all') processed = processed.filter(c => c.evidenceType === evidenceTypeFilter);
    if (relevanceFilter !== 'all') processed = processed.filter(c => relevanceData[c.id]?.relevance === relevanceFilter);
    
    if (sortOrder === 'relevance') {
      return processed.sort((a, b) => (relevanceData[b.id]?.relevanceScore || 0) - (relevanceData[a.id]?.relevanceScore || 0));
    }
    return processed.sort((a, b) => b.id.localeCompare(a.id));
  }, [cards, searchTerm, sortOrder, relevanceData, relevanceFilter, evidenceTypeFilter]);

  const handleAnalyzeRelevance = async () => {
    setIsRelevanceLoading(true);
    setRelevanceError(null);
    try {
        let current = { ...relevanceData };
        for (let i = 0; i < cards.length; i++) {
            setRelevanceAnalysisProgress({ processed: i + 1, total: cards.length });
            const result = await analyzeCardRelevance(cards[i], researchFocus.question, researchFocus.objectives);
            current[cards[i].id] = result;
            setRelevanceData({ ...current });
            if (i < cards.length - 1) await new Promise(r => setTimeout(r, 1000));
        }
        setSortOrder('relevance');
    } catch (err) { setRelevanceError("Error analizando relevancia."); }
    finally { setIsRelevanceLoading(false); setRelevanceAnalysisProgress(null); }
  };

  const handleGenerateMatrix = async (themes: string[]) => {
    if (selectedCardIds.size < 2) return;
    setIsMatrixLoading(true);
    try {
        const flat = await generateSynthesisMatrix(cards.filter(c => selectedCardIds.has(c.id)), themes);
        const nested: SynthesisMatrixData = {};
        flat.forEach(i => { if (!nested[i.cardId]) nested[i.cardId] = {}; nested[i.cardId][i.theme] = { summary: i.summary, justification: i.justification }; });
        setMatrixData(nested);
        setMatrixThemes(themes);
    } catch (e) { setMatrixError("Error en matriz."); }
    finally { setIsMatrixLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />
      
      {/* Action Bar (Work Context) */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 md:px-8 py-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
              <nav className="flex bg-slate-100 p-1 rounded-lg">
                  {[
                      { id: 'cards', label: 'Evidencias', count: cards.length },
                      { id: 'framework', label: 'Marco Teórico' },
                      { id: 'matrix', label: 'Matriz', count: selectedCardIds.size },
                      { id: 'analysis', label: 'Análisis IA' }
                  ].map(tab => (
                      <button 
                        key={tab.id}
                        onClick={() => setActiveView(tab.id as any)}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeView === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                          {tab.label} {tab.count !== undefined && <span className="ml-1 opacity-60">({tab.count})</span>}
                      </button>
                  ))}
              </nav>
              <SaveStatus isVisible={isSaveStatusVisible} />
          </div>
          
          <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsInputPanelOpen(true)}
                className="bg-indigo-600 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-indigo-700 shadow-sm transition-all flex items-center gap-2"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                  Añadir Evidencia
              </button>
              <ExportButtons cards={cards} onExportJSON={handleExportJSON} onImportJSON={handleImportJSON} />
          </div>
      </div>

      <main className="flex-grow relative overflow-hidden flex">
          {/* Main Content Area */}
          <div className="flex-grow overflow-y-auto p-4 md:p-8">
              <div className="max-w-6xl mx-auto">
                  {error && (
                      <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl relative flex items-center justify-between animate-fade-in shadow-sm">
                          <div className="flex items-center gap-3">
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              <span className="text-sm font-medium">{error}</span>
                          </div>
                          <button onClick={() => setError(null)} className="text-red-900 hover:bg-red-100 p-1 rounded-lg">&times;</button>
                      </div>
                  )}
                  {successMessage && (
                      <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl relative flex items-center justify-between animate-fade-in shadow-sm">
                          <div className="flex items-center gap-3">
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                              <span className="text-sm font-medium">{successMessage}</span>
                          </div>
                          <button onClick={() => setSuccessMessage(null)} className="text-emerald-900 hover:bg-emerald-100 p-1 rounded-lg">&times;</button>
                      </div>
                  )}

                  {activeView === 'cards' && (
                    <div className="animate-view-change space-y-6">
                        <ResearchFocus 
                            focus={researchFocus} setFocus={setResearchFocus} 
                            onAnalyze={handleAnalyzeRelevance} isLoading={isRelevanceLoading}
                            progress={relevanceAnalysisProgress} error={relevanceError}
                            cards={cards} theoreticalFramework={frameworkTopics}
                            frameworkAnalysis={frameworkAnalysis} frameworkLoadingStates={frameworkLoadingStates}
                            onAnalyzeFramework={() => {}} onViewCard={setViewingCard}
                        />
                        <div className="flex flex-col md:flex-row gap-4 mb-6">
                            <div className="relative flex-grow">
                                <input 
                                    type="text" 
                                    placeholder="Filtrar por fuente, tema o etiquetas..." 
                                    value={searchTerm} 
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                />
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </div>
                            <select 
                                value={sortOrder} 
                                onChange={(e) => setSortOrder(e.target.value as any)}
                                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none"
                            >
                                <option value="default">Más Recientes</option>
                                <option value="relevance">Por Relevancia</option>
                            </select>
                        </div>
                        <ReviewCardTable 
                            cards={filteredAndSortedCards} totalCards={cards.length}
                            onEdit={handleEditCard} onDelete={handleDeleteCard}
                            onView={setViewingCard} onLinkToTopic={setLinkingCardId}
                            selectedCardIds={selectedCardIds} onToggleSelection={(id) => setSelectedCardIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; })}
                            relevanceData={relevanceData} onGenerateTopicFromSelection={() => {}} isGeneratingTopic={false}
                        />
                    </div>
                  )}

                  {activeView === 'framework' && (
                      <TheoreticalFrameworkGuide 
                        cards={cards} topics={frameworkTopics} setTopics={setFrameworkTopics}
                        linkedEvidence={frameworkAnalysis} setLinkedEvidence={setFrameworkAnalysis}
                        onFindEvidence={async (id, title) => {
                            setFrameworkLoadingStates(prev => ({ ...prev, [id]: true }));
                            try { const res = await analyzeFrameworkRelevance(cards, title); setFrameworkAnalysis(prev => ({ ...prev, [id]: res })); }
                            finally { setFrameworkLoadingStates(prev => ({ ...prev, [id]: false })); }
                        }}
                        loadingStates={frameworkLoadingStates} error={frameworkError}
                        onViewCard={setViewingCard} researchFocus={researchFocus} onLoadSuggestedFramework={() => setFrameworkTopics(SUGGESTED_FRAMEWORK_TEMPLATE)}
                      />
                  )}

                  {activeView === 'matrix' && (
                      <SynthesisMatrixView 
                        selectedCards={cards.filter(c => selectedCardIds.has(c.id))}
                        onGenerate={handleGenerateMatrix} isLoading={isMatrixLoading}
                        error={matrixError} matrixData={matrixData} matrixThemes={matrixThemes}
                      />
                  )}

                  {activeView === 'analysis' && (
                      <AIAnalysisView 
                        selectedCards={cards.filter(c => selectedCardIds.has(c.id))}
                        onGenerateConversation={async () => {
                            setIsConversationLoading(true);
                            try { const r = await generateAcademicConversation(cards.filter(c => selectedCardIds.has(c.id))); setConversationResult(r); }
                            finally { setIsConversationLoading(false); }
                        }}
                        isConversationLoading={isConversationLoading} conversationResult={conversationResult} conversationError={null}
                        onGenerateQuestions={async () => {
                            setIsQuestionsLoading(true);
                            try { const r = await generateResearchQuestions(cards.filter(c => selectedCardIds.has(c.id))); setQuestionsResult(r); }
                            finally { setIsQuestionsLoading(false); }
                        }}
                        isQuestionsLoading={isQuestionsLoading} questionsResult={questionsResult} questionsError={null}
                        onGenerateProblemStatement={async () => {
                            setIsProblemStatementLoading(true);
                            try { const r = await generateProblemStatement(cards.filter(c => selectedCardIds.has(c.id))); setProblemStatementResult(r); }
                            finally { setIsProblemStatementLoading(false); }
                        }}
                        isProblemStatementLoading={isProblemStatementLoading} problemStatementResult={problemStatementResult} problemStatementError={null}
                        theoreticalFramework={frameworkTopics} onAnalyzeFramework={() => {}} isFrameworkLoading={false} frameworkResult={null} frameworkError={null}
                        onViewCard={setViewingCard} onGenerateCitationNetwork={async () => {
                            setIsCitationNetworkLoading(true);
                            try { const r = await generateCitationNetwork(cards.filter(c => selectedCardIds.has(c.id))); setCitationNetworkResult(r); }
                            finally { setIsCitationNetworkLoading(false); }
                        }}
                        isCitationNetworkLoading={isCitationNetworkLoading} citationNetworkResult={citationNetworkResult} citationNetworkError={null}
                      />
                  )}
              </div>
          </div>

          {/* Collapsible Input Panel (Drawer) */}
          <div className={`fixed inset-y-0 right-0 w-full md:w-[450px] bg-white shadow-2xl z-40 transform transition-transform duration-300 ease-in-out border-l border-slate-200 flex flex-col ${isInputPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                  <h2 className="font-bold text-slate-800 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      {editingId ? 'Editar Evidencia' : 'Cargar Nueva Evidencia'}
                  </h2>
                  <button onClick={() => setIsInputPanelOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
              </div>
              <div className="flex-grow overflow-y-auto p-6 space-y-8 bg-slate-50/30">
                  {!editingId && <FileUpload onProcess={handleProcessPDF} isLoading={isLoading} />}
                  <DataForm 
                    cardData={currentCardData} onDataChange={handleDataChange} 
                    onSubmit={handleAddOrUpdateCard} onCancel={() => { setEditingId(null); setCurrentCardData(EMPTY_CARD); setIsInputPanelOpen(false); }} 
                    isEditing={!!editingId}
                  />
              </div>
          </div>
      </main>

      {/* Floating Action Overlay for loading */}
      {isLoading && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
              <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center">
                  <Loader message={loadingMessage} />
              </div>
          </div>
      )}

      {viewingCard && <ReviewCardModal card={viewingCard} onClose={() => setViewingCard(null)} />}
      {linkingCardId && (
        <LinkToTopicModal 
            card={cards.find(c => c.id === linkingCardId)!} 
            topics={frameworkTopics} isOpen={!!linkingCardId} 
            onClose={() => setLinkingCardId(null)} 
            onLink={(cid, tid) => {
                setFrameworkAnalysis(prev => {
                    const links = prev[tid] || [];
                    if (links.some(l => l.cardId === cid)) return prev;
                    return { ...prev, [tid]: [...links, { cardId: cid, justification: 'Vinculado manualmente.', relevanceScore: 10 }] };
                });
                setLinkingCardId(null);
                setSuccessMessage("Ficha vinculada al tema.");
            }}
        />
      )}
    </div>
  );
}

export default App;
