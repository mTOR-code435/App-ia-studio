
import { GoogleGenAI, Type } from "@google/genai";
import { type ReviewCardData, type ReviewCard, type RelevanceResult, type CitationNetworkData, type FrameworkAnalysisItem, type VaeVariation, type SynthesisMatrixData, type AgentCritique, type ConsistencyIssue, type TriangulationResult } from '../types';

// --- CONFIGURACIÓN DE MODELOS ---
const MODEL_FAST = "gemini-3-flash-preview";
const MODEL_EXTRACTION = "gemini-3-flash-preview";
const MODEL_COMPLEX = "gemini-3-pro-preview";
const MODEL_VISION = "gemini-3-flash-preview"; 

const THINKING_BUDGET = 16000;

function getApiKey() {
    let apiKey = typeof window !== 'undefined' ? localStorage.getItem('gemini_api_key_custom') : null;
    return apiKey || process.env.API_KEY;
}

function repairTruncatedJSON(jsonStr: string): string {
    let text = jsonStr.trim();
    if (text.endsWith(',')) text = text.slice(0, -1);
    const stack: string[] = [];
    let isInsideString = false;
    let escaped = false;
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"' && !escaped) {
            isInsideString = !isInsideString;
        } else if (!isInsideString) {
            if (char === '{' || char === '[') stack.push(char);
            else if (char === '}' || char === ']') stack.pop();
        }
        escaped = char === '\\' && !escaped;
    }
    if (isInsideString) text += '"';
    while (stack.length > 0) {
        const last = stack.pop();
        if (last === '{') text += '}';
        else if (last === '[') text += ']';
    }
    return text;
}

function cleanAndParseJSON(text: string | undefined): any {
    if (!text) return null;
    let clean = text.trim();
    clean = clean.replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/\s*```$/, "");
    try {
        return JSON.parse(clean);
    } catch (e) {
        try {
            const repaired = repairTruncatedJSON(clean);
            return JSON.parse(repaired);
        } catch (e2) {
            return null;
        }
    }
}

export async function validateApiKey(key: string): Promise<boolean> {
    try {
        const ai = new GoogleGenAI({ apiKey: key });
        await ai.models.generateContent({ model: MODEL_FAST, contents: "ping" });
        return true;
    } catch (e) { return false; }
}

export async function extractInfoFromText(text: string): Promise<ReviewCardData | null> {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("API KEY no encontrada.");
    const ai = new GoogleGenAI({ apiKey });
    const chunk = text.substring(0, 800000);
    try {
        const response = await ai.models.generateContent({
            model: MODEL_EXTRACTION,
            contents: `Actúa como un experto investigador en IA Educativa. Extrae información exhaustiva siguiendo la estructura de la "I.E. Nueva Granada". 
            REGLA DE ORO: NO incluyas metadatos, etiquetas de control, o palabras clave repetitivas en los campos de texto. Limítate a la redacción académica formal.
            DOCUMENTO: ${chunk}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        source: { type: Type.STRING },
                        topic: { type: Type.STRING },
                        participantRole: { type: Type.STRING },
                        evidenceType: { type: Type.STRING },
                        summary: { type: Type.STRING },
                        keyFindings: { type: Type.STRING },
                        usageDetails: { type: Type.STRING },
                        conclusions: { type: Type.STRING },
                        comparativeNotes: { type: Type.STRING },
                        challengesOpportunities: { type: Type.STRING },
                        contextualFactors: { type: Type.STRING },
                        keyEvidence: { type: Type.STRING },
                        conceptsDefinitions: { type: Type.STRING },
                        theoreticalFoundation: { type: Type.STRING },
                        antecedents: { type: Type.STRING },
                        dimensionsVariables: { type: Type.STRING },
                        methodologicalEvidence: { type: Type.STRING },
                        discussionReferences: { type: Type.STRING },
                        suggestedTags: { type: Type.ARRAY, items: { type: Type.STRING } },
                        analysis_reasoning: { type: Type.STRING }
                    },
                    required: ["source", "topic", "summary"]
                }
            }
        });
        const data = cleanAndParseJSON(response.text);
        if (!data) return null;
        return { ...data, tags: Array.isArray(data.suggestedTags) ? data.suggestedTags.join(', ') : '', fullText: text };
    } catch (e) { return null; }
}

