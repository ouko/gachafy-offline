// IndexedDB cache manager for capsule data
const DB_NAME = 'gachafi-cache'
const DB_VERSION = 1
const CAPSULE_STORE = 'capsules'

class CacheManager {
  constructor() {
    this.db = null
    this.dbInitialized = false
    this.dbInitializing = null
  }

  async initDB() {
    if (typeof window === 'undefined' || !window.indexedDB) {
      console.warn('IndexedDB not available')
      return
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = (event) => {
        console.error('IndexedDB error:', event.target.error)
        reject(event.target.error)
      }

      request.onupgradeneeded = (event) => {
        const db = event.target.result
        if (!db.objectStoreNames.contains(CAPSULE_STORE)) {
          db.createObjectStore(CAPSULE_STORE, { keyPath: 'id' })
        }
      }

      request.onsuccess = (event) => {
        this.db = event.target.result
        resolve(this.db)
      }
    })
  }

  async ensureInitialized() {
    if (this.dbInitialized) return
    if (!this.dbInitializing) {
      this.dbInitializing = this.initDB()
    }
    try {
      await this.dbInitializing
      this.dbInitialized = true
    } catch (error) {
      console.error('Failed to initialize DB:', error)
      throw error
    }
  }

  async cacheCapsule(capsuleData) {
    await this.ensureInitialized()
    if (!this.db) return false

    try {
      const transaction = this.db.transaction([CAPSULE_STORE], 'readwrite')
      const store = transaction.objectStore(CAPSULE_STORE)
      await store.put(capsuleData)
      return true
    } catch (error) {
      console.error('Error caching capsule:', error)
      return false
    }
  }

  async getCapsule(id) {
    await this.ensureInitialized()
    if (!this.db) return null

    try {
      const transaction = this.db.transaction([CAPSULE_STORE], 'readonly')
      const store = transaction.objectStore(CAPSULE_STORE)
      const capsule = await store.get(id)
      return capsule || null
    } catch (error) {
      console.error('Error getting capsule:', error)
      return null
    }
  }

  async getAllCapsules() {
    await this.ensureInitialized()
    if (!this.db) return []

    try {
      const transaction = this.db.transaction([CAPSULE_STORE], 'readonly')
      const store = transaction.objectStore(CAPSULE_STORE)
      const capsules = await store.getAll()
      return capsules || []
    } catch (error) {
      console.error('Error getting all capsules:', error)
      return []
    }
  }

  async clearCache() {
    await this.ensureInitialized()
    if (!this.db) return false

    try {
      const transaction = this.db.transaction([CAPSULE_STORE], 'readwrite')
      const store = transaction.objectStore(CAPSULE_STORE)
      await store.clear()
      return true
    } catch (error) {
      console.error('Error clearing cache:', error)
      return false
    }
  }
}

const cacheManager = new CacheManager()
export { cacheManager }
