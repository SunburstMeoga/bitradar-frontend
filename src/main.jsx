import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './styles/main.scss'
import { router } from './router'
import { applyStartupLanguage } from './utils/languagePref'

async function bootstrap() {
  try {
    const source = await applyStartupLanguage()
    console.log(`[startup] language applied via: ${source}`)
  } catch (e) {
    console.warn('[bootstrap] language detection failed:', e)
  }

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <RouterProvider
        router={router}
        future={{
          v7_startTransition: true,
        }}
      />
    </StrictMode>
  )
}

bootstrap()
