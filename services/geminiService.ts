
import { GoogleGenAI, Type } from "@google/genai";
import { type ReviewCardData, type ReviewCard, type RelevanceResult, type CitationNetworkData, type FrameworkAnalysisItem, ContributionType } from '../types';

const API_KEY = typeof process !== 'undefined' && process.env ? process.env.API_KEY : undefined;
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

const checkApiAvailability = () => {
    if (!ai) {
        throw new Error("La clave de API de Gemini no está configurada.");
    }
};

const handleGeminiError = (error: any, context: string): never => {
    console.error(`Error en ${context} con Gemini:`, error);
    let message = error?.message || error?.toString() || 'Error desconocido';
    throw new Error(`No se pudo ${context}. Detalles: ${message}`);
};

const EMPTY_FORM_DATA: Omit<ReviewCardData, 'fullText'> = {
    source: '', topic: '', participantRole: 'Docente', evidenceType: '',
    keyFindings: '', usageDetails: '', summary: '', conclusions: '',
    comparativeNotes: '', challengesOpportunities: '', contextualFactors: '',
    keyEvidence: '', tags: ''
};

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        source: { type: Type.STRING },
        topic: { type: Type.STRING },
        participantRole: { type: Type.STRING },
        evidenceType: { type: Type.STRING },
        keyFindings: { type: Type.STRING },
        usageDetails: { type: Type.STRING },
        summary: { type: Type.STRING, description: "Resumen integrador del documento (aprox. 150 palabras)." },
        conclusions: { type: Type.STRING, description: "Conclusiones finales, cierre o resultados determinantes del estudio." },
        comparativeNotes: { type: Type.STRING },
        challengesOpportunities: { type: Type.STRING },
        contextualFactors: { type: Type.STRING },
        keyEvidence: { type: Type.STRING },
        suggestedTags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Exactamente de 4 a 5 etiquetas clave." }
    },
    required: [ 'source', 'topic', 'participantRole', 'evidenceType', 'keyFindings', 'usageDetails', 'summary', 'conclusions', 'comparativeNotes', 'challengesOpportunities', 'contextualFactors', 'keyEvidence', 'suggestedTags' ]
};

function chunkText(text: string, chunkSize: number = 12000, chunkOverlap: number = 500): string[] {
    if (text.length <= chunkSize) return [text];
    const chunks: string[] = [];
    let index = 0;
    while (index < text.length) {
        const end = Math.min(index + chunkSize, text.length);
        chunks.push(text.substring(index, end));
        index += chunkSize - chunkOverlap;
    }
    return chunks;
}

async function extractInfoFromChunk(chunk: string, totalChunks: number, chunkIndex: number): Promise<Partial<ReviewCardData>> {
    checkApiAvailability();
    const prompt = `Extrae datos de investigación sobre IA en educación. Este es el fragmento ${chunkIndex + 1}/${totalChunks}.
    IMPORTANTE: Diferencia claramente entre el Resumen (qué se hizo) y las Conclusiones (qué se determinó al final).
    Sugiere exactamente entre 4 y 5 etiquetas.
    
    TEXTO:
    ---
    ${chunk}
    ---`;
    
    try {
        const response = await ai!.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: responseSchema, temperature: 0.2 },
        });
        const rawData = JSON.parse(response.text.trim());
        return {
            source: rawData.source || '',
            topic: rawData.topic || '',
            participantRole: rawData.participantRole || 'Ambos',
            evidenceType: rawData.evidenceType || '',
            keyFindings: rawData.keyFindings || '',
            usageDetails: rawData.usageDetails || '',
            summary: rawData.summary || '',
            conclusions: rawData.conclusions || '',
            comparativeNotes: rawData.comparativeNotes || '',
            challengesOpportunities: rawData.challengesOpportunities || '',
            contextualFactors: rawData.contextualFactors || '',
            keyEvidence: rawData.keyEvidence || '',
            tags: (rawData.suggestedTags || []).join(', '),
        };
    } catch (error) {
        handleGeminiError(error, `fragmento ${chunkIndex + 1}`);
    }
}

