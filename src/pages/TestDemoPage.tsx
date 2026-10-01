import { useEffect, useState } from 'react'
import { DemoShell } from '@/features/youtube/DemoShell'
import { ResourceStatus } from '@/features/youtube/DemoUI'
import { PlatformSelection } from '@/features/youtube/screens/PlatformSelection'
import { ChannelSetup } from '@/features/youtube/screens/ChannelSetup'
import { PersonaSetup } from '@/features/youtube/screens/PersonaSetup'
import { ContentSelection } from '@/features/youtube/screens/ContentSelection'
import { CommandCenter } from '@/features/youtube/screens/CommandCenter'
import { AnalyticsDashboard } from '@/features/youtube/screens/AnalyticsDashboard'
import { IntelligenceDashboard } from '@/features/youtube/screens/IntelligenceDashboard'
import { useYouTubeIntelligence } from '@/hooks/useYouTubeIntelligence'
import { screenFromHash, type DemoScreen } from '@/features/youtube/types'
import '@/styles/test-demo.css'
import '@/styles/youtube-intelligence.css'
import '@/styles/premium-white-demo.css'

export function TestDemoPage() {
  const [screen, setScreen] = useState(screenFromHash)
  const controller = useYouTubeIntelligence()
  useEffect(() => {
    const previousTitle = document.title
    document.title = 'YouTube Intelligence | LeadHive AI'
    const onHashChange = () => setScreen(screenFromHash())
    window.addEventListener('hashchange', onHashChange)
    return () => { document.title = previousTitle; window.removeEventListener('hashchange', onHashChange) }
  }, [])
  function navigate(screen: DemoScreen) { window.location.hash = screen }
  const props = { controller, navigate }
  function renderScreen() {
    switch (screen) {
      case 'platform': return <PlatformSelection navigate={navigate} />
      case 'channel': return <ChannelSetup {...props} />
      case 'persona': return <PersonaSetup {...props} />
      case 'content': return <ContentSelection {...props} />
      case 'dashboard': return <IntelligenceDashboard {...props} />
      case 'command-center': return <CommandCenter {...props} />
      case 'analytics': return <AnalyticsDashboard {...props} />
    }
  }
  return <DemoShell screen={screen}><ResourceStatus loading={controller.loading} error={controller.error} retry={controller.reload} />{renderScreen()}</DemoShell>
}
