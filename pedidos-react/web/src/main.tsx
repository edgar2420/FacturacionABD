import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/plus-jakarta-sans';
import App from './App';
import './estilos.css';

const raiz = document.getElementById('raiz');
if (!raiz) throw new Error('No se encontro el elemento #raiz');

createRoot(raiz).render(
  <StrictMode>
    <App />
  </StrictMode>
);