async function consolidateChunkedData(results: Partial<ReviewCardData>[], fullText: string): Promise<ReviewCardData> {
    const source = results[0]?.source || '';
    const participantRole = results[0]?.participantRole || 'Ambos';
    const evidenceType = results[0]?.evidenceType || '';
    const keyFindings = results.map(r => r.keyFindings).filter(Boolean).join('\n- ');
    const usageDetails = results.map(r => r.usageDetails).filter(Boolean).join('\n\n');
    const comparativeNotes = results.map(r => r.comparativeNotes).filter(Boolean).join('\n\n');
    const challengesOpportunities = results.map(r => r.challengesOpportunities).filter(Boolean).join('\n\n');
    const contextualFactors = results.map(r => r.contextualFactors).filter(Boolean).join('\n\n');
    const keyEvidence = results.map(r => r.keyEvidence).filter(Boolean).join('\n- ');
    const allTags = results.flatMap(r => r.tags?.split(',').map(t => t.trim()).filter(Boolean) || []);
    const uniqueTags = [...new Set(allTags)].slice(0, 5).join(', ');

    const consolidationPrompt = `Sintetiza estos fragmentos en un registro académico único. 
    Asegúrate de tener un Resumen integrador y una sección de Conclusiones sólida.
    
    DATOS:
    ---
    ${results.map(r => `T: ${r.topic}\nR: ${r.summary}\nC: ${r.conclusions}`).join('\n\n')}
    ---`;
    
    try {
        const response = await ai!.models.generateContent({
            model: "gemini-2.5-flash",
            contents: consolidationPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        topic: { type: Type.STRING },
                        summary: { type: Type.STRING },
                        conclusions: { type: Type.STRING }
                    },
                    required: ['topic', 'summary', 'conclusions']
                }
            }
        });
        const consolidated = JSON.parse(response.text.trim());
        return {
            source, topic: consolidated.topic, participantRole, evidenceType,
            keyFindings: `- ${keyFindings}`, usageDetails, summary: consolidated.summary,
            conclusions: consolidated.conclusions, comparativeNotes, challengesOpportunities,
            contextualFactors, keyEvidence: `- ${keyEvidence}`, tags: uniqueTags, fullText
        };
    } catch (error) {
        handleGeminiError(error, "consolidación");
    }
}

export async function extractInfoFromText(text: string, onProgress?: (progress: string) => void): Promise<ReviewCardData | null> {
    checkApiAvailability();
    const chunks = chunkText(text);
    if (chunks.length <= 1) {
        const result = await extractInfoFromChunk(chunks[0] || text, 1, 0);
        return { ...EMPTY_FORM_DATA, ...result, fullText: text } as ReviewCardData;
    }
    const partialResults: Partial<ReviewCardData>[] = [];
    for (let i = 0; i < chunks.length; i++) {
        onProgress?.(`Procesando fragmento ${i + 1}/${chunks.length}...`);
        const res = await extractInfoFromChunk(chunks[i], chunks.length, i);
        if (res) partialResults.push(res);
    }
    return await consolidateChunkedData(partialResults, text);
}

export async function generateSynthesisMatrix(cards: ReviewCard[], themes: string[]) {
    checkApiAvailability();
    const prompt = `Genera matriz de síntesis académica para: ${themes.join(', ')}`;
    try {
        const response = await ai!.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json", temperature: 0.3 },
        });
        return JSON.parse(response.text.trim());
    } catch (error) { handleGeminiError(error, "matriz"); }
}

export async function suggestThemesFromCards(cards: ReviewCard[]) { return ["Uso", "Ética"]; }
export async function generateAcademicConversation(cards: ReviewCard[]) { return "Análisis..."; }
export async function generateResearchQuestions(cards: ReviewCard[]) { return ["?"]; }
export async function analyzeCardRelevance(card: ReviewCard, q: string, o: string) { return { relevance: 'Alta', relevanceScore: 90 } as any; }
export async function generateProblemStatement(cards: ReviewCard[]) { return "Problema..."; }
export async function analyzeFrameworkRelevance(cards: ReviewCard[], topic: string) { return []; }
export async function suggestSubtopics(t: string, c: string) { return []; }
export async function generateTopicFromCards(cards: ReviewCard[]) { return { title: "", analysis: [] }; }
export async function generateCitationNetwork(cards: ReviewCard[]) { return { internalCitations: [], seminalWorks: [] }; }
