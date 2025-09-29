import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Polyfill cho Draft.js / fbjs trong môi trường trình duyệt (Vite)
// Một số gói kỳ vọng tồn tại biến global
// eslint-disable-next-line @typescript-eslint/no-explicit-any
if (typeof (window as any).global === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).global = window
}

// Polyfill setImmediate (nếu thiếu)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
if (typeof (window as any).setImmediate === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).setImmediate = (fn: (...args: any[]) => void, ...args: any[]) => setTimeout(fn, 0, ...args)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
