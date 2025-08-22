import React from 'react'
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

const Home = React.lazy(() => import('./screens/Home'))
const Gacha = React.lazy(() => import('./screens/Gacha'))
const Inventory = React.lazy(() => import('./screens/Inventory'))

export default function App() {
  return (
    <Router>
      <div className="min-h-screen min-h-screen-safe bg-gradient-to-br from-secondary to-primary text-white overflow-hidden">
        <React.Suspense fallback={
          <div className="flex items-center justify-center h-screen">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 border-4 border-white rounded-full border-t-transparent"
            />
          </div>
        }>
          <AnimatePresence mode="wait">
            <Switch>
              <Route exact path="/" component={Home} />
              <Route path="/gacha" component={Gacha} />
              <Route path="/inventory" component={Inventory} />
            </Switch>
          </AnimatePresence>
        </React.Suspense>
      </div>
    </Router>
  )
}
