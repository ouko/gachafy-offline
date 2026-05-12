const MAX_RETRIES = 3
const RETRY_DELAY = 2000 // 2 seconds

export const withRetry = async (fn, { onRetry, onError } = {}) => {
  let retries = 0
  
  while (retries < MAX_RETRIES) {
    try {
      return await fn()
    } catch (error) {
      retries++
      
      // Don't retry user cancellations
      if (error.message.includes('cancelled')) {
        throw error
      }
      
      if (retries === MAX_RETRIES) {
        onError?.(error)
        throw error
      }
      
      console.log(`Retrying transaction (${retries}/${MAX_RETRIES})...`)
      onRetry?.(retries, error)
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
    }
  }
}
