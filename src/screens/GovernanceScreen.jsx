import React, { useState } from 'react'
import { useHistory } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'

const STATUS_STYLES = {
  active: {
    badge: 'bg-success-500/15 text-success-500 border-success-500/30',
    label: 'Active'
  },
  closed: {
    badge: 'bg-neutral-500/15 text-text-muted border-neutral-500/30',
    label: 'Closed'
  }
}

export default function GovernanceScreen() {
  const history = useHistory()
  const { proposals, userVotes, voteOnProposal, createProposal, wallet } = useStore()
  const [showModal, setShowModal] = useState(false)
  const [newProposal, setNewProposal] = useState({ title: '', description: '' })

  const isConnected = wallet?.connected

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!newProposal.title.trim()) return
    createProposal({
      title: newProposal.title,
      description: newProposal.description
    })
    setShowModal(false)
    setNewProposal({ title: '', description: '' })
  }

  const activeProposals = proposals.filter(p => p.status === 'active')
  const closedProposals = proposals.filter(p => p.status === 'closed')

  const ProposalCard = ({ proposal }) => {
    const userVote = userVotes[proposal.id]
    const totalVotes = proposal.votesFor + proposal.votesAgainst
    const forPercent = totalVotes > 0 ? (proposal.votesFor / totalVotes) * 100 : 0
    const isEnded = proposal.status === 'closed'

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface/60 backdrop-blur-md border border-white/10 rounded-2xl p-5"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-display text-body text-white font-semibold">{proposal.title}</h3>
            <p className="text-caption text-text-muted mt-1">{proposal.description}</p>
          </div>
          <span className={`shrink-0 ml-3 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide border ${STATUS_STYLES[proposal.status].badge}`}>
            {STATUS_STYLES[proposal.status].label}
          </span>
        </div>

        {/* Vote bar */}
        <div className="mt-4">
          <div className="flex justify-between text-caption mb-1.5">
            <span className="text-success-500 font-medium">{proposal.votesFor} For</span>
            <span className="text-error-500 font-medium">{proposal.votesAgainst} Against</span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${forPercent}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-success-500 to-success-400"
            />
          </div>
          <p className="text-caption text-text-muted mt-1">{totalVotes} total votes</p>
        </div>

        {/* Vote buttons */}
        {!isEnded && isConnected && (
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => voteOnProposal(proposal.id, 'for')}
              className={`flex-1 py-2.5 rounded-xl font-display text-caption font-semibold tracking-wide transition-all duration-200 ${
                userVote === 'for'
                  ? 'bg-success-500/20 text-success-500 border border-success-500/40'
                  : 'bg-white/5 text-text-secondary hover:bg-white/10 hover:text-white border border-transparent'
              }`}
            >
              Vote For
            </button>
            <button
              onClick={() => voteOnProposal(proposal.id, 'against')}
              className={`flex-1 py-2.5 rounded-xl font-display text-caption font-semibold tracking-wide transition-all duration-200 ${
                userVote === 'against'
                  ? 'bg-error-500/20 text-error-500 border border-error-500/40'
                  : 'bg-white/5 text-text-secondary hover:bg-white/10 hover:text-white border border-transparent'
              }`}
            >
              Vote Against
            </button>
          </div>
        )}

        {!isEnded && !isConnected && (
          <p className="text-caption text-text-muted mt-4 text-center">Connect wallet to vote</p>
        )}
      </motion.div>
    )
  }

  return (
    <div className="min-h-screen pt-16 pb-28">
      <main id="main-content" className="px-5 py-4">
        <div className="app-container">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 flex items-center justify-between"
          >
            <div>
              <h1 className="font-display text-h2 text-white">Governance</h1>
              <p className="text-caption text-text-muted mt-0.5">
                Shape the future of GachaFi
              </p>
            </div>
            {isConnected && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowModal(true)}
                className="shrink-0 px-4 py-2.5 bg-primary-500/20 text-primary-500 rounded-xl font-display text-caption font-semibold border border-primary-500/30 hover:bg-primary-500/30 transition-colors"
              >
                + Proposal
              </motion.button>
            )}
          </motion.div>

          {/* Active Proposals */}
          <section className="mb-6">
            <h2 className="text-body font-display font-semibold text-white mb-3">Active Proposals</h2>
            <div className="space-y-3">
              {activeProposals.length > 0 ? (
                activeProposals.map(proposal => (
                  <ProposalCard key={proposal.id} proposal={proposal} />
                ))
              ) : (
                <div className="text-center py-8 bg-surface/40 rounded-2xl border border-white/5">
                  <p className="text-body text-text-muted">No active proposals</p>
                </div>
              )}
            </div>
          </section>

          {/* Closed Proposals */}
          {closedProposals.length > 0 && (
            <section>
              <h2 className="text-body font-display font-semibold text-white mb-3">Closed Proposals</h2>
              <div className="space-y-3">
                {closedProposals.map(proposal => (
                  <ProposalCard key={proposal.id} proposal={proposal} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Create Proposal Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-surface border border-white/10 rounded-2xl p-6"
            >
              <h2 className="font-display text-h3 text-white mb-4">Create Proposal</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-caption text-text-muted mb-1.5">Title</label>
                  <input
                    type="text"
                    value={newProposal.title}
                    onChange={e => setNewProposal({ ...newProposal, title: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-text-muted focus:outline-none focus:border-primary-500/50 transition-colors"
                    placeholder="Enter proposal title"
                    required
                  />
                </div>
                <div>
                  <label className="block text-caption text-text-muted mb-1.5">Description</label>
                  <textarea
                    value={newProposal.description}
                    onChange={e => setNewProposal({ ...newProposal, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-text-muted focus:outline-none focus:border-primary-500/50 transition-colors resize-none"
                    placeholder="Describe your proposal"
                    rows={3}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3 rounded-xl font-display text-body font-semibold text-text-secondary hover:text-white hover:bg-white/5 border border-white/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl font-display text-body font-semibold text-white bg-gradient-to-b from-primary-500 to-primary-600 border-t border-white/20 shadow-[0_4px_0_#990042] active:shadow-[0_1px_0_#990042] active:translate-y-[3px] transition-all"
                  >
                    Submit
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
