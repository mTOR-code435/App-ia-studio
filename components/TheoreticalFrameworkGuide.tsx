import React, { useState, useMemo } from 'react';
import { type ReviewCard, type FrameworkTopic, type FrameworkAnalysisResult, type FrameworkAnalysisItem } from '../types';
import { suggestSubtopics } from '../services/geminiService';

// --- PROPS INTERFACE ---
interface TheoreticalFrameworkGuideProps {
    cards: ReviewCard[];
    topics: FrameworkTopic[];
    setTopics: (topics: FrameworkTopic[]) => void;
    linkedEvidence: FrameworkAnalysisResult;
    setLinkedEvidence: (data: FrameworkAnalysisResult) => void;
    onFindEvidence: (topicId: string, topicTitle: string) => Promise<void>;
    loadingStates: Record<string, boolean>;
    error: string | null;
    onViewCard: (cardId: string) => void;
    researchFocus: { question: string, objectives: string };
    onLoadSuggestedFramework: () => void;
}

// --- TOPIC NODE SUB-COMPONENT ---
interface TopicNodeProps extends Omit<TheoreticalFrameworkGuideProps, 'researchFocus' | 'setLinkedEvidence' | 'onLoadSuggestedFramework'> {
    topic: FrameworkTopic;
    allTopics: FrameworkTopic[];
    level: number;
    onAdd: (parentId?: string) => void;
    onUpdate: (id: string, newTitle: string) => void;
    onDelete: (id: string) => void;
    onSuggestSubtopics: (topic: FrameworkTopic) => Promise<void>;
    suggestionLoadingState: Record<string, boolean>;
}

