
import React, { useState, useRef, useEffect } from 'react';
import { ReviewCard, SynthesisMatrixData } from '../types';
import { sendChatMessage } from '../services/geminiService';
import ApiKeySettings from './ApiKeySettings';
import { useResearch } from '../ResearchContext';

interface ChatWidgetProps {
    cards: ReviewCard[];
    matrixData?: SynthesisMatrixData | null;
    matrixThemes?: string[];
    onViewCard?: (cardId: string) => void;
}

interface Message {
    id: string;
    role: 'user' | 'model';
    text: string;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ cards, matrixData, matrixThemes, onViewCard }) => {
    // Usamos el contexto para saber qué fichas están seleccionadas globalmente
    const { selectedCardIds } = useResearch();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: 'init', role: 'model', text: 'Hola. Soy tu asistente de investigación IA con acceso RAG (Búsqueda Semántica). Puedo citar fragmentos específicos de tus documentos. ¿En qué puedo ayudarte?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showKeySettings, setShowKeySettings] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Filtramos las cartas a usar como fuentes: si hay seleccionadas, usamos esas; si no, todas.
    const activeSources = cards.filter(c => selectedCardIds.size === 0 || selectedCardIds.has(c.id));

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        if (activeSources.length === 0) {
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: '⚠️ No hay fuentes cargadas o seleccionadas para analizar. Por favor, sube documentos PDF o selecciónalos en el panel de Evidencias.' }]);
            return;
        }

        const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input.trim() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const historyForApi = messages.filter(m => m.id !== 'init').map(m => ({ 
                role: m.role, 
                parts: [{ text: m.text }] 
            }));
            
            // Pasamos solo las fuentes activas (RAG real)
            const responseText = await sendChatMessage(historyForApi, userMsg.text, activeSources, matrixData, matrixThemes);
            
            if (responseText) {
                const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'model', text: responseText };
                setMessages(prev => [...prev, aiMsg]);
            }
        } catch (error: any) {
            const isQuota = error.message?.includes('quota') || error.message?.includes('429');
            const errorText = isQuota 
                ? '⚠️ Se ha excedido la cuota de la API. Por favor configura tu propia API Key.' 
                : 'Lo siento, hubo un error al procesar tu mensaje.';
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: errorText }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const findCardIdByTitle = (citationTitle: string): string | undefined => {
        if (!citationTitle) return undefined;
        const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w]/g, '');
        const target = normalize(citationTitle);
        const match = cards.find(c => {
            const sourceNorm = normalize(c.source);
            return sourceNorm.includes(target) || target.includes(sourceNorm);
        });
        return match?.id;
    };

    const renderMessageText = (text: string) => {
        const parts = text.split(/\[Fuente: (.+?)\]/g);
        if (parts.length === 1) return <p className="whitespace-pre-wrap">{text}</p>;
        return (
            <p className="whitespace-pre-wrap">
                {parts.map((part, i) => {
                    if (i % 2 === 0) return part;
                    const citationTitle = part;
                    const cardId = findCardIdByTitle(citationTitle);
                    if (cardId && onViewCard) {
                        return (
                            <button key={i} onClick={() => onViewCard(cardId)} className="inline-flex items-center gap-1 mx-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 border border-indigo-200 rounded text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all align-middle shadow-sm">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                {citationTitle}
                            </button>
                        );
                    }
                    return <span key={i} className="text-slate-500 text-xs font-medium italic bg-slate-100 px-1 rounded">[{citationTitle}]</span>;
                })}
            </p>
        );
    };

    return (
        <>
            <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
                {isOpen && (
                    <div className="bg-white rounded-2xl shadow-2xl w-80 md:w-96 h-[500px] flex flex-col border border-slate-200 mb-4 animate-view-change overflow-hidden">
                        <div className="bg-indigo-700 p-4 flex justify-between items-center text-white">
                            <div className="flex items-center gap-2">
                                <div className="bg-indigo-500 p-1.5 rounded-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm uppercase tracking-wider">Asistente Gemini RAG</h3>
                                    <p className="text-[10px] text-indigo-200">
                                        Explorando {activeSources.length} fuentes {selectedCardIds.size > 0 ? '(seleccionadas)' : '(totales)'}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="hover:bg-indigo-600 p-1 rounded transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="flex-grow overflow-y-auto p-4 bg-slate-50 space-y-4">
                            {messages.map(msg => (
                                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[90%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                                        msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                                    }`}>
                                        {renderMessageText(msg.text)}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm flex items-center gap-1.5">
                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></span>
                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-3 bg-white border-t border-slate-200">
                            <div className="relative">
                                <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Haz una pregunta sobre tus fuentes..." rows={1} className="w-full pl-4 pr-12 py-3 bg-slate-100 border-transparent focus:bg-white focus:border-indigo-500 rounded-xl text-sm focus:ring-0 resize-none max-h-32 transition-all" />
                                <button onClick={handleSend} disabled={!input.trim() || isLoading} className="absolute right-2 top-1.5 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-slate-300 transition-colors shadow-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <button onClick={() => setIsOpen(!isOpen)} className={`p-4 rounded-full shadow-lg transition-all transform hover:scale-105 ${isOpen ? 'bg-slate-700 rotate-90' : 'bg-indigo-600 hover:bg-indigo-700'} text-white flex items-center justify-center`}>
                    {isOpen ? <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>}
                </button>
            </div>
            <ApiKeySettings isOpen={showKeySettings} onClose={() => setShowKeySettings(false)} />
        </>
    );
};

export default ChatWidget;
