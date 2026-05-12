import React from 'react'
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'
import AnimatedBackground from './components/shared/AnimatedBackground'
import GameHUD from './components/shared/GameHUD'
import BottomNav from './components/shared/BottomNav'
import StatusNotification from './components/shared/StatusNotification'

const Home = React.lazy(() => import('./screens/Home'))
const Gacha = React.lazy(() => import('./screens/Gacha'))
const Inventory = React.lazy(() => import('./screens/Inventory'))
const Reveal = React.lazy(() => import('./screens/Reveal'))
const GovernanceScreen = React.lazy(() => import('./screens/GovernanceScreen'))
const LeaderboardScreen = React.lazy(() => import('./screens/LeaderboardScreen'))
const CapsuleInventoryScreen = React.lazy(() => import('./screens/CapsuleInventoryScreen'))
const PrivacyPolicy = React.lazy(() => import('./screens/PrivacyPolicy'))

export default function App() {
  return (
    <Router>
      <AnimatedBackground />

      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <GameHUD />
      <StatusNotification />

      {/* Main content */}
      <div className="relative z-10 min-h-screen text-white">
        <React.Suspense fallback={
          <div className="flex items-center justify-center h-screen" role="status" aria-live="polite">
            <div className="w-10 h-10 border-3 border-primary-500 rounded-full border-t-transparent animate-spin" aria-hidden="true" />
            <span className="sr-only">Loading...</span>
          </div>
        }>
          <Switch>
            <Route exact path="/" component={Home} />
            <Route path="/gacha" component={Gacha} />
            <Route path="/inventory" component={Inventory} />
            <Route path="/reveal" component={Reveal} />
            <Route path="/governance" component={GovernanceScreen} />
            <Route path="/leaderboard" component={LeaderboardScreen} />
            <Route path="/capsules" component={CapsuleInventoryScreen} />
            <Route path="/privacy" component={PrivacyPolicy} />
          </Switch>
        </React.Suspense>
      </div>

      <BottomNav />
    </Router>
  )
}
