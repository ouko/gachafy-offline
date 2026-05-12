import create from 'zustand'
import logger from '../utils/logger'

export const useToolkitState = create((set) => ({
  status: 'idle',
  error: null,
  setStatus: (status) => {
    logger.debug('Toolkit status:', status)
    set({ status })
  },
  setError: (error) => {
    logger.error('Toolkit error:', error)
    set({ error })
  }
}))