const TopicNode: React.FC<TopicNodeProps> = (props) => {
    const {
        topic, allTopics, level, cards, linkedEvidence, onFindEvidence, loadingStates, onViewCard,
        onAdd, onUpdate, onDelete, onSuggestSubtopics, suggestionLoadingState
    } = props;
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(topic.title);
    const [isExpanded, setIsExpanded] = useState(true);

    const cardMap = useMemo(() => new Map(cards.map(card => [card.id, card])), [cards]);
    const children = useMemo(() => allTopics.filter(t => t.parentId === topic.id), [allTopics, topic.id]);

    const allEvidence = useMemo(() => (linkedEvidence[topic.id] || []).sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0)), [linkedEvidence, topic.id]);
    const latamEvidence = useMemo(() => allEvidence.filter(e => e.region === 'Latinoamericano'), [allEvidence]);
    const internationalEvidence = useMemo(() => allEvidence.filter(e => e.region !== 'Latinoamericano'), [allEvidence]);


    const handleUpdate = () => {
        if (title.trim()) {
            onUpdate(topic.id, title.trim());
            setIsEditing(false);
        }
    };
    
    const renderEvidenceItems = (items: FrameworkAnalysisItem[]) => (
        <div className="mt-1 space-y-2">
            {items.map(item => {
                const card = cardMap.get(item.cardId);
                if (!card) return null;
                return (
                    <div key={item.cardId} className="p-2 bg-indigo-50 rounded-md">
                        <div className="flex justify-between items-start">
                            <button onClick={() => onViewCard(card.id)} className="font-semibold text-indigo-700 hover:underline text-left text-sm">
                                {card.source}
                            </button>
                            <span className="flex-shrink-0 font-bold text-indigo-800 bg-indigo-200 px-2.5 py-1 rounded-full text-xs" title={`Puntaje de relevancia: ${item.relevanceScore} de 10`}>{item.relevanceScore}/10</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{item.justification}</p>
                    </div>
                );
            })}
        </div>
    );

    return (
        <div style={{ marginLeft: `${level * 24}px` }} className="mt-2">
            <div className="bg-white p-3 rounded-lg border border-slate-200 group">
                {/* Topic Title and Main Actions */}
                <div className="flex items-center gap-2">
                     <button onClick={() => setIsExpanded(!isExpanded)} className="p-1 text-slate-400 hover:text-slate-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                    </button>
                    {isEditing ? (
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onBlur={handleUpdate}
                            onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
                            className="flex-grow text-md font-semibold text-slate-800 p-1 border-indigo-500 border rounded-md"
                            autoFocus
                        />
                    ) : (
                        <p className={`flex-grow text-md font-semibold text-slate-800 ${topic.level === 0 ? 'text-lg text-indigo-800' : ''}`} onClick={() => setIsEditing(true)}>
                            {topic.title}
                        </p>
                    )}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onAdd(topic.id)} className="p-1 rounded-md hover:bg-slate-100 text-slate-500 tooltip" aria-label="Añadir subtema">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span className="tooltip-text !w-auto !-translate-x-1/4">Añadir Subtema</span>
                        </button>
                         <button onClick={() => onSuggestSubtopics(topic)} disabled={suggestionLoadingState[topic.id]} className="p-1 rounded-md hover:bg-slate-100 text-slate-500 tooltip" aria-label="Sugerir subtemas con IA">
                            {suggestionLoadingState[topic.id] ? <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>}
                            <span className="tooltip-text !w-auto !-translate-x-1/4">Sugerir Subtemas</span>
                        </button>
                        <button onClick={() => setIsEditing(true)} className="p-1 rounded-md hover:bg-slate-100 text-slate-500 tooltip" aria-label="Editar">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>
                           <span className="tooltip-text !w-auto !-translate-x-1/4">Editar</span>
                        </button>
                        <button onClick={() => onDelete(topic.id)} className="p-1 rounded-md hover:bg-slate-100 text-slate-500 tooltip" aria-label="Eliminar">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            <span className="tooltip-text !w-auto !-translate-x-1/2">Eliminar</span>
                        </button>
                    </div>
                </div>

                {/* Collapsible Content */}
                <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[5000px] mt-3' : 'max-h-0'}`}>
                    {topic.description && (
                        <div className="mb-3 p-3 bg-indigo-50 border border-indigo-200 rounded-md">
                            <h4 className="font-bold text-xs text-indigo-800 uppercase tracking-wider">Propósito y Contenido a Desarrollar</h4>
                            <p className="mt-1 text-sm text-indigo-900 whitespace-pre-wrap">{topic.description}</p>
                        </div>
                    )}
                    <div className="border-t border-slate-200 pt-3">
                         <h4 className="font-bold text-sm text-slate-600 mb-2">Evidencia Vinculada</h4>
                         <button
                            onClick={() => onFindEvidence(topic.id, topic.title)}
                            disabled={loadingStates[topic.id] || cards.length === 0}
                            className="w-full text-sm bg-indigo-100 text-indigo-700 font-semibold hover:bg-indigo-200 px-3 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loadingStates[topic.id] ? <><svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Buscando...</> : 'Buscar Evidencia Relevante con IA'}
                        </button>
                        
                         <div className="mt-3">
                            {latamEvidence.length > 0 && (
                                <div className="mb-4">
                                    <h5 className="font-semibold text-sm text-slate-700">Evidencia Latinoamericana</h5>
                                    {renderEvidenceItems(latamEvidence)}
                                </div>
                            )}
                             {internationalEvidence.length > 0 && (
                                <div>
                                    <h5 className="font-semibold text-sm text-slate-700">Evidencia Internacional</h5>
                                    {renderEvidenceItems(internationalEvidence)}
                                </div>
                            )}
                            {allEvidence.length === 0 && (
                                 <p className="text-xs text-slate-500 text-center py-2">No hay evidencia vinculada a este tema. Usa el botón de arriba para que la IA la encuentre por ti.</p>
                             )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Render Children */}
            {isExpanded && children.map(child => (
                <TopicNode key={child.id} {...props} topic={child} level={level + 1} />
            ))}
        </div>
    );
};


