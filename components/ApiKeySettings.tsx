
import React, { useState, useEffect } from 'react';
import { validateApiKey } from '../services/geminiService';

interface ApiKeySettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const ApiKeySettings: React.FC<ApiKeySettingsProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  useEffect(() => {
    const key = localStorage.getItem('gemini_api_key_custom');
    setSavedKey(key);
    if (key) setApiKey(key);
    setTestStatus('idle'); // Reset status on open
  }, [isOpen]);

  const handleSave = () => {
    if (!apiKey.trim()) return;
    localStorage.setItem('gemini_api_key_custom', apiKey.trim());
    setSavedKey(apiKey.trim());
    alert('API Key guardada correctamente. Ahora usarás tu cuota personal.');
    onClose();
    window.location.reload(); // Recargar para asegurar que los servicios reinicien con la nueva key
  };

  const handleClear = () => {
    localStorage.removeItem('gemini_api_key_custom');
    setApiKey('');
    setSavedKey(null);
    setTestStatus('idle');
    alert('API Key eliminada. Se volverá a usar la clave compartida (si está disponible).');
    onClose();
    window.location.reload();
  };

  const handleTest = async () => {
      if (!apiKey.trim()) return;
      setTestStatus('testing');
      const isValid = await validateApiKey(apiKey.trim());
      setTestStatus(isValid ? 'success' : 'error');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 flex justify-between items-center">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                Configuración de API
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>

        <div className="p-6 space-y-4">
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
                <h3 className="font-bold text-indigo-800 text-sm mb-1">¿Por qué configurar mi propia clave?</h3>
                <p className="text-xs text-indigo-700">
                    Las claves compartidas tienen límites bajos (cuota gratuita). Usando tu propia clave gratuita de Google AI Studio, obtienes <strong>límites mucho más altos</strong> y evitas errores de "Recurso Agotado".
                </p>
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline">
                    Obtener API Key Gratis aquí &rarr;
                </a>
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Tu Gemini API Key</label>
                <div className="relative">
                    <input 
                        type={isVisible ? "text" : "password"} 
                        value={apiKey}
                        onChange={(e) => { setApiKey(e.target.value); setTestStatus('idle'); }}
                        className="w-full pl-4 pr-24 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-mono text-sm"
                        placeholder="AIzaSy..."
                    />
                    <div className="absolute right-2 top-2 flex items-center gap-1">
                        <button 
                            onClick={handleTest}
                            disabled={!apiKey.trim() || testStatus === 'testing'}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                testStatus === 'success' ? 'bg-green-100 text-green-700' :
                                testStatus === 'error' ? 'bg-red-100 text-red-700' :
                                'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                            title="Verificar validez de la clave"
                        >
                            {testStatus === 'testing' ? '...' : testStatus === 'success' ? 'OK' : testStatus === 'error' ? 'Error' : 'Probar'}
                        </button>
                        <button 
                            onClick={() => setIsVisible(!isVisible)}
                            className="p-1.5 text-slate-400 hover:text-slate-600"
                        >
                            {isVisible ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            )}
                        </button>
                    </div>
                </div>
                {testStatus === 'success' && <p className="mt-1 text-[10px] text-green-600 font-bold">✅ Clave válida y operativa.</p>}
                {testStatus === 'error' && <p className="mt-1 text-[10px] text-red-600 font-bold">❌ Clave inválida o sin acceso a Gemini.</p>}
                
                {savedKey && testStatus === 'idle' && (
                    <p className="mt-2 text-xs text-green-600 font-medium flex items-center">
                        <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        Clave personal activa
                    </p>
                )}
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button 
                    onClick={handleSave} 
                    disabled={!apiKey.trim() || testStatus === 'testing'}
                    className="flex-1 bg-indigo-600 text-white font-bold py-2.5 rounded-xl hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors shadow-md"
                >
                    Guardar y Usar
                </button>
                {savedKey && (
                     <button 
                        onClick={handleClear} 
                        className="px-4 py-2.5 text-red-600 font-bold hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-100"
                    >
                        Borrar
                    </button>
                )}
            </div>
             <p className="text-[10px] text-slate-400 text-center">
                Tu clave se guarda localmente en tu navegador. Nunca se comparte.
            </p>
        </div>
      </div>
    </div>
  );
};

export default ApiKeySettings;
