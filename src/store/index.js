import create from 'zustand'
import { cacheManager } from '../utils/cacheManager'
import logger from '../utils/logger'

const isDev = import.meta.env.DEV

// Check if we have the required env vars for on-chain interaction
const hasComponentAddress = !!import.meta.env.VITE_RADIX_CAPSULE_COMPONENT

// Generate deterministic mock loot based on tier + timestamp
const generateMockLoot = (tier) => {
  const rarities = ['common', 'common', 'common', 'rare', 'rare', 'epic', 'legendary']
  const names = [
    { common: ['Space Dust', 'Rusty Bolt', 'Empty Canister'] },
    { rare: ['Stardust', 'Cosmic Shard', 'Nebula Fragment'] },
    { epic: ['Galaxy Core', 'Void Crystal', 'Supernova Remnant'] },
    { legendary: ['Cosmic Fragment', 'Eternity Stone', 'Universal Key'] }
  ]

  // Weighted random based on tier
  const tierWeights = {
    8: [0.6, 0.3, 0.08, 0.02],   // bronze
    15: [0.4, 0.35, 0.2, 0.05],  // silver
    25: [0.25, 0.35, 0.3, 0.1],  // gold
    common: [0.7, 0.2, 0.08, 0.02],
    rare: [0.4, 0.4, 0.15, 0.05],
    epic: [0.2, 0.3, 0.35, 0.15],
    legendary: [0.1, 0.2, 0.3, 0.4]
  }

  const weights = tierWeights[tier] || tierWeights[8]
  const rand = Math.random()
  let cumulative = 0
  let rarityIndex = 0
  for (let i = 0; i < weights.length; i++) {
    cumulative += weights[i]
    if (rand <= cumulative) {
      rarityIndex = i
      break
    }
  }

  const rarity = ['common', 'rare', 'epic', 'legendary'][rarityIndex]
  const namePool = names.find(n => n[rarity])?.[rarity] || ['Mystery Item']
  const name = namePool[Math.floor(Math.random() * namePool.length)]

  return {
    id: `loot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    rarity,
    tier,
    timestamp: Date.now()
  }
}

export const useStore = create((set, get) => ({
  // App status
  status: 'idle',
  setStatus: (status) => set({ status }),

  // Toolkit instance
  toolkit: null,
  setToolkit: (toolkit) => set({ toolkit }),

  // Wallet state
  wallet: {
    connected: false,
    address: null,
    xrdBalance: 0
  },
  setWallet: (wallet) => set({ wallet }),

  // Capsule state
  selectedTier: null,
  capsuleOpening: false,
  transactionStatus: null,
  transactionError: null,
  error: null,

  setTransactionStatus: (status, err = null) => set({
    transactionStatus: status,
    transactionError: err
  }),

  clearStatus: () => set({
    status: 'idle',
    error: null,
    transactionStatus: null,
    transactionError: null
  }),

  selectTier: (tier) => {
    set({ selectedTier: tier })
    window.posthog?.capture('tier_selected', { tier })
  },

  // Wallet connection
  connectWallet: async () => {
    const { toolkit } = get()
    if (!toolkit) {
      set({ error: 'Wallet toolkit not initialized' })
      return false
    }

    set({ status: 'connecting', error: null })
    window.posthog?.capture('wallet_connect_start')

    try {
      const result = await toolkit.walletApi.sendRequest()

      if (result.isErr && typeof result.isErr === 'function' && result.isErr()) {
        const err = result.error
        logger.warn('Wallet connection declined or failed:', err)
        const msg = err?.message || err?.error || 'Wallet connection failed'
        set({ status: 'idle', error: msg })
        window.posthog?.capture('wallet_connect_error', { error: msg })
        return false
      }

      // walletData$.subscribe will handle state update
      logger.info('Wallet connection request completed')
      window.posthog?.capture('wallet_connect_success')
      return true
    } catch (error) {
      logger.error('Wallet connection exception:', error)
      const msg = error?.message || 'Failed to connect wallet'
      set({ status: 'idle', error: msg })
      window.posthog?.capture('wallet_connect_error', { error: msg })
      return false
    }
  },

  disconnectWallet: () => {
    const { toolkit } = get()
    if (toolkit?.disconnect) {
      toolkit.disconnect()
    }
    set({
      wallet: { connected: false, address: null, xrdBalance: 0 },
      status: 'idle'
    })
    window.posthog?.capture('wallet_disconnect')
  },

  // Capsule Inventory
  capsules: [],
  selectedCapsule: null,
  selectCapsule: (id) => set({ selectedCapsule: id }),
  addCapsule: (capsule) => set((state) => ({
    capsules: [...state.capsules, capsule]
  })),
  removeCapsule: (id) => set((state) => ({
    capsules: state.capsules.filter(c => c.id !== id),
    selectedCapsule: state.selectedCapsule === id ? null : state.selectedCapsule
  })),

  // Governance
  proposals: [
    { id: 'prop_1', title: 'Increase Legendary Drop Rate by 2%', description: 'Adjust the loot table to make legendary items slightly more obtainable.', status: 'active', votesFor: 124, votesAgainst: 45, endDate: Date.now() + 7 * 24 * 60 * 60 * 1000 },
    { id: 'prop_2', title: 'Add New Epic Cosmetic Set', description: 'Introduce the "Void Walker" cosmetic set for epic tier rewards.', status: 'active', votesFor: 89, votesAgainst: 12, endDate: Date.now() + 5 * 24 * 60 * 60 * 1000 },
    { id: 'prop_3', title: 'Reduce Silver Tier Cost', description: 'Lower the XRD cost for silver tier capsules from 15 to 12.', status: 'closed', votesFor: 156, votesAgainst: 78, endDate: Date.now() - 2 * 24 * 60 * 60 * 1000 }
  ],
  userVotes: {},
  voteOnProposal: (proposalId, vote) => set((state) => {
    const proposal = state.proposals.find(p => p.id === proposalId)
    if (!proposal || proposal.status !== 'active') return state

    const previousVote = state.userVotes[proposalId]
    const newVotes = { ...state.userVotes, [proposalId]: vote }

    // Adjust counts if changing vote
    let votesFor = proposal.votesFor
    let votesAgainst = proposal.votesAgainst

    if (previousVote === 'for') votesFor--
    if (previousVote === 'against') votesAgainst--
    if (vote === 'for') votesFor++
    if (vote === 'against') votesAgainst++

    return {
      userVotes: newVotes,
      proposals: state.proposals.map(p =>
        p.id === proposalId ? { ...p, votesFor, votesAgainst } : p
      )
    }
  }),
  createProposal: (proposal) => set((state) => ({
    proposals: [
      {
        id: `prop_${Date.now()}`,
        title: proposal.title,
        description: proposal.description || '',
        status: 'active',
        votesFor: 0,
        votesAgainst: 0,
        endDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
        ...proposal
      },
      ...state.proposals
    ]
  })),

  // Leaderboard
  leaderboard: [
    { address: 'rdx1qsp...8x2k', score: 15420, capsules: 47, rank: 1 },
    { address: 'rdx1qsp...3a9m', score: 12890, capsules: 38, rank: 2 },
    { address: 'rdx1qsp...7f4p', score: 11250, capsules: 31, rank: 3 },
    { address: 'rdx1qsp...2b7n', score: 9840, capsules: 27, rank: 4 },
    { address: 'rdx1qsp...9c1j', score: 8750, capsules: 22, rank: 5 }
  ],
  leaderboardTimeframe: 'all',
  setLeaderboardTimeframe: (timeframe) => set({ leaderboardTimeframe: timeframe }),
  addLeaderboardEntry: (entry) => set((state) => {
    const newLeaderboard = [...state.leaderboard, entry]
      .sort((a, b) => b.score - a.score)
      .map((e, i) => ({ ...e, rank: i + 1 }))
    return { leaderboard: newLeaderboard }
  }),

  openCapsule: async () => {
    const { toolkit, wallet, selectedTier } = get()
    if (!wallet?.connected || !selectedTier) {
      console.log('Store: Cannot open capsule - missing wallet or tier')
      set({ error: 'Please connect your wallet and select a tier' })
      return false
    }

    const start = performance.now()
    set({ error: null, transactionStatus: 'pending', transactionError: null })
    window.posthog?.capture('capsule_open_start')

    try {
      // Dev mode: simulate transaction if no component is deployed
      if (!hasComponentAddress) {
        logger.warn('VITE_RADIX_CAPSULE_COMPONENT not set — using dev-mode mock transaction')

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500))

        const loot = generateMockLoot(selectedTier)

        set({ transactionStatus: 'committing' })
        await new Promise(resolve => setTimeout(resolve, 800))

        // Cache the capsule data
        const capsuleData = {
          id: loot.id,
          tier: selectedTier,
          loot,
          timestamp: Date.now()
        }
        await cacheManager.cacheCapsule(capsuleData)

        // Add to inventory
        get().addCapsule({
          id: loot.id,
          name: loot.name,
          rarity: loot.rarity,
          tier: selectedTier,
          openedAt: Date.now()
        })

        set({
          capsuleOpening: false,
          lastOpenedTier: selectedTier,
          transactionStatus: 'committed'
        })

        window.posthog?.capture('capsule_open_success', {
          duration: performance.now() - start,
          tier: selectedTier,
          rarity: loot.rarity,
          mock: true
        })

        return true
      }

      const manifest = `
CALL_METHOD
  ComponentAddress("${import.meta.env.VITE_RADIX_CAPSULE_COMPONENT}")
  "open_capsule"
  Enum<Tier>("${selectedTier}")
;CALL_METHOD
  ComponentAddress("${import.meta.env.VITE_RADIX_CAPSULE_COMPONENT}")
  "claim_capsule"
`
      console.log('Store: Sending transaction')
      const result = await toolkit.walletApi.sendTransaction({
        transactionManifest: manifest,
        version: 1
      })

      if (result.isErr()) {
        const sdkError = result.error
        console.error('Store: Transaction failed:', sdkError)
        const msg = sdkError?.message || sdkError?.error || 'Transaction failed'
        set({
          transactionStatus: 'failed',
          transactionError: msg,
          capsuleOpening: false
        })
        window.posthog?.capture('capsule_open_error', { error: msg })
        return false
      }

      const { transactionIntentHash } = result.value
      console.log('Store: Transaction submitted, hash:', transactionIntentHash)

      set({ transactionStatus: 'committed' })
      window.posthog?.capture('capsule_transaction_committed', {
        tier: selectedTier,
        transactionHash: transactionIntentHash
      })
      window.posthog?.capture('capsule_open_success', {
        duration: performance.now() - start
      })

      // Cache the capsule data
      const capsuleData = {
        id: transactionIntentHash,
        tier: selectedTier,
        timestamp: Date.now()
      }
      await cacheManager.cacheCapsule(capsuleData)

      set({
        capsuleOpening: false,
        lastOpenedTier: selectedTier,
        transactionStatus: null
      })

      return true
    } catch (error) {
      console.error('Store: Capsule opening error:', error)
      const msg = error?.message || 'Failed to open capsule'
      set({
        error: msg,
        transactionStatus: 'error',
        transactionError: msg,
        capsuleOpening: false
      })
      window.posthog?.capture('capsule_open_error', { error: msg })
      return false
    } finally {
      set({ capsuleOpening: false })
    }
  },

  completeLootReveal: (tier, rarity) => {
    set({ capsuleOpening: false })
    window.posthog?.capture('loot_reveal_complete', { tier, rarity })
  },

  getCachedCapsules: async () => {
    return await cacheManager.getAllCapsules()
  },

  shareToTikTok: async (lootData) => {
    try {
      const shareUrl = `https://www.tiktok.com/upload?shareSource=gachafi&title=${encodeURIComponent(
        `Just opened a ${lootData.rarity} ${lootData.tier} capsule in GachaFi!`
      )}&url=${encodeURIComponent(
        window.location.origin + '/share/' + lootData.id
      )}`
      window.open(shareUrl, '_blank')
      window.posthog?.capture('share_success', { platform: 'tiktok' })
      return true
    } catch (error) {
      window.posthog?.capture('share_error', { platform: 'tiktok', error: error.message })
      return false
    }
  }
}))
