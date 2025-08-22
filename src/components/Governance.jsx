import { useState } from 'react'
import { useStore } from '../store'

export default function Governance() {
  const { proposals, userVotes, voteOnProposal, createProposal } = useStore()
  const [showModal, setShowModal] = useState(false)
  const [newProposal, setNewProposal] = useState({ title: '', description: '' })

  const activeProposals = proposals.filter(p => p.status === 'active')
  const closedProposals = proposals.filter(p => p.status === 'closed')

  const handleSubmit = (e) => {
    e.preventDefault()
    createProposal({ title: newProposal.title, description: '' })
    setShowModal(false)
    setNewProposal({ title: '', description: '' })
  }

  const handleTitleChange = (e) => {
    setNewProposal({ ...newProposal, title: e.target.value })
  }

  const handleDescriptionChange = (e) => {
    setNewProposal({ ...newProposal, description: e.target.value })
  }

  return (
    <div className="p-4">
      <button
        className="mb-6 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 active:bg-purple-800 transition-colors"
        onClick={() => setShowModal(true)}
      >
        Create Proposal
      </button>

      <div className="space-y-6">
        <section role="region" aria-label="Active Proposals">
          <h2 className="text-xl font-semibold mb-4">Active Proposals</h2>
          <div className="space-y-4">
            {activeProposals.map(proposal => (
              <div key={proposal.id} className="p-4 bg-white rounded-lg shadow">
                <h3 className="font-medium">{proposal.title}</h3>
                <p className="text-sm text-gray-600">{proposal.votes} votes</p>
                <button
                  data-testid={`vote-button-${proposal.id}`}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg mt-2 hover:bg-purple-700 active:bg-purple-800 transition-colors"
                  onClick={() => voteOnProposal(proposal.id)}
                  disabled={userVotes[proposal.id]}
                >
                  {userVotes[proposal.id] ? 'Voted' : 'Vote'}
                </button>
              </div>
            ))}
          </div>
        </section>

        <section role="region" aria-label="Closed Proposals">
          <h2 className="text-xl font-semibold mb-4">Closed Proposals</h2>
          <div className="space-y-4">
            {closedProposals.map(proposal => (
              <div key={proposal.id} className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium">{proposal.title}</h3>
                <p className="text-sm text-gray-600">{proposal.votes} votes</p>
                <span className="text-sm text-gray-500">Closed</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" role="dialog">
          <div
            className="bg-white p-6 rounded-lg w-full max-w-md opacity-0 scale-90 transition-all duration-300"
            style={{
              opacity: 1,
              transform: 'scale(1)'
            }}
            role="document"
          >
            <h2 className="text-xl font-semibold mb-4">Create New Proposal</h2>
            <form onSubmit={handleSubmit} role="form" aria-label="Create New Proposal Form">
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
                  <input
                    type="text"
                    name="title"
                    aria-label="title"
                    className="w-full p-2 border rounded"
                    placeholder="Proposal title"
                    value={newProposal.title}
                    onChange={handleTitleChange}
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    name="description"
                    aria-label="description"
                    className="w-full p-2 border rounded"
                    placeholder="Proposal description"
                    value={newProposal.description}
                    onChange={handleDescriptionChange}
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Submit
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
