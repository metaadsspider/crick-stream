import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Error boundary for better error handling
const renderApp = () => {
  try {
    const root = document.getElementById("root");
    if (root) {
      createRoot(root).render(<App />);
    } else {
      console.error("Root element not found");
    }
  } catch (error) {
    console.error("Failed to render app:", error);
    // Fallback render
    document.body.innerHTML = '<div style="padding: 20px; text-align: center;">Loading...</div>';
  }
};

renderApp();
