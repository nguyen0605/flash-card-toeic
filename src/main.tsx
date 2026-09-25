import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { tts } from './services/tts';

// Khởi tạo audio context khi người dùng tương tác lần đầu
window.addEventListener('touchstart', () => tts.unlockAudio(), { once: true });
window.addEventListener('click', () => tts.unlockAudio(), { once: true });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
