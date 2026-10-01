import { useEffect } from 'react'
import { Preloader } from './components/feedback/Preloader'
import { Navbar } from './components/layouts/Navbar'

import { ProblemSection } from './sections/ProblemSection'
import { ProductSection } from './sections/ProductSection'
import { WorkflowSection } from './sections/WorkflowSection'
import { ScaleSection } from './sections/ScaleSection'
import { WhyLeadHive } from './sections/WhyLeadHive'
import { Footer } from './components/layouts/Footer'
import { TrustSection } from './sections/TrustSection'
import { LegalPage } from './pages/LegalPage'
import { TestDemoPage } from './pages/TestDemoPage'
import { Hero } from './features/marketing/components/Hero'
import { Channels } from './features/marketing/components/Channels'
import { MobileExperience } from './features/marketing/components/MobileExperience'
import { CTA } from './features/marketing/components/CTA'

export default function App() {
  const path = window.location.pathname.replace(/\/$/, '') || '/'

  useEffect(() => {
    if (path === '/contact') {
      window.setTimeout(() => document.getElementById('contact')?.scrollIntoView({ behavior: 'instant' as ScrollBehavior }), 0)
    } else {
      // Always start instantly at top Hero on load
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
    }

    const handleHash = () => {
      const id = window.location.hash.slice(1)
      if (id) {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
      }
    }

    window.addEventListener('hashchange', handleHash)
    return () => window.removeEventListener('hashchange', handleHash)
  }, [])

  if (path === '/test-demo') return <TestDemoPage />

  if (path === '/privacy' || path === '/terms') {
    return <LegalPage type={path === '/privacy' ? 'privacy' : 'terms'} />
  }

  return (
    <div className="site-shell">
      <Preloader />
      <Navbar />
      <main>
        <Hero />
        <ProblemSection />
        <ProductSection />
        <WorkflowSection />
        <TrustSection />
        <ScaleSection />
        <Channels />
        <MobileExperience />
        <WhyLeadHive />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}
