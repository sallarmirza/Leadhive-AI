import { useEffect, useRef, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import { type DemoScreen } from './types'

const navigation: { label: string; target: DemoScreen; active: DemoScreen[] }[] = [
  { label: 'Overview', target: 'platform', active: ['platform', 'dashboard'] },
  { label: 'Channel', target: 'channel', active: ['channel'] },
  { label: 'AI Persona', target: 'persona', active: ['persona'] },
  { label: 'Video Library', target: 'content', active: ['content'] },
  { label: 'Command Center', target: 'command-center', active: ['command-center'] },
  { label: 'Analytics', target: 'analytics', active: ['analytics'] },
]

export function DemoShell({ screen, children }: { screen: DemoScreen; children: ReactNode }) {
  const reduced = useReducedMotion()
  const main = useRef<HTMLElement>(null)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [screen])

  return (
    <div className="td-workspace">
      <header className="td-header">
        <div className="td-header-inner">
          <a href="#platform" className="td-brand" aria-label="LeadHive AI - Test Demo">
            <img src="/leadhive-logo.png" alt="LeadHive AI" />
          </a>
          <span className="td-header-divider" />
          <span className="td-module-label">YouTube Intelligence</span>

          <nav className="td-navigation" aria-label="YouTube Intelligence sections">
            {navigation.map(item => {
              const isActive = item.active.includes(screen)
              return (
                <a
                  key={item.target}
                  href={'#' + item.target}
                  className={isActive ? 'is-active' : ''}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {item.label}
                </a>
              )
            })}
          </nav>

          <a href="/" className="td-exit">
            <span>Exit Demo</span>
            <ArrowUpRight size={15} />
          </a>
        </div>
      </header>

      <div className="td-container">
        <main id="workspace-main" ref={main}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={screen}
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: reduced ? 0 : 0.22, ease: [0.16, 1, 0.3, 1] }}
              onAnimationComplete={() => main.current?.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true })}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}