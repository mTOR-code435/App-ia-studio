
import React, { useState } from 'react';
import { useResearch } from '../ResearchContext';
import { auditMethodologicalConsistency, triangulatePerspectives } from '../services/geminiService';
import { ConsistencyIssue, TriangulationResult } from '../types';
import Loader from './Loader';

const ConsistencyAuditor: React.FC = () => {
    const { cards, researchFocus } = useResearch();
    const [issues, setIssues] = useState<ConsistencyIssue[]>([]);
    const [triangulation, setTriangulation] = useState<TriangulationResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleAudit = async () => {
        setIsLoading(true);
        try {
            const result = await auditMethodologicalConsistency(cards, researchFocus.objectives);
            setIssues(result);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTriangulate = async () => {
        setIsLoading(true);
        try {
            const result = await triangulatePerspectives(cards);
            setTriangulation(result);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                    onClick={handleAudit} 
                    className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition-all text-left"
                >
                    <h3 className="font-bold text-indigo-800">Auditor de Consistencia</h3>
                    <p className="text-xs text-indigo-600">Verifica si tus hallazgos responden a los objetivos planteados.</p>
                </button>
                <button 
                    onClick={handleTriangulate}
                    className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-all text-left"
                >
                    <h3 className="font-bold text-emerald-800">Motor de Triangulación</h3>
                    <p className="text-xs text-emerald-600">Compara las perspectivas de Docentes vs Estudiantes.</p>
                </button>
            </div>

            {isLoading && <Loader message="Gemini 3 Pro analizando la red de evidencias..." />}

            <div className="space-y-4">
                {issues.length > 0 && (
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-fade-in">
                        <h4 className="text-lg font-bold text-slate-800 mb-4">Brechas y Consistencia Metodológica</h4>
                        <div className="space-y-3">
                            {issues.map((issue, idx) => (
                                <div key={idx} className={`p-3 rounded-lg border-l-4 ${issue.type === 'gap' ? 'bg-amber-50 border-amber-400' : issue.type === 'contradiction' ? 'bg-red-50 border-red-400' : 'bg-green-50 border-green-400'}`}>
                                    <div className="flex justify-between">
                                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">{issue.type}</span>
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${issue.severity === 'high' ? 'bg-red-100 text-red-700' : 'bg-slate-100'}`}>Severidad: {issue.severity}</span>
                                    </div>
                                    <p className="text-sm text-slate-800 mt-1">{issue.description}</p>
                                    {issue.relatedObjective && <p className="text-xs text-slate-500 mt-1 italic">Objetivo relacionado: {issue.relatedObjective}</p>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {triangulation && (
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-fade-in">
                        <h4 className="text-lg font-bold text-slate-800 mb-4">Triangulación: Tensiones Dialécticas</h4>
                        <div className="space-y-6">
                            {triangulation.tensions.map((tension, idx) => (
                                <div key={idx} className="border-b border-slate-100 pb-4 last:border-0">
                                    <h5 className="font-bold text-indigo-900 text-md mb-2">{tension.topic}</h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                        <div className="bg-slate-50 p-2 rounded">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Docentes</p>
                                            <p className="text-xs text-slate-700">{tension.docentePerspective}</p>
                                        </div>
                                        <div className="bg-slate-50 p-2 rounded">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Estudiantes</p>
                                            <p className="text-xs text-slate-700">{tension.estudiantePerspective}</p>
                                        </div>
                                    </div>
                                    <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                                        <p className="text-[10px] font-bold text-emerald-800 uppercase mb-1">Análisis Dialéctico</p>
                                        <p className="text-sm text-emerald-900">{tension.dialecticAnalysis}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConsistencyAuditor;
