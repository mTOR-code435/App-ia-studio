
import React, { useEffect, useMemo, useState } from 'react';
import { type ReviewCard } from '../types';
import PdfViewer from './PdfViewer';

interface ReviewCardModalProps {
  card: ReviewCard | null;
  onClose: () => void;
  // Props para manejo de PDF
  pdfUrl?: string | null;
  onPdfReupload?: (file: File) => void;
}

interface EvidenceDisplayProps {
  evidenceText: string;
  onQuoteClick: (text: string) => void;
}

const EvidenceDisplay: React.FC<EvidenceDisplayProps> = ({ evidenceText, onQuoteClick }) => {
    const parsedEvidence = useMemo(() => {
        if (!evidenceText) return [];
        return evidenceText.split('\n').map(line => line.trim()).filter(line => line.startsWith('- ')).map(line => line.substring(2));
    }, [evidenceText]);

    if (parsedEvidence.length === 0) {
        return <p className="text-base text-slate-800 whitespace-pre-wrap">{evidenceText}</p>;
    }

    return (
        <ul className="space-y-3 list-inside">
            {parsedEvidence.map((item, index) => (
                 <li 
                    key={index} 
                    className="group p-3 bg-slate-100 border-l-4 border-slate-300 hover:border-indigo-500 hover:bg-indigo-50 rounded-r-md text-slate-800 cursor-pointer transition-all relative"
                    onClick={() => onQuoteClick(item)}
                 >
                    <span className="italic">"{item}"</span>
                    <span className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 text-xs font-bold text-indigo-600 flex items-center gap-1 bg-white px-2 py-0.5 rounded shadow-sm">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        Localizar en PDF
                    </span>
                </li>
            ))}
        </ul>
    );
};

const fieldLabels: Record<string, string> = {
    participantRole: 'Rol del Participante',
    evidenceType: 'Tipo de Evidencia',
    keyFindings: 'Hallazgos Clave',
    usageDetails: 'Caracterización (Uso Común/Académico)',
    summary: 'Resumen Ejecutivo',
    conclusions: 'Conclusiones y Cierre',
    comparativeNotes: 'Notas Comparativas',
    challengesOpportunities: 'Desafíos y Oportunidades',
    contextualFactors: 'Conocimiento (TPACK) y Ética',
    keyEvidence: 'Evidencia Directa',
    conceptsDefinitions: 'Conceptos y Definiciones Operacionales',
    theoreticalFoundation: 'Teorías de Sustento',
    antecedents: 'Antecedentes (Estado del Arte)',
    dimensionsVariables: 'Dimensiones y Variables',
    methodologicalEvidence: 'Evidencia Metodológica',
    discussionReferences: 'Discusión y Referencias',
};

const displayOrder: (keyof Omit<ReviewCard, 'id'|'source'|'topic'|'tags'>)[] = [
    'participantRole',
    'evidenceType',
    'summary',
    'conclusions',
    'keyEvidence', // Mover evidencia arriba para UX de PDF
    'conceptsDefinitions',
    'theoreticalFoundation',
    'antecedents',
    'dimensionsVariables',
    'methodologicalEvidence',
    'discussionReferences',
    'keyFindings',
    'usageDetails',
    'comparativeNotes',
    'challengesOpportunities',
    'contextualFactors',
];

const ReviewCardModal: React.FC<ReviewCardModalProps> = ({ card, onClose, pdfUrl, onPdfReupload }) => {
    const [highlightText, setHighlightText] = useState<string>('');
    const [showPdf, setShowPdf] = useState(true);

    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!card) return null;

    return (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 animate-fade-in" onClick={onClose} role="dialog">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[95vw] h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex-shrink-0 bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
                    <div className="flex items-center gap-4 overflow-hidden">
                        <div>
                            <h2 className="text-xl font-bold text-indigo-800 truncate max-w-md" title={card.source}>{card.source}</h2>
                            <div className="flex gap-2 text-sm text-slate-500">
                                <span>{card.topic}</span>
                                <span className="text-slate-300">|</span>
                                <span className="font-mono text-xs bg-slate-200 px-2 rounded-full">{card.id}</span>
                            </div>
                        </div>
                        {/* Toggle PDF View */}
                        <div className="bg-slate-200 p-1 rounded-lg flex text-xs font-bold">
                            <button 
                                onClick={() => setShowPdf(false)}
                                className={`px-3 py-1.5 rounded-md transition-all ${!showPdf ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Solo Datos
                            </button>
                            <button 
                                onClick={() => setShowPdf(true)}
                                className={`px-3 py-1.5 rounded-md transition-all ${showPdf ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Split View (PDF)
                            </button>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-red-500 rounded-full transition-colors">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Content Body - Split Layout */}
                <div className="flex-1 flex overflow-hidden">
                    
                    {/* Panel Izquierdo: Datos Extraídos */}
                    <div className={`flex-1 overflow-y-auto p-6 bg-slate-50 ${showPdf ? 'max-w-[50%] border-r border-slate-300' : 'max-w-full'}`}>
                        <div className="space-y-8 pb-12">
                            {displayOrder.map((key) => {
                                const value = card[key];
                                if (typeof value === 'string' && value.trim()) {
                                    const isHighlighted = key === 'keyEvidence';
                                    return (
                                        <div key={key}>
                                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                {fieldLabels[key] || key}
                                                {isHighlighted && <span className="bg-indigo-100 text-indigo-700 text-[9px] px-1.5 py-0.5 rounded">Interactivo</span>}
                                            </h4>
                                            
                                            {key === 'keyEvidence' ? (
                                                <EvidenceDisplay 
                                                    evidenceText={value} 
                                                    onQuoteClick={(text) => {
                                                        if (showPdf) {
                                                            setHighlightText(text);
                                                        } else {
                                                            setShowPdf(true);
                                                            setTimeout(() => setHighlightText(text), 100);
                                                        }
                                                    }} 
                                                />
                                            ) : (
                                                <div className={`text-sm text-slate-800 whitespace-pre-wrap leading-relaxed ${key === 'summary' ? 'font-medium' : ''}`}>
                                                    {value}
                                                </div>
                                            )}
                                        </div>
                                    );
                                }
                                return null;
                            })}
                        </div>
                    </div>

                    {/* Panel Derecho: PDF Viewer */}
                    {showPdf && (
                        <div className="flex-1 bg-slate-200 relative">
                             <PdfViewer 
                                pdfUrl={pdfUrl || null} 
                                highlightText={highlightText}
                                onReupload={onPdfReupload!}
                             />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReviewCardModal;
