import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowUpRight, Menu, X } from 'lucide-react'

const links = [
  ['Product', 'product'],
  ['How it works', 'workflow'],
  ['Channels', 'channels'],
  ['Mobile', 'mobile'],
  ['Why LeadHive', 'why'],
] as const

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const reducedMotion = useReducedMotion()
  const homePath = window.location.pathname === '/'
  const sectionHref = (id: string) => `${homePath ? '' : '/'}#${id}`

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  return (
    <header className={`navbar-wrap${scrolled ? ' is-scrolled' : ''}`}>
      <nav className="navbar container" aria-label="Main navigation">
        <a href={homePath ? '#home' : '/'} className="brand" aria-label="LeadHive AI home">
          <img src="/leadhive-logo.png" alt="LeadHive AI" />
        </a>
        <div className="desktop-nav">
          {links.map(([label, id]) => <a key={id} href={sectionHref(id)}>{label}</a>)}
        </div>
        <div className="nav-actions">
          <a href="/test-demo" className="button button-small nav-cta">Test Demo <ArrowUpRight /></a>
          <button className="menu-button" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen}>
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>
      <AnimatePresence>
        {menuOpen && (
          <motion.div className="mobile-menu" id="mobile-navigation" initial={reducedMotion ? false : { opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={reducedMotion ? undefined : { opacity: 0, y: -8 }} transition={{ duration: .25, ease: [0.16, 1, .3, 1] }}>
            {links.map(([label, id]) => <a key={id} href={sectionHref(id)} onClick={() => setMenuOpen(false)}>{label}<ArrowUpRight /></a>)}
            <a className="button" href="/test-demo" onClick={() => setMenuOpen(false)}>Test Demo <ArrowUpRight /></a>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
