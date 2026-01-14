
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { ResearchProvider, useResearch } from './ResearchContext';
import { type ReviewCard, type ReviewCardData, type SynthesisMatrixData, type RelevanceResult, type FrameworkAnalysisResult, type FrameworkTopic, type FrameworkAnalysisItem, type CitationNetworkData, type VaeVariation } from './types';
import { extractTextFromPdf } from './utils/pdfUtils';
import { segmentText } from './utils/textUtils';
import { 
    extractInfoFromText,
    extractInfoFromImage,
    generateSynthesisMatrix,
    generateAcademicConversation,
    analyzeCardRelevance,
    analyzeFrameworkRelevance,
    generateProblemStatement,
    generateCitationNetwork,
    generateVariationalDraft,
    suggestThemesFromCards
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
import ResearchFocus from './components/ResearchFocus';
import ReviewCardModal from './components/ReviewCardModal';
import TheoreticalFrameworkGuide from './components/TheoreticalFrameworkGuide';
import LinkToTopicModal from './components/LinkToTopicModal';
import ChatWidget from './components/ChatWidget';
import ThesisDrafter from './components/ThesisDrafter';
import ApiKeySettings from './components/ApiKeySettings';
import ConsistencyAuditor from './components/ConsistencyAuditor';
import SelectionPicker from './components/SelectionPicker';

const EMPTY_CARD: ReviewCardData = {
  source: '', topic: '', participantRole: 'Docente', evidenceType: '', keyFindings: '', usageDetails: '', summary: '', conclusions: '', comparativeNotes: '', challengesOpportunities: '', contextualFactors: '', keyEvidence: '', conceptsDefinitions: '', theoreticalFoundation: '', antecedents: '', dimensionsVariables: '', methodologicalEvidence: '', discussionReferences: '', tags: '', fullText: '', analysis_reasoning: ''
};

const SUGGESTED_FRAMEWORK_TEMPLATE: FrameworkTopic[] = [
    { id: '1', title: '1. La Inteligencia Artificial en el Contexto Educativo', level: 0 },
    { id: '1_1', title: '1.1. Definición y tipologías de IA', level: 1, parentId: '1' },
    { id: '2', title: '2. Caracterización del Uso (Uso Común vs. Académico)', level: 0 },
    { id: '3', title: '3. Conocimiento Tecnológico y Pedagógico (TPACK)', level: 0 },
    { id: '4', title: '4. Dimensión Ética y Percepción del Riesgo', level: 0 }
];

function MainApp() {
  const { 
    cards, setCards, 
    researchFocus, setResearchFocus, 
    frameworkTopics, setFrameworkTopics, 
    frameworkAnalysis, setFrameworkAnalysis,
    relevanceData, setRelevanceData,
    selectedCardIds, setSelectedCardIds
  } = useResearch();

  const [currentCardData, setCurrentCardData] = useState<ReviewCardData>(EMPTY_CARD);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'cards' | 'framework' | 'matrix' | 'analysis' | 'drafter' | 'consistency'>('cards');
  const [isInputPanelOpen, setIsInputPanelOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [viewingCard, setViewingCard] = useState<ReviewCard | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'default' | 'relevance'>('default');
  const [batchProgress, setBatchProgress] = useState<{current: number; total: number; filename: string} | null>(null);
  const [pdfBlobUrls, setPdfBlobUrls] = useState<Record<string, string>>({});
  
  const [matrixData, setMatrixData] = useState<SynthesisMatrixData | null>(null);
  const [matrixThemes, setMatrixThemes] = useState<string[]>([]);
  const [isMatrixLoading, setIsMatrixLoading] = useState(false);
  
  const [conversationResult, setConversationResult] = useState<string | null>(null);
  const [isConversationLoading, setIsConversationLoading] = useState(false);
  const [problemStatementResult, setProblemStatementResult] = useState<string | null>(null);
  const [isProblemStatementLoading, setIsProblemStatementLoading] = useState(false);
  const [citationNetworkResult, setCitationNetworkResult] = useState<CitationNetworkData | null>(null);
  const [isCitationNetworkLoading, setIsCitationNetworkLoading] = useState(false);

  // States for Drafter
  const [isDrafterLoading, setIsDrafterLoading] = useState(false);
  const [drafterError, setDrafterError] = useState<string | null>(null);

  // --- HANDLERS DE SELECCIÓN ---
  const handleToggleSelection = (id: string) => {
      const next = new Set(selectedCardIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setSelectedCardIds(next);
  };

  const handleSelectAll = () => {
      setSelectedCardIds(new Set(cards.map(c => c.id)));
  };

  const handleClearSelection = () => {
      setSelectedCardIds(new Set());
  };

  const handleExportJSON = useCallback(() => {
    const dataToExport = { version: "1.0", timestamp: new Date().toISOString(), cards, researchFocus, frameworkTopics, frameworkAnalysis, relevanceData };
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `investigacion_vae_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [cards, researchFocus, frameworkTopics, frameworkAnalysis, relevanceData]);

  const handleImportJSON = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const json = JSON.parse(e.target?.result as string);
            setCards(json.cards || []);
            if (json.researchFocus) setResearchFocus(json.researchFocus);
            if (json.frameworkTopics) setFrameworkTopics(json.frameworkTopics);
            if (json.frameworkAnalysis) setFrameworkAnalysis(json.frameworkAnalysis);
            if (json.relevanceData) setRelevanceData(json.relevanceData);
            setSuccessMessage("Backup restaurado correctamente.");
        } catch (err) { setError("Error al importar el archivo."); }
    };
    reader.readAsText(file);
    event.target.value = '';
  }, [setCards, setResearchFocus, setFrameworkTopics, setFrameworkAnalysis, setRelevanceData]);

  const handleProcessFiles = useCallback(async (files: File[]) => {
    setIsLoading(true);
    setError(null);
    setBatchProgress({ current: 0, total: files.length, filename: '' });
    try {
        const newUrls: Record<string, string> = {};
        const newCards: ReviewCard[] = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            setBatchProgress({ current: i, total: files.length, filename: file.name });
            if (file.type === "application/pdf") {
                const text = await extractTextFromPdf(file);
                const result = await extractInfoFromText(text);
                if (result) {
                    const id = Date.now().toString() + i;
                    const card: ReviewCard = { ...result, id, tags: (result.tags || '').split(',').map(t => t.trim()).filter(Boolean), chunks: segmentText(text) };
                    newCards.push(card);
                    newUrls[id] = URL.createObjectURL(file);
                }
            }
        }
        if (newCards.length > 0) {
            setCards(prev => [...prev, ...newCards]);
            setPdfBlobUrls(prev => ({ ...prev, ...newUrls }));
            setSuccessMessage(`Se procesaron ${newCards.length} fuentes con éxito.`);
        }
    } catch (e: any) { setError(`Error: ${e.message}`); }
    finally { setIsLoading(false); setBatchProgress(null); }
  }, [setCards]);

  const handleAddOrUpdateCard = () => {
    const tagsArray = (currentCardData.tags || '').split(',').map(tag => tag.trim()).filter(Boolean);
    if (editingId) {
      setCards(cards.map(c => c.id === editingId ? { ...currentCardData, id: editingId, tags: tagsArray } : c));
      setEditingId(null);
    } else {
      const id = Date.now().toString();
      setCards([...cards, { ...currentCardData, id, tags: tagsArray }]);
    }
    setCurrentCardData(EMPTY_CARD);
    setIsInputPanelOpen(false);
  };

  const handleFindEvidenceForFramework = async (topicId: string, topicTitle: string) => {
    try {
        const res = await analyzeFrameworkRelevance(cards, topicTitle);
        setFrameworkAnalysis({ ...frameworkAnalysis, [topicId]: res });
    } catch (e) { console.error(e); }
  };

  const handleGenerateMatrix = async (themes: string[]) => {
      setIsMatrixLoading(true);
      try {
          const selectedCards = cards.filter(c => selectedCardIds.has(c.id));
          const data = await generateSynthesisMatrix(selectedCards, themes);
          setMatrixData(data);
          setMatrixThemes(themes);
      } finally { setIsMatrixLoading(false); }
  };

  const handleGenerateConversation = async (focus: any, instr: string) => {
      setIsConversationLoading(true);
      try {
          const selectedCards = cards.filter(c => selectedCardIds.has(c.id));
          const result = await generateAcademicConversation(selectedCards, researchFocus.question, researchFocus.objectives, focus, instr);
          setConversationResult(result);
      } finally { setIsConversationLoading(false); }
  };

  const handleGenerateProblemStatement = async () => {
      setIsProblemStatementLoading(true);
      try {
          const selectedCards = cards.filter(c => selectedCardIds.has(c.id));
          const result = await generateProblemStatement(selectedCards);
          setProblemStatementResult(result);
      } finally { setIsProblemStatementLoading(false); }
  };

  const handleGenerateCitationNetwork = async () => {
      setIsCitationNetworkLoading(true);
      try {
          const selectedCards = cards.filter(c => selectedCardIds.has(c.id));
          const result = await generateCitationNetwork(selectedCards);
          setCitationNetworkResult(result);
      } finally { setIsCitationNetworkLoading(false); }
  };

  const handleGenerateVariationalDraft = useCallback(async (section: string, context: string, length: 'short' | 'medium' | 'long', tone: 'descriptive' | 'critical' | 'comparative', temperature: number) => {
      setDrafterError(null);
      setIsDrafterLoading(true);
      try {
          const selectedCards = cards.filter(c => selectedCardIds.has(c.id));
          const results = await generateVariationalDraft(selectedCards, section, context, length, tone, temperature);
          return results;
      } catch (e: any) { setDrafterError(e.message); throw e; }
      finally { setIsDrafterLoading(false); }
  }, [cards, selectedCardIds]);

  const filteredCards = useMemo(() => {
    let res = [...cards];
    if (searchTerm) res = res.filter(c => c.source.toLowerCase().includes(searchTerm.toLowerCase()) || c.topic.toLowerCase().includes(searchTerm.toLowerCase()));
    if (sortOrder === 'relevance') res.sort((a, b) => (relevanceData[b.id]?.relevanceScore || 0) - (relevanceData[a.id]?.relevanceScore || 0));
    return res;
  }, [cards, searchTerm, sortOrder, relevanceData]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header title="VAE Doctoral" subtitle="I.E. Nueva Granada - Triangulación de IA" />
      
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 md:px-8 py-2 flex items-center justify-between">
          <nav className="flex bg-slate-100 p-1 rounded-lg overflow-x-auto gap-1">
              {[
                { id: 'cards', label: 'Evidencias' },
                { id: 'framework', label: 'Marco Teórico' },
                { id: 'consistency', label: 'Auditoría' },
                { id: 'matrix', label: 'Matriz' },
                { id: 'analysis', label: 'Análisis IA' },
                { id: 'drafter', label: 'Redactor VAE' }
              ].map(tab => (
                  <button key={tab.id} onClick={() => setActiveView(tab.id as any)} className={`px-4 py-1.5 text-xs font-bold uppercase rounded-md transition-all ${activeView === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{tab.label}</button>
              ))}
          </nav>
          <div className="flex gap-2">
              <button onClick={() => { setEditingId(null); setCurrentCardData(EMPTY_CARD); setIsInputPanelOpen(true); }} className="bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-indigo-700 shadow-sm">Añadir</button>
              <button onClick={() => setIsSettingsOpen(true)} className="p-2 bg-slate-100 rounded-lg text-slate-500 hover:text-indigo-600"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg></button>
          </div>
      </div>

      <main className="flex-grow p-4 md:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-6">
              {error && <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200">{error}</div>}
              {successMessage && <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">{successMessage}</div>}

              {activeView === 'cards' && (
                  <>
                      <ResearchFocus focus={researchFocus} setFocus={setResearchFocus} onAnalyze={() => {}} isLoading={false} progress={null} error={null} cards={cards} theoreticalFramework={frameworkTopics} frameworkAnalysis={frameworkAnalysis} frameworkLoadingStates={{}} onAnalyzeFramework={handleFindEvidenceForFramework} onViewCard={setViewingCard} />
                      <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                        <div className="flex gap-4 flex-grow w-full">
                            <input type="text" placeholder="Buscar evidencia..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="flex-grow p-2 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm" />
                            <select value={sortOrder} onChange={e => setSortOrder(e.target.value as any)} className="p-2 border rounded-xl text-sm"><option value="default">Recientes</option><option value="relevance">Relevancia</option></select>
                        </div>
                        <ExportButtons cards={cards} onExportJSON={handleExportJSON} onImportJSON={handleImportJSON} />
                      </div>
                      <ReviewCardTable cards={filteredCards} totalCards={cards.length} onEdit={id => { setEditingId(id); setCurrentCardData({ ...cards.find(c => c.id === id)!, tags: cards.find(c => c.id === id)!.tags.join(', ') }); setIsInputPanelOpen(true); }} onDelete={id => setCards(cards.filter(c => c.id !== id))} onView={id => setViewingCard(cards.find(c => c.id === id)!)} onLinkToTopic={() => {}} selectedCardIds={selectedCardIds} onToggleSelection={handleToggleSelection} onSelectAll={handleSelectAll} onClearSelection={handleClearSelection} relevanceData={relevanceData} onGenerateTopicFromSelection={() => {}} isGeneratingTopic={false} searchTerm={searchTerm} />
                  </>
              )}

              {activeView === 'consistency' && <ConsistencyAuditor />}
              {activeView === 'framework' && <TheoreticalFrameworkGuide cards={cards} topics={frameworkTopics} setTopics={setFrameworkTopics} linkedEvidence={frameworkAnalysis} setLinkedEvidence={setFrameworkAnalysis} onFindEvidence={handleFindEvidenceForFramework} loadingStates={{}} error={null} onViewCard={setViewingCard} researchFocus={researchFocus} onLoadSuggestedFramework={() => setFrameworkTopics(SUGGESTED_FRAMEWORK_TEMPLATE)} />}
              {activeView === 'matrix' && <SynthesisMatrixView allCards={cards} selectedCardIds={selectedCardIds} onToggleSelection={handleToggleSelection} onGenerate={handleGenerateMatrix} isLoading={isMatrixLoading} error={null} matrixData={matrixData} matrixThemes={matrixThemes} />}
              {activeView === 'analysis' && (
                  <div className="space-y-6">
                      <SelectionPicker allCards={cards} selectedCardIds={selectedCardIds} onToggleSelection={handleToggleSelection} title="Evidencias para el Análisis" />
                      <AIAnalysisView selectedCards={cards.filter(c => selectedCardIds.has(c.id))} onGenerateConversation={handleGenerateConversation} isConversationLoading={isConversationLoading} conversationResult={conversationResult} conversationError={null} onGenerateProblemStatement={handleGenerateProblemStatement} isProblemStatementLoading={isProblemStatementLoading} problemStatementResult={problemStatementResult} problemStatementError={null} theoreticalFramework={frameworkTopics} onAnalyzeFramework={handleFindEvidenceForFramework} isFrameworkLoading={false} frameworkResult={null} frameworkError={null} onViewCard={setViewingCard} onGenerateCitationNetwork={handleGenerateCitationNetwork} isCitationNetworkLoading={isCitationNetworkLoading} citationNetworkResult={citationNetworkResult} citationNetworkError={null} researchFocus={researchFocus} />
                  </div>
              )}
              {activeView === 'drafter' && <ThesisDrafter allCards={cards} selectedCardIds={selectedCardIds} onToggleSelection={handleToggleSelection} onGenerate={handleGenerateVariationalDraft} isLoading={isDrafterLoading} error={drafterError} onViewCard={setViewingCard} />}
          </div>
      </main>

      {isInputPanelOpen && (
          <div className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-white shadow-2xl z-40 flex flex-col border-l">
              <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                  <h2 className="font-bold">{editingId ? 'Revisar' : 'Añadir'} Evidencia</h2>
                  <button onClick={() => setIsInputPanelOpen(false)} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
              </div>
              <div className="p-6 overflow-y-auto space-y-6">
                  {!editingId && <FileUpload onProcess={handleProcessFiles} isLoading={isLoading} batchProgress={batchProgress} />}
                  <DataForm cardData={currentCardData} onDataChange={(f, v) => setCurrentCardData({ ...currentCardData, [f]: v })} onSubmit={handleAddOrUpdateCard} onCancel={() => setIsInputPanelOpen(false)} isEditing={!!editingId} />
              </div>
          </div>
      )}

      <ApiKeySettings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      {viewingCard && <ReviewCardModal card={viewingCard} onClose={() => setViewingCard(null)} pdfUrl={pdfBlobUrls[viewingCard.id]} />}
      <ChatWidget cards={cards} matrixData={matrixData} matrixThemes={matrixThemes} onViewCard={setViewingCard} />
    </div>
  );
}

export default function App() {
    return (
        <ResearchProvider>
            <MainApp />
        </ResearchProvider>
    );
}
