import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Elemento #root no encontrado en el DOM.');
  }
  const root = createRoot(rootElement);
  root.render(<App />);
} catch (err) {
  console.error('Error fatal al montar la aplicación:', err);
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: #0c0a09; color: #f87171; text-align: center; padding: 24px; font-family: serif;">
        <div style="font-size: 32px; margin-bottom: 12px;">⚔</div>
        <h2 style="font-size: 20px; font-weight: bold; color: #fde68a; margin-bottom: 8px;">Alineando la Puerta Astral...</h2>
        <p style="font-size: 12px; color: #a8a29e; max-width: 380px; margin-bottom: 20px; font-family: sans-serif;">
          Se detectó una discrepancia al iniciar el bastión. Haz clic para restablecer el estado y entrar:
        </p>
        <button onclick="try{localStorage.clear();}catch(e){}window.location.reload();" style="padding: 12px 24px; border-radius: 12px; background: #d97706; color: #0c0a09; font-weight: bold; font-size: 13px; border: 2px solid #f59e0b; cursor: pointer;">
          Entrar a Icespear (Limpiar y Recargar)
        </button>
      </div>
    `;
  }
}

