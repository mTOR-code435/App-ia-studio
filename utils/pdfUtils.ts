
export async function extractTextFromPdf(file: File): Promise<string> {
  const fileReader = new FileReader();

  return new Promise((resolve, reject) => {
    fileReader.onload = async (event) => {
      if (!event.target?.result) {
        return reject(new Error("Error al leer el archivo"));
      }

      try {
        // Acceso seguro a la variable global
        const global = window as any;
        const pdfjsLib = global.pdfjsLib;

        if (!pdfjsLib) {
            throw new Error("La librería PDF.js no está disponible. Por favor recarga la página.");
        }

        if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }

        const typedarray = new Uint8Array(event.target.result as ArrayBuffer);
        
        const loadingTask = pdfjsLib.getDocument({
            data: typedarray,
            cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
            cMapPacked: true,
            disableAutoFetch: true,
            disableStream: true,
            disableFontFace: true, 
        });

        const pdf = await loadingTask.promise;
        let fullText = '';
        const totalPages = pdf.numPages;

        for (let i = 1; i <= totalPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          
          // Improved text joining: handle items that are far apart (likely new lines)
          // Simple heuristic: just space join is usually enough for LLMs, but let's be safer
          const pageText = textContent.items
            .map((item: any) => item.str)
            .filter((str: string) => str.trim().length > 0) // Remove empty strings
            .join(' ');
            
          fullText += pageText + '\n\n';
        }
        
        // Remove excessive whitespace
        fullText = fullText.replace(/\s+/g, ' ').trim();

        if (!fullText || fullText.length < 50) {
            throw new Error("El PDF parece estar vacío o ser solo imágenes escaneadas sin OCR. Intenta usar un PDF con texto seleccionable.");
        }

        console.log(`PDF procesado exitosamente: ${fullText.length} caracteres extraídos.`);
        resolve(fullText);
      } catch (error: any) {
        console.error('Error procesando PDF:', error);
        
        if (error.name === 'PasswordException') {
            reject(new Error('El archivo PDF está protegido con contraseña.'));
        } else if (
            error.name === 'InvalidPDFException' || 
            error.name === 'MissingPDFException' || 
            error.message?.includes('Invalid PDF structure')
        ) {
            reject(new Error('El archivo PDF está dañado o tiene un formato no estándar. Intenta abrirlo y "Guardar como PDF" de nuevo.'));
        } else {
             reject(new Error(error.message || 'Error desconocido al leer el PDF.'));
        }
      }
    };

    fileReader.onerror = () => {
      reject(new Error("Error de lectura de archivo (FileReader)."));
    };

    fileReader.readAsArrayBuffer(file);
  });
}
