import create from 'zustand'
import { RadixDappToolkit } from '@radixdlt/radix-dapp-toolkit'
import { cacheManager } from '../utils/cacheManager'

// Initialize DappToolkit after window is loaded
let dappToolkit

if (typeof window !== 'undefined') {
  try {
    dappToolkit = new RadixDappToolkit({
      networkId: import.meta.env.VITE_RADIX_NETWORK_ID || 'mainnet-beta',
      dAppDefinitionAddress: import.meta.env.VITE_RADIX_DAPP_ADDRESS,
      applicationName: 'GachaFi'
    })
  } catch (error) {
    console.error('Failed to initialize DappToolkit:', error)
    dappToolkit = null
  }
}

export const useStore = create((set, get) => ({
  // Wallet state
  wallet: {
    connected: false,
    address: null,
    xrdBalance: 0
  },
  
  // Capsule state
  selectedTier: null,
  capsuleOpening: false,
  
  // Actions
  connectWallet: async () => {
    const start = performance.now()
    try {
      window.posthog?.capture('wallet_connect_start')
      const result = await dappToolkit.requestWalletConnection({
        networkId: import.meta.env.VITE_RADIX_NETWORK_ID || 'mainnet-beta',
        dAppDefinitionAddress: import.meta.env.VITE_RADIX_DAPP_ADDRESS
      })

      if (!result || result.isErr()) {
        const error = result?.error || new Error('Failed to connect wallet')
        console.error('Wallet connection error:', error)
        throw error
      }

      const { walletAddress } = result.value
      set({ wallet: { connected: true, address: walletAddress }})
      window.posthog?.capture('wallet_connect_success', { ms: performance.now() - start })
      return true
    } catch (error) {
      window.posthog?.capture('wallet_connect_error', { error: error.message })
      return false
    }
  },

  selectTier: (tier) => {
    set({ selectedTier: tier })
    window.posthog?.capture('tier_selected', { tier })
  },

  openCapsule: async () => {
    if (!get().wallet.connected) {
      return false
    }
    const start = performance.now()
    try {
      set({ capsuleOpening: true })
      window.posthog?.capture('capsule_open_start')

      const result = await dappToolkit.sendTransaction({
        networkId: import.meta.env.VITE_RADIX_NETWORK_ID || 'mainnet-beta',
        dAppDefinitionAddress: import.meta.env.VITE_RADIX_DAPP_ADDRESS,
        actions: [{
          type: 'CallMethod',
          componentAddress: import.meta.env.VITE_RADIX_CAPSULE_COMPONENT,
          methodName: 'open_capsule',
          args: [get().selectedTier]
        }]
      })

      if (!result || result.isErr()) {
        const error = result?.error || new Error('Failed to connect wallet')
        console.error('Wallet connection error:', error)
        throw error
      }

      // Cache the capsule data
      const capsuleData = {
        id: result.value.transactionHash,
        tier: get().selectedTier,
        timestamp: Date.now()
      }
      await cacheManager.cacheCapsule(capsuleData)

      window.posthog?.capture('capsule_open_success', { ms: performance.now() - start })
      return true
    } catch (error) {
      window.posthog?.capture('capsule_open_error', { error: error.message })
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
        `Just opened a ${lootData.rarity} ${lootData.tier} capsule in GachaFi! 🎉`
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
