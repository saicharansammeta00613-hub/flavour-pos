import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/index.css'
import { Toaster } from 'react-hot-toast'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: '#1e293b',
          color: '#f1f5f9',
          border: '1px solid #334155',
          borderRadius: '12px',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '14px',
        },
        success: {
          iconTheme: { primary: '#22c55e', secondary: '#0f172a' },
          style: { borderLeft: '4px solid #22c55e' }
        },
        error: {
          iconTheme: { primary: '#ef4444', secondary: '#0f172a' },
          style: { borderLeft: '4px solid #ef4444' }
        }
      }}
    />
  </React.StrictMode>,
)
