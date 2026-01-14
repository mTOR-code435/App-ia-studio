
/**
 * Segmenta un texto largo en chunks manejables para RAG.
 * Utiliza una estrategia híbrida de párrafos y longitud máxima.
 */
export function segmentText(text: string, maxChunkSize: number = 1000, overlap: number = 100): string[] {
    if (!text) return [];

    // Limpieza básica
    const cleanText = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n');
    
    // División inicial por párrafos dobles
    const rawParagraphs = cleanText.split('\n\n');
    
    const chunks: string[] = [];
    let currentChunk = "";

    for (const paragraph of rawParagraphs) {
        const cleanPara = paragraph.trim();
        if (!cleanPara) continue;

        // Si el párrafo actual + el acumulado exceden el tamaño, guardamos el chunk
        if (currentChunk.length + cleanPara.length > maxChunkSize) {
            if (currentChunk) {
                chunks.push(currentChunk);
                // Iniciar nuevo chunk con overlap (últimas palabras del anterior)
                const words = currentChunk.split(' ');
                const overlapText = words.slice(-20).join(' '); // Overlap simple de ~20 palabras
                currentChunk = overlapText + "\n\n" + cleanPara;
            } else {
                // El párrafo por sí solo es gigante, lo forzamos (o podríamos subdividirlo por oraciones)
                if (cleanPara.length > maxChunkSize * 2) {
                    const sentences = cleanPara.split('. ');
                    let subChunk = "";
                    for(const sent of sentences) {
                         if ((subChunk.length + sent.length) > maxChunkSize) {
                             chunks.push(subChunk + ".");
                             subChunk = sent;
                         } else {
                             subChunk += (subChunk ? ". " : "") + sent;
                         }
                    }
                    if(subChunk) currentChunk = subChunk;
                } else {
                    currentChunk = cleanPara;
                }
            }
        } else {
            currentChunk += (currentChunk ? "\n\n" : "") + cleanPara;
        }
    }

    if (currentChunk) {
        chunks.push(currentChunk);
    }

    return chunks;
}

// Lista de Stop Words REDUCIDA (Solo gramaticales puras)
// Eliminamos: autores, dime, busca, encuentra, etc. para no perder intención.
const STOP_WORDS = new Set([
    'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 
    'y', 'o', 'pero', 'si', 'no', 'ni', 'que', 'qué', 'cual', 'cuál',
    'de', 'del', 'a', 'al', 'en', 'con', 'por', 'para', 'sin', 'sobre', 'entre',
    'es', 'son', 'fue', 'fueron', 'era', 'eran', 'ser', 'estar',
    'se', 'su', 'sus', 'mi', 'mis', 'tu', 'tus',
    'este', 'esta', 'estos', 'estas', 'eso', 'esto',
    'como', 'donde', 'cuando'
]);

// Helper para normalizar texto (quitar tildes, minúsculas)
const normalize = (str: string) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

/**
 * Algoritmo de búsqueda mejorado (Stop Words + Score Boosting).
 * Retorna los chunks más relevantes para una query.
 */
export function retrieveRelevantChunks(query: string, allCards: any[], topK: number = 8): { text: string, source: string, score: number }[] {
    const normalizedQuery = normalize(query);
    
    // 1. Filtrado de Stop Words suave
    const queryTerms = normalizedQuery
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length >= 2 && !STOP_WORDS.has(w));
    
    // Fallback: Si se borró todo, usar la query original
    const finalTerms = queryTerms.length > 0 ? queryTerms : normalizedQuery.split(/\s+/).filter(w => w.length >= 2);

    if (finalTerms.length === 0) return [];

    const scoredChunks: { text: string, source: string, score: number }[] = [];

    allCards.forEach(card => {
        // 1. Buscar en Chunks (Texto completo)
        if (card.chunks && card.chunks.length > 0) {
            card.chunks.forEach((chunk: string) => {
                const lowerChunk = normalize(chunk);
                let score = 0;
                
                finalTerms.forEach(term => {
                    if (lowerChunk.includes(term)) score += 3; // Coincidencia parcial
                    
                    // Regex match (palabra completa)
                    try {
                        const regex = new RegExp(`\\b${term}\\b`, 'g');
                        const count = (lowerChunk.match(regex) || []).length;
                        score += count * 2;
                    } catch (e) {
                        // Fallback si el término tiene caracteres raros para regex
                        if (lowerChunk.includes(" " + term + " ")) score += 2;
                    }
                });

                if (score > 0) {
                    scoredChunks.push({
                        text: chunk,
                        source: card.source,
                        score: score
                    });
                }
            });
        } 
        
        // 2. Buscar en Metadatos (Resumen/Hallazgos/Topic)
        // Aumentamos el peso de los metadatos para asegurar que siempre haya "algo" si no hay chunks exactos
        const metaText = normalize(`${card.source || ''} ${card.topic || ''} ${card.summary || ''} ${card.keyFindings || ''}`);
        let metaScore = 0;
        finalTerms.forEach(term => {
             if (metaText.includes(term)) metaScore += 5.0; // Score muy alto para coincidencias en resumen/título
        });

        if (metaScore > 0) {
            scoredChunks.push({
                text: `[METADATA MATCH] TÍTULO: ${card.source}\nTEMA: ${card.topic}\nRESUMEN: ${card.summary}\nHALLAZGOS: ${card.keyFindings}`,
                source: card.source,
                score: metaScore
            });
        }
    });

    // Ordenar por score descendente y tomar topK
    const uniqueChunks = new Map();
    scoredChunks.forEach(item => {
        // Deduplicar basado en texto exacto
        if (!uniqueChunks.has(item.text)) {
            uniqueChunks.set(item.text, item);
        } else {
            if (uniqueChunks.get(item.text).score < item.score) {
                uniqueChunks.set(item.text, item);
            }
        }
    });

    return Array.from(uniqueChunks.values()).sort((a, b) => b.score - a.score).slice(0, topK);
}