// --- MAIN COMPONENT ---
const TheoreticalFrameworkGuide: React.FC<TheoreticalFrameworkGuideProps> = ({
    cards, topics, setTopics, linkedEvidence, setLinkedEvidence, onFindEvidence, loadingStates, error, onViewCard, researchFocus, onLoadSuggestedFramework
}) => {
    const [activeMethod, setActiveMethod] = useState<'indexing' | 'mapping'>('indexing');
    const [newRootTopicTitle, setNewRootTopicTitle] = useState('');
    const [suggestionLoadingState, setSuggestionLoadingState] = useState<Record<string, boolean>>({});

    const handleAddTopic = (parentId?: string) => {
        const title = parentId ? 'Nuevo Subtema' : newRootTopicTitle.trim();
        if (!parentId && !title) return;

        const newTopic: FrameworkTopic = {
            id: `topic_${crypto.randomUUID()}`,
            title,
            level: parentId ? (topics.find(t => t.id === parentId)?.level ?? 0) + 1 : 0,
            parentId,
        };
        setTopics([...topics, newTopic]);
        if (!parentId) setNewRootTopicTitle('');
    };

    const handleUpdateTopic = (id: string, newTitle: string) => {
        setTopics(topics.map(t => t.id === id ? { ...t, title: newTitle } : t));
    };

    const handleDeleteTopic = (id: string) => {
        if (window.confirm('¿Seguro que quieres eliminar este tema y todos sus subtemas?')) {
            const idsToDelete = new Set<string>();
            const queue: string[] = [id];
            
            // Find the topic to be deleted and all its descendants using a queue (BFS)
            while (queue.length > 0) {
                const currentId = queue.shift()!;
                if (!idsToDelete.has(currentId)) {
                    idsToDelete.add(currentId);
                    const children = topics.filter(t => t.parentId === currentId);
                    for (const child of children) {
                        queue.push(child.id);
                    }
                }
            }
            
            // Update topics state
            setTopics(currentTopics => currentTopics.filter(t => !idsToDelete.has(t.id)));
            
            // Update linked evidence state
            setLinkedEvidence(currentEvidence => {
                const newLinkedEvidence = { ...currentEvidence };
                idsToDelete.forEach(topicId => {
                    delete newLinkedEvidence[topicId];
                });
                return newLinkedEvidence;
            });
        }
    };
    
    const handleSuggestSubtopics = async (topic: FrameworkTopic) => {
        setSuggestionLoadingState(prev => ({ ...prev, [topic.id]: true }));
        try {
            const researchContext = `Pregunta: ${researchFocus.question}\nObjetivos: ${researchFocus.objectives}`;
            const suggestions = await suggestSubtopics(topic.title, researchContext);
            const newSubtopics: FrameworkTopic[] = suggestions.map((title) => ({
                id: `subtopic_${crypto.randomUUID()}`,
                title: title,
                level: topic.level + 1,
                parentId: topic.id,
            }));
            setTopics(prev => [...prev, ...newSubtopics]);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Ocurrió un error al sugerir subtemas.');
        } finally {
            setSuggestionLoadingState(prev => ({ ...prev, [topic.id]: false }));
        }
    };

    const rootTopics = useMemo(() => topics.filter(t => !t.parentId), [topics]);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-700">Construcción del Marco Teórico</h2>
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-bold text-blue-800">Guía Metodológica</h3>
                    <p className="text-sm text-blue-900 mt-1">
                        El Marco Teórico (Paso 3 en la metodología de <strong>Hernández Sampieri</strong>) no es solo una revisión de literatura; es la sustentación teórica del estudio. Su propósito es situar el problema de investigación dentro de un conjunto de conocimientos sólidos. Autores como <strong>Creswell</strong> enfatizan que, tanto en enfoques cuantitativos como cualitativos, el marco teórico guía las preguntas de investigación, la recolección de datos y el análisis.
                    </p>
                </div>
            </div>

            <div className="border-b border-slate-200">
                <nav className="-mb-px flex space-x-6" aria-label="Methods">
                    <button onClick={() => setActiveMethod('indexing')} className={`${activeMethod === 'indexing' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>
                        Método por Vertebración
                    </button>
                    <button onClick={() => setActiveMethod('mapping')} className={`${activeMethod === 'mapping' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>
                        Método de Mapeo
                    </button>
                </nav>
            </div>
            
            {activeMethod === 'indexing' && (
                <div className="animate-view-change space-y-4">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                        <h3 className="font-bold text-slate-800">Guía del Método por Vertebración</h3>
                        <p className="text-sm text-slate-600 mt-1">
                           Este método, recomendado por <strong>Sampieri</strong>, consiste en construir un índice jerárquico (la "columna vertebral") para organizar el estado del conocimiento. Se puede trabajar en dos direcciones:
                        </p>
                        <ul className="list-disc list-inside text-sm text-slate-600 mt-2 space-y-1">
                            <li><strong>Vertebración Directa (Deductivo):</strong> Empieza con temas generales y descomponlos en subtemas específicos. Puedes añadir temas manualmente o pedirle a la IA que sugiera subtemas para afinar tu índice.</li>
                            <li><strong>Vertebración Inversa (Inductivo):</strong> Ve a "Fichas de Evidencia", selecciona fichas con un patrón común y usa "Crear Tema desde Selección". La IA generará un constructo o tema que las agrupe.</li>
                             <li><strong>Poblar el Índice:</strong> En cada tema, usa "Buscar Evidencia Relevante" para que la IA encuentre y vincule las fichas más pertinentes, ayudándote a construir cada apartado de tu marco.</li>
                        </ul>
                    </div>

                    <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-4">
                        <div>
                            <label htmlFor="new-root-topic" className="font-semibold text-slate-700">Añadir Tema Principal al Índice (Vertebración Directa)</label>
                            <div className="flex gap-2 mt-2">
                                 <input
                                    id="new-root-topic"
                                    type="text"
                                    value={newRootTopicTitle}
                                    onChange={(e) => setNewRootTopicTitle(e.target.value)}
                                    placeholder="Ej: I. Contexto del Uso de IA en Educación"
                                    className="w-full px-3 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                                />
                                <button onClick={() => handleAddTopic()} className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">
                                    Añadir
                                </button>
                            </div>
                        </div>
                        <div className="border-t border-slate-200 pt-4">
                             <h4 className="font-semibold text-slate-700">Empezar con una Plantilla Metodológica</h4>
                            <p className="text-sm text-slate-500 mt-1">Carga una estructura recomendada, basada en la metodología de Sampieri, para tu estudio de caso. Esto reemplazará tu índice actual.</p>
                             <button
                                onClick={onLoadSuggestedFramework}
                                className="mt-2 w-full bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                            >
                                Cargar Estructura Sugerida
                            </button>
                        </div>
                    </div>

                    <div className="bg-slate-50/50 p-4 rounded-lg border border-slate-200">
                        {error && <div className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-800 p-4 rounded-md" role="alert"><p className="font-bold">Error en el Análisis</p><p>{error}</p></div>}
                        {rootTopics.length > 0 ? rootTopics.map(topic => (
                           <TopicNode
                                key={topic.id}
                                topic={topic}
                                allTopics={topics}
                                level={0}
                                cards={cards}
                                linkedEvidence={linkedEvidence}
                                onFindEvidence={onFindEvidence}
                                loadingStates={loadingStates}
                                onViewCard={onViewCard}
                                onAdd={handleAddTopic}
                                onUpdate={handleUpdateTopic}
                                onDelete={handleDeleteTopic}
                                onSuggestSubtopics={handleSuggestSubtopics}
                                suggestionLoadingState={suggestionLoadingState}
                           />
                        )) : (
                            <p className="text-center text-slate-500 py-4">Tu índice está vacío. Comienza añadiendo un tema principal o carga la estructura sugerida.</p>
                        )}
                    </div>
                </div>
            )}

            {activeMethod === 'mapping' && (
                <div className="animate-view-change space-y-4">
                     <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                        <h3 className="font-bold text-slate-800">Guía del Método de Mapeo</h3>
                        <p className="text-sm text-slate-600 mt-1">
                            Este método, también parte de la revisión de literatura, implica elaborar un mapa conceptual para identificar visualmente los conceptos clave y sus relaciones. Con base en este mapa, se profundiza en la vinculación de evidencias.
                        </p>
                        <p className="text-sm text-slate-600 mt-2">
                            Utiliza el siguiente espacio para esbozar tus ideas, variables, y las conexiones entre ellas. Este ejercicio te ayudará a estructurar tu índice de vertebración.
                        </p>
                    </div>
                    <textarea 
                        className="w-full h-96 p-4 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                        placeholder="Ej: Concepto Central: Percepciones Docentes sobre IA&#x0a;  -> Variable Relacionada: Formación Docente&#x0a;  -> Variable Relacionada: Políticas Institucionales&#x0a;  -> Variable de Contexto: Años de experiencia..."
                    />
                </div>
            )}
        </div>
    );
};

export default TheoreticalFrameworkGuide;