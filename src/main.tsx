import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PrimeReactProvider } from '@primereact/core'
import { ThemeProvider } from './context/ThemeContext'
import './index.css'
import App from './App.tsx'

const primereact = {
  theme: {
    options: {
      darkModeSelector: '.dark',
    },
  },
  license: import.meta.env.VITE_PRIMEUI_LICENSE,
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PrimeReactProvider {...primereact}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </PrimeReactProvider>
  </StrictMode>,
)