export async function analyzeFrameworkRelevance(cards: ReviewCard[], topicTitle: string): Promise<FrameworkAnalysisItem[]> {
    if (cards.length === 0) return [];
    const apiKey = getApiKey();
    if (!apiKey) return [];
    const ai = new GoogleGenAI({ apiKey });
    try {
        const cardsContext = cards.map(c => `ID: ${c.id}\nFUENTE: ${c.source}\nRESUMEN: ${c.summary}`).join('\n---\n');
        const response = await ai.models.generateContent({
            model: MODEL_FAST,
            contents: `Evalúa la relevancia de estas fichas para el tema: "${topicTitle}".\nFICHAS:\n${cardsContext}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            cardId: { type: Type.STRING },
                            relevanceScore: { type: Type.NUMBER },
                            justification: { type: Type.STRING },
                            region: { type: Type.STRING }
                        },
                        required: ["cardId", "relevanceScore", "justification"]
                    }
                }
            }
        });
        return cleanAndParseJSON(response.text) || [];
    } catch (e) { return []; }
}

export async function suggestThemesFromCards(cards: ReviewCard[]): Promise<string[]> {
    if (cards.length === 0) return [];
    const apiKey = getApiKey();
    if (!apiKey) return [];
    const ai = new GoogleGenAI({ apiKey });
    try {
        const context = cards.map(c => `- ${c.topic}: ${c.summary}`).join('\n');
        const response = await ai.models.generateContent({
            model: MODEL_FAST,
            contents: `Sugiere 5 categorías para una matriz de síntesis:\n${context}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: { themes: { type: Type.ARRAY, items: { type: Type.STRING } } }
                }
            }
        });
        const data = cleanAndParseJSON(response.text);
        return data?.themes || [];
    } catch (e) { return []; }
}

export async function generateSynthesisMatrix(cards: ReviewCard[], themes: string[]): Promise<SynthesisMatrixData> {
    const apiKey = getApiKey();
    if (!apiKey) return {};
    const ai = new GoogleGenAI({ apiKey });
    const matrix: SynthesisMatrixData = {};
    for (const card of cards) {
        try {
            const response = await ai.models.generateContent({
                model: MODEL_FAST,
                contents: `Analiza la ficha de "${card.source}" para estos temas: ${themes.join(', ')}.\nContenido: ${card.summary}\nHallazgos: ${card.keyFindings}`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: themes.reduce((acc: any, theme) => {
                            acc[theme] = { type: Type.OBJECT, properties: { summary: { type: Type.STRING }, justification: { type: Type.STRING } } };
                            return acc;
                        }, {})
                    }
                }
            });
            const cardData = cleanAndParseJSON(response.text);
            if (cardData) matrix[card.id] = cardData;
        } catch (e) { console.error(`Error en matriz para ficha ${card.id}`, e); }
    }
    return matrix;
}

export async function runLibrarianAgent(citation: string): Promise<any> {
    const apiKey = getApiKey();
    if (!apiKey) return null;
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
        model: MODEL_FAST,
        contents: `Bibliotecario académico. Verifica la obra: "${citation}".`,
        config: { tools: [{ googleSearch: {} }] }
    });
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const verificationUrl = groundingChunks?.[0]?.web?.uri;
    return { 
        status: response.text?.toLowerCase().includes('no se encontró') ? 'not_found' : 'verified',
        url: verificationUrl,
        note: response.text 
    };
}

export async function runCriticalAgent(draft: string, context: string, cards: ReviewCard[] = []): Promise<AgentCritique> {
    const apiKey = getApiKey();
    if (!apiKey) return { score: 0, strengths: [], weaknesses: [], suggestion: "" };
    const ai = new GoogleGenAI({ apiKey });
    const evidence = cards.map(c => `${c.source}: ${c.keyFindings}`).join('\n');
    const response = await ai.models.generateContent({
        model: MODEL_COMPLEX,
        contents: `Crítica académica formal.\nBORRADOR: ${draft}\nEVIDENCIA: ${evidence}`,
        config: {
            thinkingConfig: { thinkingBudget: THINKING_BUDGET },
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    score: { type: Type.NUMBER },
                    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                    weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                    suggestion: { type: Type.STRING }
                }
            }
        }
    });
    return cleanAndParseJSON(response.text);
}

export async function refineDraftText(original: string, instruction: string, cards: ReviewCard[], tone: string, temperature: number): Promise<string> {
    const apiKey = getApiKey();
    if (!apiKey) return original;
    const ai = new GoogleGenAI({ apiKey });
    const evidence = cards.map(c => `FUENTE: ${c.source}\nHALLAZGOS: ${c.keyFindings}`).join('\n---\n');
    
    const response = await ai.models.generateContent({ 
        model: MODEL_COMPLEX, 
        contents: `Actúa como un editor académico experto. Refina el siguiente fragmento de tesis doctoral.
        
        INSTRUCCIÓN DE REFINAMIENTO: ${instruction}
        FRAGMENTO ACTUAL: ${original}
        TONO REQUERIDO: ${tone}
        FUENTES DISPONIBLES:\n${evidence}
        
        REQUISITOS:
        1. Mantén o inserta citas automáticas como [Fuente: Nombre exacto].
        2. Mejora la fluidez y el rigor académico.
        3. Devuelve únicamente el texto refinado.`, 
        config: { 
            temperature,
            thinkingConfig: { thinkingBudget: 8000 }
        } 
    });
    return response.text || original;
}

