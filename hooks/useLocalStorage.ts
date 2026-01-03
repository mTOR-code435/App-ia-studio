


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
      console.error(error);
      return initialValue;
    }
  });

  const [error, setError] = useState<string | null>(null);

  const setValue: React.Dispatch<React.SetStateAction<T>> = (value) => {
    try {
      setError(null); // Clear previous errors
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (err) {
      console.error("Error al guardar en localStorage:", err);
      let message = 'No se pudo guardar los datos en el almacenamiento local.';
      // Check for QuotaExceededError which is a DOMException
      if (err instanceof DOMException && (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
        message = 'Error Crítico: Se ha alcanzado el límite de almacenamiento del navegador. No se pueden guardar más fichas. Para evitar la pérdida de datos, por favor, exporta una copia de seguridad (JSON) de inmediato y considera eliminar algunas fichas antiguas para liberar espacio.';
      }
      setError(message);
    }
  };

  useEffect(() => {
    // This effect is to sync changes from other tabs, not strictly necessary for this app
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