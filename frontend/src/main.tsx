import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom' // <--- Importe isso
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* O BrowserRouter habilita a troca de telas */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)