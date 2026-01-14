
import React, { useState } from 'react';
import { type ReviewCard, type VaeVariation } from '../types';
import Loader from './Loader';
import SelectionPicker from './SelectionPicker';
import { runCriticalAgent, refineDraftText } from '../services/geminiService';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface ThesisDrafterProps {
  allCards: ReviewCard[];
  selectedCardIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onGenerate: (section: string, context: string, length: 'short' | 'medium' | 'long', tone: 'descriptive' | 'critical' | 'comparative', temperature: number) => Promise<VaeVariation[]>;
  isLoading: boolean;
  error: string | null;
  onViewCard?: (cardId: string) => void;
}

const ThesisDrafter: React.FC<ThesisDrafterProps> = ({ allCards, selectedCardIds, onToggleSelection, onGenerate, isLoading, error, onViewCard }) => {
  const [sectionTitle, setSectionTitle] = useLocalStorage<string>('drafter_sectionTitle', '');
  const [contextInput, setContextInput] = useLocalStorage<string>('drafter_contextInput', '');
  const [length, setLength] = useLocalStorage<'short' | 'medium' | 'long'>('drafter_length', 'medium');
  const [tone, setTone] = useLocalStorage<'descriptive' | 'critical' | 'comparative'>('drafter_tone', 'descriptive');
  const [temperature, setTemperature] = useLocalStorage<number>('drafter_temperature', 0.7);
  const [variations, setVariations] = useLocalStorage<VaeVariation[]>('drafter_variations', []);
  
  const [isCritiquing, setIsCritiquing] = useState<Record<number, boolean>>({});
  const [isRefining, setIsRefining] = useState<Record<number, boolean>>({});

  const selectedCards = allCards.filter(c => selectedCardIds.has(c.id));

  const handleGenerate = async () => {
    if (!sectionTitle.trim() || selectedCards.length === 0) return;
    try {
        const result = await onGenerate(sectionTitle, contextInput, length, tone, temperature);
        if (result && result.length > 0) {
            setVariations(result);
        }
        setIsCritiquing({});
        setIsRefining({});
    } catch (e) {
        console.error("Drafter error:", e);
    }
  };

  const handleRunCritic = async (index: number) => {
      setIsCritiquing(prev => ({ ...prev, [index]: true }));
      try {
          const draft = variations[index];
          const critique = await runCriticalAgent(draft.content, contextInput, selectedCards);
          const newVariations = [...variations];
          newVariations[index] = { ...draft, critique };
          setVariations(newVariations);
      } catch (e) {
          alert("El agente crítico no pudo completar la revisión.");
      } finally {
          setIsCritiquing(prev => ({ ...prev, [index]: false }));
      }
  };

  const handleRefine = async (index: number, instruction: string) => {
      setIsRefining(prev => ({ ...prev, [index]: true }));
      try {
          const draft = variations[index];
          const refinedContent = await refineDraftText(draft.content, instruction, selectedCards, tone, temperature);
          const newVariations = [...variations];
          newVariations[index] = { ...draft, content: refinedContent };
          setVariations(newVariations);
      } catch (e) {
          alert("Error al refinar el texto.");
      } finally {
          setIsRefining(prev => ({ ...prev, [index]: false }));
      }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Borrador copiado al portapapeles');
  };

  const findCardIdByTitle = (citationTitle: string): string | undefined => {
      if (!citationTitle) return undefined;
      const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w]/g, '');
      const target = normalize(citationTitle);
      const match = allCards.find(c => {
          const sourceNorm = normalize(c.source);
          const topicNorm = normalize(c.topic);
          return sourceNorm.includes(target) || target.includes(sourceNorm) || topicNorm.includes(target);
      });
      return match?.id;
  };

  const renderDraftContent = (text: string) => {
      const parts = text.split(/\[Fuente: (.+?)\]/g);
      if (parts.length === 1) return <p className="whitespace-pre-wrap">{text}</p>;
      return (
          <div className="whitespace-pre-wrap">
              {parts.map((part, i) => {
                  if (i % 2 === 0) return part;
                  const citationTitle = part;
                  const cardId = findCardIdByTitle(citationTitle);
                  if (cardId && onViewCard) {
                      return (
                          <button 
                              key={i}
                              onClick={() => onViewCard(cardId)}
                              className="inline-flex items-center gap-1 mx-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 border border-indigo-200 rounded text-[11px] font-bold hover:bg-indigo-600 hover:text-white transition-all align-baseline shadow-sm"
                          >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                              {citationTitle}
                          </button>
                      );
                  }
                  return <span key={i} className="text-slate-400 font-medium italic">[{citationTitle}]</span>;
              })}
          </div>
      );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-20">
      <SelectionPicker 
        allCards={allCards} 
        selectedCardIds={selectedCardIds} 
        onToggleSelection={onToggleSelection} 
        title="FICHAS PARA COMPARAR"
      />

      {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3 animate-fade-in shadow-sm">
              <svg className="h-5 w-5 text-red-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <div>
                  <h4 className="text-sm font-bold text-red-800 uppercase">Error en el proceso de redacción</h4>
                  <p className="text-xs text-red-700 mt-1">{error}</p>
              </div>
          </div>
      )}

      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 p-8 text-white relative">
            <h2 className="text-2xl font-bold flex items-center gap-3">
                <div className="bg-indigo-600 p-2 rounded-lg shadow-inner">
                    <svg className="h-6 w-6 text-indigo-100" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </div>
                Redactor Académico VAE
            </h2>
            <p className="text-indigo-200 mt-3 text-sm max-w-2xl leading-relaxed">
                Triangula <strong>{selectedCardIds.size} evidencias</strong> con Gemini 3 Pro. Refina tus párrafos añadiendo citas o profundidad con un solo clic.
            </p>
        </div>
        
        <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Panel de Configuración */}
            <div className="lg:col-span-1 space-y-8 animate-fade-in">
                 <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-[0.2em]">Título de la Sección</label>
                    <input 
                        type="text" 
                        value={sectionTitle}
                        onChange={(e) => setSectionTitle(e.target.value)}
                        placeholder="Ej: Análisis del TPACK Docente"
                        className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:ring-2 focus:ring-indigo-500 transition shadow-inner outline-none font-medium"
                    />
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-[0.2em]">Extensión</label>
                        <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                            {(['short', 'medium', 'long'] as const).map(l => (
                                <button key={l} onClick={() => setLength(l)} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg transition-all ${length === l ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>
                                    {l === 'short' ? 'Breve' : l === 'medium' ? 'Medio' : 'Largo'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-[0.2em]">Puntos Clave</label>
                    <textarea 
                        value={contextInput}
                        onChange={(e) => setContextInput(e.target.value)}
                        placeholder="Define qué quieres destacar..."
                        rows={5}
                        className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:ring-2 focus:ring-indigo-500 transition shadow-inner outline-none resize-none text-sm font-medium"
                    />
                </div>

                <button 
                  onClick={handleGenerate} 
                  disabled={isLoading || !sectionTitle || selectedCardIds.size === 0} 
                  className="w-full py-5 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 transition-all shadow-lg flex items-center justify-center gap-3"
                >
                    {isLoading ? 'Redactando...' : 'Generar Borradores'}
                </button>
            </div>

            {/* Panel de Resultados */}
            <div className="lg:col-span-2 space-y-8">
                {isLoading && (
                    <div className="h-full flex flex-col items-center justify-center min-h-[600px] animate-fade-in">
                        <div className="animate-spin rounded-full h-24 w-24 border-t-4 border-b-4 border-indigo-600"></div>
                        <p className="text-slate-800 font-black text-xl mt-8 uppercase">Procesando Variaciones...</p>
                    </div>
                )}

                {!isLoading && variations.map((variant, idx) => (
                    <div key={idx} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-view-change hover:border-indigo-400 transition-all">
                        <div className={`px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white flex justify-between items-center ${idx === 0 ? 'bg-indigo-600' : idx === 1 ? 'bg-slate-700' : 'bg-emerald-600'}`}>
                            <span>OPCIÓN {idx + 1}: {variant.title}</span>
                            <span className="opacity-70">REDACCIÓN VAE</span>
                        </div>
                        <div className="p-10">
                            <div className="prose prose-indigo max-w-none">
                                <div className={`text-lg text-slate-800 leading-[2] font-serif text-justify ${isRefining[idx] ? 'opacity-40 animate-pulse' : ''}`}>
                                    {renderDraftContent(variant.content)}
                                </div>
                            </div>
                            
                            {/* BOTONERA DE REFINAMIENTO (NUEVA) */}
                            <div className="mt-10 pt-8 border-t border-slate-100 space-y-4">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Mejorar Borrador:</span>
                                    <button 
                                        onClick={() => handleRefine(idx, "Añade al menos 2 citas más de las fuentes seleccionadas integradas en el flujo narrativo.")}
                                        disabled={isRefining[idx]}
                                        className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold hover:bg-indigo-100 transition-all flex items-center gap-1 border border-indigo-100"
                                    >
                                        💎 Añadir Citas
                                    </button>
                                    <button 
                                        onClick={() => handleRefine(idx, "Amplía la descripción académica, profundizando en el análisis conceptual.")}
                                        disabled={isRefining[idx]}
                                        className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-bold hover:bg-slate-200 transition-all flex items-center gap-1 border border-slate-200"
                                    >
                                        📝 Ampliar Análisis
                                    </button>
                                    <button 
                                        onClick={() => handleRefine(idx, "Contextualiza este párrafo enfocándolo en la realidad de la I.E. Nueva Granada según la evidencia.")}
                                        disabled={isRefining[idx]}
                                        className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-bold hover:bg-emerald-100 transition-all flex items-center gap-1 border border-emerald-100"
                                    >
                                        📍 Contextualizar
                                    </button>
                                </div>

                                <div className="flex flex-wrap items-center gap-4">
                                    <button onClick={() => copyToClipboard(variant.content)} className="px-6 py-2.5 bg-slate-50 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 transition-all flex items-center gap-2 shadow-sm">
                                        Copiar
                                    </button>
                                    <button 
                                        onClick={() => handleRunCritic(idx)} 
                                        disabled={isCritiquing[idx]} 
                                        className="px-6 py-2.5 bg-red-50 text-red-700 rounded-xl text-xs font-bold hover:bg-red-600 hover:text-white transition-all flex items-center gap-2 shadow-sm"
                                    >
                                        {isCritiquing[idx] ? 'Auditando...' : 'Pedir Crítica'}
                                    </button>
                                </div>
                            </div>

                            {variant.critique && (
                                <div className="mt-8 p-6 bg-slate-900 text-white rounded-3xl animate-fade-in shadow-2xl relative overflow-hidden">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-red-600 rounded-2xl flex items-center justify-center text-xs font-black shadow-lg">AI</div>
                                            <h5 className="font-black text-xs uppercase tracking-widest text-slate-400">Informe de Rigor Académico</h5>
                                        </div>
                                        <div className="text-center">
                                            <span className="text-3xl font-black text-red-500">{variant.critique.score}</span>
                                            <span className="text-slate-600 text-xs">/10</span>
                                        </div>
                                    </div>
                                    <div className="space-y-6 relative z-10">
                                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {variant.critique.weaknesses.map((w, i) => (
                                                <li key={i} className="text-xs text-slate-300 flex items-start gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                                                    <span className="text-red-500 mt-1">●</span>{w}
                                                </li>
                                            ))}
                                        </ul>
                                        <div className="bg-indigo-600/20 p-5 rounded-2xl border border-indigo-500/30 text-sm text-indigo-100 italic leading-relaxed">
                                            "{variant.critique.suggestion}"
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ThesisDrafter;
