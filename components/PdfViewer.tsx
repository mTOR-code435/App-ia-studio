import React, { useEffect, useRef, useState } from 'react';

interface PdfViewerProps {
  pdfUrl: string | null;
  highlightText?: string;
  onReupload: (file: File) => void;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ pdfUrl, highlightText, onReupload }) => {
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [pageScale, setPageScale] = useState(1.2); 
  
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<any>(null);

  // Helper: Normalización agresiva para ignorar espacios extra, saltos de línea y caracteres especiales
  const normalize = (text: string) => text.toLowerCase().replace(/\s+/g, '').replace(/[^\wáéíóúüñ]/g, '');

  // 1. Cargar el Documento PDF
  useEffect(() => {
    if (!pdfUrl) return;

    const loadPdf = async () => {
      try {
        // @ts-ignore
        const loadingTask = window.pdfjsLib.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
        setNumPages(pdf.numPages);
        setCurrentPage(1);
      } catch (error) {
        console.error("Error loading PDF:", error);
      }
    };
    loadPdf();
  }, [pdfUrl]);

  // 2. Lógica de Búsqueda de PÁGINA (Navigation)
  useEffect(() => {
    if (!pdfDoc || !highlightText || highlightText.length < 5) return;

    const findPage = async () => {
      const target = normalize(highlightText);
      // Tomamos un chunk significativo pero no todo, para evitar fallos por cortes de página
      const searchChunk = target.substring(0, 80); 
      
      // Optimización: Buscar primero en la página actual
      // (Omitido para brevedad, iteramos todo)

      let foundPage = -1;

      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        const pageTextRaw = textContent.items.map((item: any) => item.str).join('');
        const pageTextNorm = normalize(pageTextRaw);
        
        if (pageTextNorm.includes(searchChunk)) {
             foundPage = i;
             break;
        }
      }

      if (foundPage !== -1 && foundPage !== currentPage) {
          setCurrentPage(foundPage);
      }
    };
    
    findPage();
  }, [pdfDoc, highlightText]);

  // 3. Renderizar Página y Resaltar (Highlighting & Scroll)
  useEffect(() => {
    if (!pdfDoc) return;

    const renderPage = async () => {
      if (renderTaskRef.current) {
        await renderTaskRef.current.cancel();
      }

      const page = await pdfDoc.getPage(currentPage);
      const viewport = page.getViewport({ scale: pageScale });

      // Configurar Canvas
      const canvas = canvasRef.current;
      const context = canvas?.getContext('2d');
      if (!canvas || !context || !textLayerRef.current) return;

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Renderizar Canvas
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };
      
      const renderTask = page.render(renderContext);
      renderTaskRef.current = renderTask;

      try {
        await renderTask.promise;
      } catch (e: any) {
          if (e.name === 'RenderingCancelledException') return; // Ignorar cancelaciones
          console.error("Render error", e);
      }

      // Renderizar Capa de Texto
      const textContent = await page.getTextContent();
      textLayerRef.current.innerHTML = '';
      textLayerRef.current.style.height = `${viewport.height}px`;
      textLayerRef.current.style.width = `${viewport.width}px`;
      
      // @ts-ignore
      await window.pdfjsLib.renderTextLayer({
        textContentSource: textContent,
        container: textLayerRef.current,
        viewport: viewport,
        textDivs: []
      }).promise;

      // --- LÓGICA AVANZADA DE RESALTADO Y SCROLL ---
      if (highlightText && textLayerRef.current) {
          const target = normalize(highlightText);
          if (!target) return;

          // Obtener todos los spans
          const spans = Array.from(textLayerRef.current.querySelectorAll('span')) as HTMLSpanElement[];
          
          // Crear un mapa continuo del texto para manejar fragmentación de spans
          let accumulatedText = "";
          const spanMap = spans.map(span => {
              const t = normalize(span.textContent || "");
              const start = accumulatedText.length;
              accumulatedText += t;
              return { span, start, end: start + t.length };
          });

          // Buscar el inicio de la cita en el texto acumulado
          // Usamos los primeros 60 caracteres para localizar el inicio
          const searchChunk = target.substring(0, 60);
          const matchIndex = accumulatedText.indexOf(searchChunk);

          if (matchIndex !== -1) {
              // Encontrar el span que contiene el inicio de la coincidencia
              const targetSpanObj = spanMap.find(item => item.end > matchIndex);
              
              if (targetSpanObj) {
                  const el = targetSpanObj.span as HTMLElement;
                  
                  // Aplicar estilos visuales
                  el.style.backgroundColor = 'rgba(255, 235, 59, 0.6)'; // Amarillo fuerte
                  el.style.outline = '3px solid rgba(255, 193, 7, 0.8)'; // Borde naranja
                  el.style.borderRadius = '2px';
                  el.style.boxShadow = '0 0 10px rgba(255, 193, 7, 0.5)';
                  el.style.transition = 'all 0.5s ease';
                  el.style.zIndex = '10';
                  
                  // Efecto de parpadeo para llamar la atención
                  setTimeout(() => { el.style.backgroundColor = 'rgba(255, 235, 59, 0.3)'; el.style.outline = 'none'; }, 2000);

                  // Scroll suave al elemento
                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  
                  // (Opcional) Intentar resaltar spans subsiguientes si la cita es larga
                  // Esto es complejo visualmente, por ahora marcar el inicio es suficiente UX.
              }
          }
      }
    };

    renderPage();
  }, [pdfDoc, currentPage, pageScale, highlightText]);


  if (!pdfUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl p-8 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
        <h3 className="text-lg font-bold text-slate-700">Documento Original No Disponible</h3>
        <p className="text-sm text-slate-500 mb-6 max-w-xs mx-auto">
          El enlace al PDF original ha expirado o no se guardó. Sube el archivo nuevamente para visualizarlo.
        </p>
        <label className="cursor-pointer bg-indigo-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-indigo-700 transition shadow-md">
           Cargar PDF de nuevo
           <input type="file" accept="application/pdf" className="hidden" onChange={(e) => e.target.files?.[0] && onReupload(e.target.files[0])} />
        </label>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-600 rounded-xl overflow-hidden shadow-inner">
      {/* Toolbar */}
      <div className="bg-slate-800 text-white p-2 flex justify-between items-center z-10 shadow-md">
        <div className="flex items-center gap-2">
             <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage <= 1} className="p-1 hover:bg-slate-700 rounded disabled:opacity-50">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
             </button>
             <span className="text-sm font-mono">{currentPage} / {numPages}</span>
             <button onClick={() => setCurrentPage(prev => Math.min(numPages, prev + 1))} disabled={currentPage >= numPages} className="p-1 hover:bg-slate-700 rounded disabled:opacity-50">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
             </button>
        </div>
        <div className="flex items-center gap-2">
             <button onClick={() => setPageScale(s => Math.max(0.5, s - 0.2))} className="p-1 hover:bg-slate-700 rounded"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg></button>
             <span className="text-xs w-12 text-center">{Math.round(pageScale * 100)}%</span>
             <button onClick={() => setPageScale(s => Math.min(3.0, s + 0.2))} className="p-1 hover:bg-slate-700 rounded"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg></button>
        </div>
      </div>

      {/* Viewer Container */}
      <div ref={containerRef} className="flex-1 overflow-auto flex justify-center p-4 relative bg-slate-500/50">
         <div className="relative shadow-2xl">
             <canvas ref={canvasRef} className="block bg-white" />
             <div ref={textLayerRef} className="textLayer absolute inset-0 text-transparent leading-none origin-top-left" style={{ '--scale-factor': pageScale } as any}></div>
         </div>
      </div>
      
      {/* CSS para la capa de texto de PDF.js (inyección local para este componente) */}
      <style>{`
        .textLayer { overflow: hidden; opacity: 1; mix-blend-mode: multiply; }
        .textLayer ::selection { background: rgba(0,0,255, 0.2); }
        .textLayer span { color: transparent; position: absolute; white-space: pre; cursor: text; transform-origin: 0% 0%; }
      `}</style>
    </div>
  );
};

export default PdfViewer;