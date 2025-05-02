import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import chatbotIcon from './assets/chatbot.png';  // Importer l'image
import backgroundImage from './assets/rbat1.jpg';  // Importer l'image de fond

import App from './App.jsx';

// Ajouter dynamiquement l'image de fond
const style = {
  backgroundImage: `url(${backgroundImage})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  minHeight: '100vh', // Assurez-vous que l'image couvre toute la hauteur de l'écran
};

// Ajouter dynamiquement l'icône au head
const link = document.createElement('link');
link.rel = 'icon';
link.type = 'image/png';
link.href = chatbotIcon; // Utiliser l'image importée pour l'icône
document.head.appendChild(link);

createRoot(document.getElementById('root')).render(
  <StrictMode>
     <div style={style}>
       <App />
    </div>
  </StrictMode>
);