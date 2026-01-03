
import React, { useEffect, useMemo } from 'react';
import { type ReviewCard } from '../types';

interface ReviewCardModalProps {
  card: ReviewCard | null;
  onClose: () => void;
}

interface EvidenceDisplayProps {
  evidenceText: string;
}

const EvidenceDisplay: React.FC<EvidenceDisplayProps> = ({ evidenceText }) => {
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
                 <li key={index} className="p-3 bg-slate-100 border-l-4 border-slate-300 rounded-r-md text-slate-800">
                    <span className="italic">"{item}"</span>
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
};

const displayOrder: (keyof Omit<ReviewCard, 'id'|'source'|'topic'|'tags'>)[] = [
    'participantRole',
    'evidenceType',
    'summary',
    'conclusions',
    'keyFindings',
    'usageDetails',
    'comparativeNotes',
    'challengesOpportunities',
    'contextualFactors',
    'keyEvidence',
];

const ReviewCardModal: React.FC<ReviewCardModalProps> = ({ card, onClose }) => {
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!card) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose} role="dialog">
            <div className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex-shrink-0 bg-white p-6 border-b border-slate-200 flex justify-between items-start rounded-t-2xl">
                    <div>
                        <h2 className="text-2xl font-bold text-indigo-700">{card.source}</h2>
                        <p className="text-lg font-semibold text-slate-800 mt-1">{card.topic}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {card.tags.slice(0, 5).map(tag => (
                                <span key={tag} className="px-2 py-1 text-[10px] font-bold uppercase bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg">{tag}</span>
                            ))}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-8 overflow-y-auto space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {displayOrder.map((key) => {
                            const value = card[key];
                            if (typeof value === 'string' && value.trim()) {
                                const isFullWidth = key === 'summary' || key === 'conclusions' || key === 'keyEvidence';
                                return (
                                    <div key={key} className={isFullWidth ? "md:col-span-2" : ""}>
                                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{fieldLabels[key] || key}</h4>
                                        {key === 'keyEvidence' ? (
                                            <EvidenceDisplay evidenceText={value} />
                                        ) : (
                                            <p className={`text-base text-slate-800 whitespace-pre-wrap leading-relaxed ${key === 'summary' || key === 'conclusions' ? 'bg-white p-4 rounded-xl border border-slate-100 shadow-sm' : ''}`}>
                                                {value}
                                            </p>
                                        )}
                                    </div>
                                );
                            }
                            return null;
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReviewCardModal;
