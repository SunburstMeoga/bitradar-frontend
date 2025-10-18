import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './styles/main.scss'
import i18n from './i18n'
import { detectLanguageByIP } from './utils/ipLanguage'
import { router } from './router'

async function bootstrap() {
  try {
    const locale = await detectLanguageByIP();
    if (locale) {
      // Persist and apply detected locale before first render
      localStorage.setItem('i18nextLng', locale);
      await i18n.changeLanguage(locale);
    }
  } catch (e) {
    // Non-blocking: keep rendering even if detection fails
    console.warn('[bootstrap] language detection failed:', e);
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
