
export interface ReviewCard {
  id: string;
  source: string; 
  topic: string; 
  participantRole: 'Docente' | 'Estudiante' | 'Ambos'; 
  evidenceType: string; 
  keyFindings: string; 
  usageDetails: string; 
  summary: string; 
  conclusions: string; 
  comparativeNotes: string; 
  challengesOpportunities: string; 
  contextualFactors: string; 
  keyEvidence: string; 
  conceptsDefinitions: string; 
  theoreticalFoundation: string; 
  antecedents: string; 
  dimensionsVariables: string; 
  methodologicalEvidence: string; 
  discussionReferences: string; 
  analysis_reasoning?: string; 
  chunks?: string[]; 
  tags: string[];
  fullText?: string;
}

export type ReviewCardData = Omit<ReviewCard, 'id' | 'tags'> & {
  tags: string;
};

export interface SynthesisMatrixCell {
  summary: string;
  justification: string;
}

export type SynthesisMatrixData = Record<string, Record<string, SynthesisMatrixCell>>;

export type ContributionType = 'Prácticas de Uso' | 'Percepciones' | 'Conocimiento (TPACK)' | 'Datos Cuantitativos' | 'Observaciones Cualitativas';

export interface RelevanceResult {
  relevance: 'Alta' | 'Media' | 'Baja';
  justification: string;
  relevanceScore: number;
  contributionType: ContributionType;
  contributionJustification: string;
}

export interface FrameworkTopic {
  id: string;
  title: string;
  level: number;
  parentId?: string;
  description?: string;
}

export interface FrameworkAnalysisItem {
  cardId: string;
  justification: string;
  relevanceScore: number;
  region?: 'Local (I.E.)' | 'Externo/Teórico';
}

export type FrameworkAnalysisResult = Record<string, FrameworkAnalysisItem[]>;

export interface CitationNetworkData {
  internalCitations: {
    citingCardId: string;
    citedCardId: string;
  }[];
  seminalWorks: {
    work: string;
    count: number;
    verificationStatus?: 'verified' | 'unverified' | 'not_found' | 'pending';
    verificationUrl?: string;
    verificationNote?: string;
  }[];
}

export interface AgentCritique {
    score: number; 
    strengths: string[];
    weaknesses: string[];
    suggestion: string;
    thinking?: string; // Nuevo: Para capturar el razonamiento del modelo Pro
}

export interface VaeVariation {
  type: 'reconstruction' | 'creative_exploration' | 'synthesis';
  title: string;
  content: string;
  reasoning: string;
  critique?: AgentCritique;
}

// NUEVOS TIPOS PARA INVESTIGACIÓN AVANZADA
export interface ConsistencyIssue {
    type: 'gap' | 'contradiction' | 'alignment';
    severity: 'high' | 'medium' | 'low';
    description: string;
    relatedObjective?: string;
    relatedCards?: string[];
}

export interface TriangulationResult {
    tensions: {
        topic: string;
        docentePerspective: string;
        estudiantePerspective: string;
        dialecticAnalysis: string;
    }[];
    emergentPatterns: string[];
}
