import React from 'react'
import ReactDOM from 'react-dom'
import { registerSW } from 'virtual:pwa-register'
import posthog from 'posthog-js'
import { RadixDappToolkit, DataRequestBuilder } from '@radixdlt/radix-dapp-toolkit'
import { Configuration, StateApi } from '@radixdlt/babylon-gateway-api-sdk'
import ErrorBoundary from './components/ErrorBoundary'
import ToolkitErrorBoundary from './components/ToolkitErrorBoundary'
import App from './App'
import './styles/index.css'
import logger from './utils/logger'
import { useStore } from './store'

// Keep toolkit instance during HMR
let toolkitInstance = null
let stateApi = null

const NETWORK_NAME_MAP = {
  mainnet: 1,
  stokenet: 2,
  rcnet: 10,
  rcnetv2: 11,
  zabanet: 14
}

const getNetworkId = () => {
  const envId = import.meta.env.VITE_RADIX_NETWORK_ID
  if (!envId) return 1
  const parsed = parseInt(envId)
  if (!Number.isNaN(parsed)) return parsed
  const fromName = NETWORK_NAME_MAP[envId.toLowerCase()]
  if (fromName) return fromName
  logger.warn('Invalid VITE_RADIX_NETWORK_ID:', envId, '- defaulting to 1 (mainnet)')
  return 1
}

const getDappAddress = () => {
  return import.meta.env.VITE_RADIX_DAPP_ADDRESS || ''
}

const getGatewayBaseUrl = (networkId) => {
  // Map network IDs to gateway URLs
  const gatewayUrls = {
    1: 'https://mainnet.radixdlt.com',
    2: 'https://stokenet.radixdlt.com',
    10: 'https://rcnet.radixdlt.com',
    11: 'https://rcnet-v2.radixdlt.com',
    14: 'https://zabanet.radixdlt.com'
  }
  return gatewayUrls[networkId] || gatewayUrls[1]
}

// Fetch XRD balance for an account
const XRD_RESOURCES = {
  1: 'resource_rdx1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxrdj3nr',
  2: 'resource_tdx_2_1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxtfd2jc'
}

const fetchXrdBalance = async (accountAddress) => {
  try {
    if (!stateApi || !accountAddress) return 0
    const networkId = getNetworkId()
    const xrdResource = XRD_RESOURCES[networkId] || XRD_RESOURCES[1]

    const response = await stateApi.entityFungiblesPage({
      stateEntityFungiblesPageRequest: {
        address: accountAddress,
        resource_address: xrdResource
      }
    })

    const items = response?.items || []
    const xrdItem = items.find(item => item.resource_address === xrdResource)
    const balance = xrdItem?.amount
    return balance ? parseFloat(balance) : 0
  } catch (error) {
    logger.warn('Failed to fetch XRD balance:', error)
    return 0
  }
}

// Initialize Radix toolkit
const initToolkit = async () => {
  if (toolkitInstance) {
    logger.hmr('Using existing toolkit instance')
    return toolkitInstance
  }

  const dAppDefinitionAddress = getDappAddress()
  if (!dAppDefinitionAddress) {
    logger.warn('VITE_RADIX_DAPP_ADDRESS not set — wallet connect will not work')
  }

  const networkId = getNetworkId()

  try {
    // Initialize gateway API for balance fetching
    const config = new Configuration({
      basePath: getGatewayBaseUrl(networkId)
    })
    stateApi = new StateApi(config)
    logger.info('Gateway API initialized for network', networkId)
  } catch (error) {
    logger.warn('Failed to initialize Gateway API:', error)
  }

  const rdt = RadixDappToolkit({
    dAppDefinitionAddress,
    networkId,
    applicationName: 'GachaFi',
    applicationVersion: '1.0.0',
  })

  // Set default data request: at least 1 account
  // RDT 2.2.1 bug: walletApi.sendRequest() doesn't pass dataRequestState.
  // setRequestData returns a { sendRequest } that does. We monkey-patch it.
  const dataRequestApi = rdt.walletApi.setRequestData(
    DataRequestBuilder.accounts().atLeast(1)
  )
  rdt.walletApi.sendRequest = dataRequestApi.sendRequest

  // Sync wallet state to Zustand store
  rdt.walletApi.walletData$.subscribe(async (walletData) => {
    const accounts = walletData?.accounts || []
    const connected = accounts.length > 0
    const address = accounts[0]?.address || null

    const current = useStore.getState().wallet

    if (connected !== current.connected || address !== current.address) {
      logger.debug('Wallet state update:', { connected, address })

      let xrdBalance = 0
      if (connected && address && stateApi) {
        xrdBalance = await fetchXrdBalance(address)
        logger.debug('XRD balance fetched:', xrdBalance)
      }

      useStore.getState().setWallet({
        connected,
        address,
        xrdBalance
      })

      if (connected && address) {
        useStore.getState().setStatus('ready')
        window.dispatchEvent(new CustomEvent('radix_wallet_connected', {
          detail: { address, xrdBalance }
        }))
      } else {
        useStore.getState().setStatus('idle')
        window.dispatchEvent(new CustomEvent('radix_wallet_disconnected'))
      }
    }
  })

  window.gachaToolkit = rdt
  toolkitInstance = rdt
  useStore.getState().setToolkit(rdt)
  logger.info('Radix toolkit initialized')

  // Dispatch event so RDT discovers the hidden connect button in index.html
  const dispatchDiscovery = () => {
    const connectButton = document.querySelector('radix-connect-button')
    if (connectButton) {
      window.dispatchEvent(new Event('onConnectButtonRender'))
      logger.debug('Dispatched onConnectButtonRender for connect button discovery')
    }
  }
  dispatchDiscovery()
  setTimeout(dispatchDiscovery, 500)
  setTimeout(dispatchDiscovery, 1500)

  return rdt
}

// Render app immediately
const rootElement = document.getElementById('root')
ReactDOM.render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToolkitErrorBoundary>
        <App />
      </ToolkitErrorBoundary>
    </ErrorBoundary>
  </React.StrictMode>,
  rootElement
)

// Initialize toolkit and PostHog in background
const initApp = async () => {
  try {
    const toolkit = await initToolkit()
    if (!toolkit) {
      logger.info('Running without Radix toolkit')
      return
    }

    // Initialize PostHog if key exists
    const posthogKey = import.meta.env.VITE_POSTHOG_KEY
    if (posthogKey && posthogKey !== 'your_key_here') {
      posthog.init(posthogKey, {
        api_host: import.meta.env.VITE_POSTHOG_HOST,
        loaded: (ph) => {
          if (import.meta.env.DEV) {
            ph.opt_out_capturing()
          }
        }
      })
    }
  } catch (error) {
    logger.error('Background initialization error:', error)
  }
}

// Register service worker
registerSW({
  onNeedRefresh() {
    logger.info('New content available')
  },
  onOfflineReady() {
    logger.info('App ready to work offline')
  },
  onRegistered(registration) {
    logger.info('Service worker registered')
  },
  onRegisterError(error) {
    logger.error('Service worker registration error:', error)
  }
})

// Initialize app in background
initApp()

// Handle HMR
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    logger.hmr('HMR update, preserving toolkit instance')
  })
}
