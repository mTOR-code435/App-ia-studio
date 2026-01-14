import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');

if (container) {
  try {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (e) {
    console.error("Error crítico al montar la aplicación:", e);
    container.innerHTML = `
      <div style="padding: 20px; color: #721c24; background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 5px; font-family: sans-serif; margin: 20px;">
        <h2 style="margin-top:0">Error de Inicialización</h2>
        <p>La aplicación no pudo iniciarse correctamente.</p>
        <pre style="background: #fff; padding: 10px; border-radius: 4px; overflow: auto;">${e instanceof Error ? e.message : String(e)}</pre>
        <button onclick="window.location.reload()" style="margin-top: 10px; padding: 8px 16px; cursor: pointer;">Recargar Página</button>
      </div>
    `;
  }
} else {
  console.error("No se encontró el elemento con id 'root'");
}