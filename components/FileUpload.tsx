
import React, { useState, useRef } from 'react';

interface FileUploadProps {
  onProcess: (files: File[]) => void; // Changed to accept array
  isLoading: boolean;
  previewText?: string;
  batchProgress?: { current: number; total: number; filename: string } | null;
}

const FileUpload: React.FC<FileUploadProps> = ({ onProcess, isLoading, previewText, batchProgress }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFiles(Array.from(event.target.files));
    }
  };

  const handleProcessClick = () => {
    if (selectedFiles.length > 0) {
      onProcess(selectedFiles);
      // Don't clear selectedFiles immediately so we can show them, 
      // but usually the parent handles state. We'll keep them for UI context.
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (isLoading) return;
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      const filesArray = Array.from(event.dataTransfer.files).filter((file: File) => 
        file.type === "application/pdf" || file.type.startsWith("image/")
      );
      if (filesArray.length > 0) {
        setSelectedFiles(filesArray);
      }
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg transition-all">
      <h2 className="text-2xl font-bold text-slate-700 mb-4">1. Carga de Fuentes (Lotes)</h2>
      
      {!previewText && !batchProgress ? (
        <>
            <div 
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors group"
            >
                <input
                type="file"
                accept=".pdf,image/png,image/jpeg,image/webp"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
                ref={fileInputRef}
                disabled={isLoading}
                multiple // Enable multiple files
                />
                <label htmlFor="file-upload" className="cursor-pointer block">
                    <div className="mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-slate-400 group-hover:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 011.414.586l4.414 4.414a1 1 0 01.586 1.414V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                        </svg>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                    <span className="font-semibold text-indigo-600">Haz clic para subir</span> o arrastra tus archivos (PDF/Imagen)
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Soporta procesamiento por lotes</p>
                </label>
                
                {selectedFiles.length > 0 && (
                    <div className="mt-4 text-left bg-slate-50 rounded-lg p-3 border border-slate-200">
                        <p className="text-sm font-bold text-slate-700 mb-2">{selectedFiles.length} archivos seleccionados:</p>
                        <ul className="max-h-32 overflow-y-auto space-y-1">
                            {selectedFiles.map((f, i) => (
                                <li key={i} className="text-xs text-slate-600 flex items-center gap-2">
                                    <svg className="h-3 w-3 text-indigo-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" /></svg>
                                    {f.name}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
            <button
                onClick={handleProcessClick}
                disabled={selectedFiles.length === 0 || isLoading}
                className="mt-4 w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors duration-300 flex items-center justify-center shadow-md gap-2"
            >
                {isLoading ? 'Iniciando...' : `Analizar ${selectedFiles.length > 1 ? selectedFiles.length + ' Archivos' : 'Archivo'}`}
            </button>
        </>
      ) : batchProgress ? (
         // BATCH PROCESSING UI
         <div className="bg-slate-50 rounded-lg border border-indigo-100 overflow-hidden p-6 text-center">
             <div className="mb-4">
                 <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                        <div>
                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-200">
                            Procesando Lote
                        </span>
                        </div>
                        <div className="text-right">
                        <span className="text-xs font-semibold inline-block text-indigo-600">
                            {Math.round((batchProgress.current / batchProgress.total) * 100)}%
                        </span>
                        </div>
                    </div>
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-indigo-200">
                        <div style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500 transition-all duration-500"></div>
                    </div>
                </div>
             </div>
             
             <div className="flex flex-col items-center justify-center py-4">
                 <svg className="animate-spin h-8 w-8 text-indigo-600 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-slate-800 font-bold text-lg">Analizando archivo {batchProgress.current + 1} de {batchProgress.total}</p>
                <p className="text-slate-500 text-sm mt-1 truncate max-w-xs">{batchProgress.filename}</p>
             </div>
         </div>
      ) : (
        // SINGLE FILE PREVIEW UI (Legacy support / Single result)
        <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
             <div className="p-3 bg-slate-100 border-b border-slate-200 flex justify-between items-center">
                 <h3 className="text-sm font-bold text-slate-700 uppercase">Contenido Analizado</h3>
                 <button onClick={() => { setSelectedFiles([]); onProcess([]); }} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Cargar otros</button>
             </div>
             <div className="p-4">
                 <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed font-mono">
                    {isExpanded ? previewText : `${previewText?.slice(0, 500)}...`}
                 </p>
                 {previewText && previewText.length > 500 && (
                     <button 
                        onClick={() => setIsExpanded(!isExpanded)} 
                        className="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                     >
                        {isExpanded ? 'Ver menos' : 'Ver todo'}
                        <svg className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                     </button>
                 )}
             </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
