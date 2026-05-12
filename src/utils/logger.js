const isDev = import.meta.env.DEV

const logger = {
  debug: (...args) => {
    if (isDev) {
      console.log('[DEBUG]', ...args)
    }
  },
  
  info: (...args) => {
    if (isDev) {
      console.info('[INFO]', ...args)
    }
  },
  
  warn: (...args) => {
    if (isDev) {
      console.warn('[WARN]', ...args)
    }
  },
  
  error: (...args) => {
    console.error('[ERROR]', ...args)
    if (!isDev && window.posthog) {
      window.posthog.capture('error', { message: args.join(' ') })
    }
  },

  hmr: (...args) => {
    if (isDev) {
      console.log('[HMR]', ...args)
    }
  }
}

export default logger
