import { useEffect } from 'react'
import { Preloader } from '@/components/feedback/Preloader'
import { Navbar } from '@/components/layouts/Navbar'
import { Footer } from '@/components/layouts/Footer'
import { Hero } from '@/features/marketing/components/Hero'
import { ProblemSection } from '@/features/marketing/sections/ProblemSection'
import { ProductSection } from '@/features/marketing/sections/ProductSection'
import { WorkflowSection } from '@/features/marketing/sections/WorkflowSection'
import { TrustSection } from '@/features/marketing/sections/TrustSection'
import { ScaleSection } from '@/features/marketing/sections/ScaleSection'
import { WhyLeadHive } from '@/features/marketing/sections/WhyLeadHive'
import { Channels } from '@/features/marketing/components/Channels'
import { MobileExperience } from '@/features/marketing/components/MobileExperience'
import { CTA } from '@/features/marketing/components/CTA'
import { LegalPage } from '@/pages/LegalPage'
import { YoutubeApp } from '@/features/youtube/YoutubeApp'

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

  if (path === '/test-demo') return <YoutubeApp />

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