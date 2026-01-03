declare const pdfjsLib: any;

export async function extractTextFromPdf(file: File): Promise<string> {
  const fileReader = new FileReader();

  return new Promise((resolve, reject) => {
    fileReader.onload = async (event) => {
      if (!event.target?.result) {
        return reject(new Error("Error al leer el archivo"));
      }

      try {
        const typedarray = new Uint8Array(event.target.result as ArrayBuffer);
        const pdf = await pdfjsLib.getDocument(typedarray).promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          fullText += pageText + '\n\n';
        }
        resolve(fullText);
      } catch (error: any) {
        console.error('Error procesando PDF:', error);
        
        // Manejo de errores específico basado en las excepciones de PDF.js
        if (error.name === 'PasswordException') {
            reject(new Error('El archivo PDF está protegido con contraseña y no se puede procesar. Por favor, elimine la protección antes de subirlo.'));
        } else if (error.name === 'InvalidPDFException' || error.name === 'MissingPDFException') {
            reject(new Error('El archivo no parece ser un PDF válido o está corrupto. Por favor, verifique el archivo e inténtelo de nuevo.'));
        } else {
             reject(new Error('No se pudo procesar el archivo PDF. Podría estar dañado o tener un formato no compatible.'));
        }
      }
    };

    fileReader.onerror = (error) => {
      reject(new Error("Ocurrió un error al leer el archivo."));
    };

    fileReader.readAsArrayBuffer(file);
  });
}