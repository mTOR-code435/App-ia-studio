
import React, { createContext, useContext, ReactNode, useState } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { ReviewCard, FrameworkTopic, FrameworkAnalysisResult, RelevanceResult } from './types';

interface ResearchContextType {
    cards: ReviewCard[];
    setCards: (cards: ReviewCard[]) => void;
    researchFocus: { question: string; objectives: string };
    setResearchFocus: (focus: { question: string; objectives: string }) => void;
    frameworkTopics: FrameworkTopic[];
    setFrameworkTopics: (topics: FrameworkTopic[]) => void;
    frameworkAnalysis: FrameworkAnalysisResult;
    setFrameworkAnalysis: (analysis: FrameworkAnalysisResult) => void;
    relevanceData: Record<string, RelevanceResult>;
    setRelevanceData: (data: Record<string, RelevanceResult>) => void;
    selectedCardIds: Set<string>;
    setSelectedCardIds: (ids: Set<string>) => void;
}

const ResearchContext = createContext<ResearchContextType | undefined>(undefined);

export const ResearchProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [cards, setCards] = useLocalStorage<ReviewCard[]>('reviewCards', []);
    const [researchFocus, setResearchFocus] = useLocalStorage('researchFocus', {
        question: '¿Cuál es la condición de uso académico y común de la IA en la I.E. Nueva Granada?',
        objectives: '1. Identificar herramientas. 2. Describir frecuencia. 3. Establecer nivel TPACK. 4. Contrastar percepciones éticas.'
    });
    const [frameworkTopics, setFrameworkTopics] = useLocalStorage<FrameworkTopic[]>('frameworkTopics', []);
    const [frameworkAnalysis, setFrameworkAnalysis] = useLocalStorage<FrameworkAnalysisResult>('frameworkAnalysis', {});
    const [relevanceData, setRelevanceData] = useLocalStorage<Record<string, RelevanceResult>>('relevanceData', {});
    
    // Nueva gestión de selección compartida
    const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set());

    return (
        <ResearchContext.Provider value={{
            cards, setCards,
            researchFocus, setResearchFocus,
            frameworkTopics, setFrameworkTopics,
            frameworkAnalysis, setFrameworkAnalysis,
            relevanceData, setRelevanceData,
            selectedCardIds, setSelectedCardIds
        }}>
            {children}
        </ResearchContext.Provider>
    );
};

export const useResearch = () => {
    const context = useContext(ResearchContext);
    if (!context) throw new Error('useResearch must be used within ResearchProvider');
    return context;
};
