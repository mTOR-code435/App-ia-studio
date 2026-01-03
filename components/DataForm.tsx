
import React, { useState } from 'react';
import { type ReviewCardData } from '../types';

interface DataFormProps {
  cardData: ReviewCardData;
  onDataChange: (field: keyof ReviewCardData, value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isEditing: boolean;
}

const DataForm: React.FC<DataFormProps> = ({ cardData, onDataChange, onSubmit, onCancel, isEditing }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'content' | 'analysis'>('info');

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement | HTMLSelectElement>) => {
    onDataChange(e.target.name as keyof ReviewCardData, e.target.value);
  };

  return (
    <div className="space-y-6">
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            {(['info', 'content', 'analysis'] as const).map(tab => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${activeTab === tab ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    {tab === 'info' ? 'Básicos' : tab === 'content' ? 'Resultados' : 'Análisis'}
                </button>
            ))}
        </div>

        <div className="animate-view-change">
            {activeTab === 'info' && (
                <div className="space-y-4">
                    <Field label="Fuente de Evidencia" name="source" value={cardData.source} onChange={handleChange} placeholder="Ej: Entrevista Docente 1" />
                    <Field label="Tema / Título" name="topic" value={cardData.topic} onChange={handleChange} isTextarea rows={2} />
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Rol Participante" name="participantRole" value={cardData.participantRole} onChange={handleChange} isSelect options={['Docente', 'Estudiante', 'Ambos']} />
                        <Field label="Tipo Evidencia" name="evidenceType" value={cardData.evidenceType} onChange={handleChange} placeholder="Ej: Cualitativa" />
                    </div>
                    <Field label="Etiquetas (separadas por coma)" name="tags" value={cardData.tags} onChange={handleChange} placeholder="IA, Ética, TPACK..." />
                </div>
            )}

            {activeTab === 'content' && (
                <div className="space-y-4">
                    <Field label="Resumen de la Evidencia" name="summary" value={cardData.summary} onChange={handleChange} isTextarea rows={3} />
                    <Field label="Conclusiones Principales" name="conclusions" value={cardData.conclusions} onChange={handleChange} isTextarea rows={3} />
                    <Field label="Hallazgos Clave" name="keyFindings" value={cardData.keyFindings} onChange={handleChange} isTextarea rows={3} />
                    <Field label="Caracterización de Uso" name="usageDetails" value={cardData.usageDetails} onChange={handleChange} isTextarea rows={3} />
                </div>
            )}

            {activeTab === 'analysis' && (
                <div className="space-y-4">
                    <Field label="Conocimiento (TPACK) y Ética" name="contextualFactors" value={cardData.contextualFactors} onChange={handleChange} isTextarea rows={3} />
                    <Field label="Notas Comparativas" name="comparativeNotes" value={cardData.comparativeNotes} onChange={handleChange} isTextarea rows={3} />
                    <Field label="Desafíos y Oportunidades" name="challengesOpportunities" value={cardData.challengesOpportunities} onChange={handleChange} isTextarea rows={3} />
                    <Field label="Citas Textuales" name="keyEvidence" value={cardData.keyEvidence} onChange={handleChange} isTextarea rows={5} placeholder="- 'Cita 1'..." />
                </div>
            )}
        </div>

        <div className="pt-6 border-t border-slate-200 flex flex-col gap-2">
            <button
                onClick={onSubmit}
                className="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition-all shadow-md active:scale-[0.98]"
            >
                {isEditing ? 'Guardar Cambios' : 'Añadir Ficha'}
            </button>
            <button onClick={onCancel} className="w-full bg-slate-200 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-300 transition-all">Cancelar</button>
        </div>
    </div>
  );
};

const Field: React.FC<{ label: string; name: string; value: string; onChange: any; placeholder?: string; isTextarea?: boolean; isSelect?: boolean; options?: string[]; rows?: number }> = ({ label, name, value, onChange, placeholder, isTextarea, isSelect, options, rows }) => (
    <div>
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{label}</label>
        {isSelect ? (
            <select name={name} value={value} onChange={onChange} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all">
                {options?.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
        ) : isTextarea ? (
            <textarea name={name} value={value} onChange={onChange} rows={rows || 3} placeholder={placeholder} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none" />
        ) : (
            <input type="text" name={name} value={value} onChange={onChange} placeholder={placeholder} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
        )}
    </div>
);

export default DataForm;
