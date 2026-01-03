
export interface ReviewCard {
  id: string;
  source: string; // Fuente de la evidencia (ej: Entrevista Docente 1, Encuesta Estudiantes)
  topic: string; // Tema central o título de la evidencia
  participantRole: 'Docente' | 'Estudiante' | 'Ambos'; // Rol del participante en el estudio
  evidenceType: string; // Tipo de evidencia (ej: Cuantitativa, Cualitativa)
  keyFindings: string; // Hallazgos clave o datos principales
  usageDetails: string; // Caracterización del uso (Común vs Académico)
  summary: string; // Resumen de la evidencia
  conclusions: string; // Conclusiones finales o cierre del documento
  comparativeNotes: string; // Notas comparativas entre Docentes y Estudiantes
  challengesOpportunities: string; // Desafíos y oportunidades identificados
  contextualFactors: string; // Factores de conocimiento (TPACK) y Percepción Ética
  keyEvidence: string; // Citas textuales, datos crudos o evidencia directa
  tags: string[];
  fullText?: string;
}


// Tipo para los datos del formulario antes de que se asigne un ID.
export type ReviewCardData = Omit<ReviewCard, 'id' | 'tags'> & {
  tags: string;
};

// Estructura de celda para la matriz
export interface SynthesisMatrixCell {
  summary: string;
  justification: string;
}

// Estructura de datos para la matriz de síntesis: { cardId: { theme: { summary, justification } } }
export type SynthesisMatrixData = Record<string, Record<string, SynthesisMatrixCell>>;

// Estructura para los resultados del análisis de relevancia de la IA
export type ContributionType = 'Prácticas de Uso' | 'Percepciones' | 'Conocimiento (TPACK)' | 'Datos Cuantitativos' | 'Observaciones Cualitativas';


export interface RelevanceResult {
  relevance: 'Alta' | 'Media' | 'Baja';
  justification: string;
  relevanceScore: number;
  contributionType: ContributionType;
  contributionJustification: string;
}

// Nuevos tipos para el Análisis por Marco Teórico
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

// Estructura para el análisis de red de citas
export interface CitationNetworkData {
  internalCitations: {
    citingCardId: string;
    citedCardId: string;
  }[];
  seminalWorks: {
    work: string;
    count: number;
  }[];
}
