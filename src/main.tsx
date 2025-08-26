import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Error boundary for better error handling
const renderApp = () => {
  console.log('🚀 Starting app render...');
  try {
    const root = document.getElementById("root");
    console.log('📍 Root element found:', !!root);
    if (root) {
      console.log('⚛️ Creating React root...');
      createRoot(root).render(<App />);
      console.log('✅ App rendered successfully');
    } else {
      console.error("❌ Root element not found");
      document.body.innerHTML = '<div style="padding: 20px; text-align: center; color: red;">Root element not found!</div>';
    }
  } catch (error) {
    console.error("❌ Failed to render app:", error);
    // Fallback render
    document.body.innerHTML = '<div style="padding: 20px; text-align: center; color: red;">Error: ' + error + '</div>';
  }
};

renderApp();
