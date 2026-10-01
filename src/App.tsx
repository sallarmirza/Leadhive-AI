import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router'
import MarketingApp from '@/features/marketing/MarketingApp'

const YoutubeApp = lazy(() =>
  import('@/features/youtube/YoutubeApp').then(m => ({ default: m.YoutubeApp }))
)
const LegalPage = lazy(() =>
  import('@/features/legal/LegalPage').then(m => ({ default: m.LegalPage }))
)
const NotFound = lazy(() => import('@/NotFound'))

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/"          element={<MarketingApp />} />
          <Route path="/contact"   element={<MarketingApp />} />
          <Route path="/test-demo" element={<YoutubeApp />} />
          <Route path="/privacy"   element={<LegalPage type="privacy" />} />
          <Route path="/terms"     element={<LegalPage type="terms" />} />
          <Route path="*"          element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}