export async function generateVariationalDraft(cards: ReviewCard[], section: string, context: string, length: string, tone: string, temperature: number): Promise<VaeVariation[]> {
    const apiKey = getApiKey();
    if (!apiKey) return [];
    const ai = new GoogleGenAI({ apiKey });
    const sourceList = cards.map(c => c.source).join(', ');
    const evidence = cards.map(c => `FUENTE: ${c.source}\nHALLAZGOS: ${c.keyFindings}\nRESUMEN: ${c.summary}`).join('\n---\n');
    const lengthMap = { short: "máximo 1 párrafo breve", medium: "2-3 párrafos de extensión estándar", long: "extensión detallada (4+ párrafos)" };
    const toneMap = { descriptive: "neutral y expositivo", critical: "analítico, buscando tensiones y vacíos", comparative: "triangulando fuentes y buscando consensos" };

    const response = await ai.models.generateContent({
        model: MODEL_COMPLEX,
        contents: `Actúa como un redactor de tesis doctoral de élite. Genera 3 variaciones para la sección "${section}".
        FUENTES: ${sourceList}
        EXTENSIÓN: ${lengthMap[length as keyof typeof lengthMap]}.
        TONO: ${toneMap[tone as keyof typeof toneMap]}.
        CONTEXTO: ${context}
        EVIDENCIA:\n${evidence}
        REGLA DE CITAS: Usa [Fuente: Nombre].`,
        config: {
            temperature,
            thinkingConfig: { thinkingBudget: THINKING_BUDGET },
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        type: { type: Type.STRING },
                        title: { type: Type.STRING },
                        content: { type: Type.STRING },
                        reasoning: { type: Type.STRING }
                    },
                    required: ["type", "title", "content", "reasoning"]
                }
            }
        }
    });
    return cleanAndParseJSON(response.text) || [];
}

export async function auditMethodologicalConsistency(cards: ReviewCard[], objectives: string): Promise<ConsistencyIssue[]> {
    const apiKey = getApiKey();
    if (!apiKey) return [];
    const ai = new GoogleGenAI({ apiKey });
    const summary = cards.map(c => `${c.source}: ${c.keyFindings}`).join('\n');
    const response = await ai.models.generateContent({
        model: MODEL_COMPLEX,
        contents: `Auditoría de consistencia.\nOBJETIVOS: ${objectives}\nHALLAZGOS: ${summary}`,
        config: {
            thinkingConfig: { thinkingBudget: THINKING_BUDGET },
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: { type: { type: Type.STRING }, severity: { type: Type.STRING }, description: { type: Type.STRING }, relatedObjective: { type: Type.STRING } }
                }
            }
        }
    });
    return cleanAndParseJSON(response.text) || [];
}

export async function triangulatePerspectives(cards: ReviewCard[]): Promise<TriangulationResult> {
    const apiKey = getApiKey();
    if (!apiKey) return { tensions: [], emergentPatterns: [] };
    const ai = new GoogleGenAI({ apiKey });
    const docs = cards.map(c => `[${c.participantRole}] ${c.source}: ${c.usageDetails}`).join('\n');
    const response = await ai.models.generateContent({
        model: MODEL_COMPLEX,
        contents: `Triangulación Docente vs Estudiante.\nEVIDENCIA:\n${docs}`,
        config: {
            thinkingConfig: { thinkingBudget: THINKING_BUDGET },
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    tensions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { topic: { type: Type.STRING }, docentePerspective: { type: Type.STRING }, estudiantePerspective: { type: Type.STRING }, dialecticAnalysis: { type: Type.STRING } } } },
                    emergentPatterns: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
            }
        }
    });
    return cleanAndParseJSON(response.text);
}

