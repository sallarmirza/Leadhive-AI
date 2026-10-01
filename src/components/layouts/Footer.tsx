import { ArrowUpRight } from 'lucide-react'
import { Reveal } from '../ui/Reveal'

export function Footer() {
  const homePath = window.location.pathname === '/'
  const sectionHref = (id: string) => `${homePath ? '' : '/'}#${id}`
  return (
    <footer>
      <Reveal className="container footer-grid">
        <div className="footer-brand"><a href="/" aria-label="LeadHive AI home"><img src="/leadhive-logo.png" alt="LeadHive AI" /></a><p>Turning digital conversations into clear, qualified sales opportunities.</p><small>Built by <a href="https://m3hive.com/" target="_blank" rel="noreferrer">M3Hive</a></small></div>
        <div><h3>Product</h3><a href={sectionHref('product')}>Lead Intelligence</a><a href={sectionHref('workflow')}>How it works</a><a href={sectionHref('channels')}>Channels</a></div>
        <div><h3>Company</h3><a href={sectionHref('why')}>Why LeadHive</a><a href="/contact">Contact Us</a></div>
        <div className="footer-contact"><h3>Contact</h3><a href="mailto:support@leadhive-ai.com">support@leadhive-ai.com <ArrowUpRight /></a><small>For product, partnership, and demo enquiries.</small></div>
      </Reveal>
      <div className="container footer-bottom"><span>Copyright 2026 LeadHive AI. All rights reserved.</span><div><a href="/privacy">Privacy</a><a href="/terms">Terms</a></div></div>
    </footer>
  )
}
