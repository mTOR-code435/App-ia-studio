
import React, { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>, string | null] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error recuperando clave "${key}" de localStorage:`, error);
      return initialValue;
    }
  });

  const [error, setError] = useState<string | null>(null);

  const setValue: React.Dispatch<React.SetStateAction<T>> = (value) => {
    try {
      setError(null); // Clear previous errors
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Intentar guardar
      if (typeof window !== 'undefined') {
        const jsonValue = JSON.stringify(valueToStore);
        window.localStorage.setItem(key, jsonValue);
      }
      
      // Actualizar estado solo si guardado fue exitoso (o si ignoramos error de guardado para la UI, pero mejor mantener consistencia)
      setStoredValue(valueToStore);
      
    } catch (err: any) {
      console.error("Error al guardar en localStorage:", err);
      let message = 'No se pudo guardar los datos automáticamente.';
      
      // Detectar QuotaExceededError de forma robusta a través de navegadores
      const isQuotaError = err instanceof DOMException && (
          err.name === 'QuotaExceededError' || 
          err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
          err.code === 22
      );

      if (isQuotaError) {
        message = '⚠️ ALERTA DE ESPACIO: Se ha llenado el almacenamiento del navegador. Las nuevas fichas NO se están guardando permanentemente. Por favor, exporta tus datos (JSON) y borra fichas antiguas para liberar espacio.';
      }
      
      setError(message);
    }
  };

  useEffect(() => {
    // Sincronizar cambios desde otras pestañas
    const handleStorageChange = (e: StorageEvent) => {
        if (e.key === key) {
            try {
                setStoredValue(e.newValue ? JSON.parse(e.newValue) : initialValue);
            } catch (error) {
                console.error(error);
            }
        }
    }
    window.addEventListener('storage', handleStorageChange);
    return () => {
        window.removeEventListener('storage', handleStorageChange);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, error];
}