export async function sendChatMessage(history: any[], msg: string, cards: ReviewCard[], matrixData?: SynthesisMatrixData | null, matrixThemes?: string[]): Promise<string> {
    const apiKey = getApiKey();
    if (!apiKey) return "API Key faltante.";
    const ai = new GoogleGenAI({ apiKey });
    let context = cards.slice(0, 20).map(c => `FUENTE: ${c.source}\nRESUMEN: ${c.summary}\nHALLAZGOS: ${c.keyFindings}`).join('\n---\n');
    if (matrixData && matrixThemes && matrixThemes.length > 0) {
        context += "\n\nDATOS DE MATRIZ:\n";
        cards.forEach(card => {
            if (matrixData[card.id]) {
                context += `\nPara "${card.source}":\n`;
                matrixThemes.forEach(theme => { if (matrixData[card.id][theme]) { context += `- ${theme}: ${matrixData[card.id][theme].summary}\n`; } });
            }
        });
    }
    try {
        const res = await ai.models.generateContent({
            model: MODEL_FAST,
            contents: [
                { role: 'user', parts: [{ text: `Eres un asistente de investigación doctoral. Tu base de conocimientos son las siguientes fichas de evidencia cargadas por el usuario. 
                REGLAS:
                1. Cita SIEMPRE como [Fuente: Nombre exacto de la fuente].
                2. No inventes datos fuera del contexto proporcionado. 
                3. Si la información no está en las fichas, admítelo e intenta razonar desde lo que sí tienes.
                
                CONTEXTO DE INVESTIGACIÓN:\n${context}` }] },
                ...history,
                { role: 'user', parts: [{ text: msg }] }
            ]
        });
        return res.text || "No se pudo generar respuesta.";
    } catch (e) { throw e; }
}

export async function suggestSubtopics(topic: string, context: string): Promise<string[]> {
    const apiKey = getApiKey();
    if (!apiKey) return [];
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
        model: MODEL_FAST,
        contents: `Subtemas para "${topic}" en: ${context}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: { type: Type.OBJECT, properties: { subtopics: { type: Type.ARRAY, items: { type: Type.STRING } } } }
        }
    });
    const data = cleanAndParseJSON(response.text);
    return data?.subtopics || [];
}

export async function analyzeCardRelevance(card: ReviewCard, q: string, obj: string): Promise<RelevanceResult> {
    const apiKey = getApiKey();
    if (!apiKey) return { relevance: 'Baja', justification: '', relevanceScore: 0, contributionType: 'Percepciones', contributionJustification: '' };
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
        model: MODEL_FAST,
        contents: `Relevancia de ficha para: ${q}\nCONTENIDO: ${card.summary}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: { type: Type.OBJECT, properties: { relevance: { type: Type.STRING }, justification: { type: Type.STRING }, relevanceScore: { type: Type.NUMBER }, contributionType: { type: Type.STRING }, contributionJustification: { type: Type.STRING } } }
        }
    });
    return cleanAndParseJSON(response.text);
}

export async function generateProblemStatement(cards: ReviewCard[]): Promise<string> {
    const apiKey = getApiKey();
    if (!apiKey) return "";
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
        model: MODEL_COMPLEX,
        contents: `Planteamiento del problema doctoral.\nEVIDENCIAS: ${cards.map(c => c.keyFindings).join('\n')}`,
        config: { thinkingConfig: { thinkingBudget: THINKING_BUDGET } }
    });
    return response.text;
}

export async function generateCitationNetwork(cards: ReviewCard[]): Promise<CitationNetworkData> {
    const apiKey = getApiKey();
    if (!apiKey) return { internalCitations: [], seminalWorks: [] };
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
        model: MODEL_FAST,
        contents: `Red de citas.\nFUENTES: ${cards.map(c => c.source).join(', ')}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: { type: Type.OBJECT, properties: { internalCitations: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { citingCardId: { type: Type.STRING }, citedCardId: { type: Type.STRING } } } }, seminalWorks: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { work: { type: Type.STRING }, count: { type: Type.NUMBER } } } } }
        }
    });
    return cleanAndParseJSON(response.text);
}

export async function generateAcademicConversation(cards: ReviewCard[], q: string, o: string, focus: string, instr: string): Promise<string> {
    const apiKey = getApiKey();
    if (!apiKey) return "";
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
        model: MODEL_COMPLEX,
        contents: `Análisis académico.\nPREGUNTA: ${q}\nENFOQUE: ${focus}\nCONTENIDO: ${cards.map(c => c.summary).join('\n')}`,
        config: { thinkingConfig: { thinkingBudget: THINKING_BUDGET } }
    });
    return response.text;
}

export async function extractInfoFromImage(base64Data: string, mimeType: string): Promise<any> { 
    const apiKey = getApiKey();
    if (!apiKey) return null;
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({ contents: { parts: [{ inlineData: { data: base64Data, mimeType } }, { text: "Extrae información académica." }] }, model: MODEL_VISION });
    return cleanAndParseJSON(response.text);
}
