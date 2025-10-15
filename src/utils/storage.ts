/**
 * IndexedDB 存储工具类
 * 保持与现有存储逻辑完全兼容
 */

import type { 
  CachedFile, 
  SaveData, 
  AnswerHistory, 
  StorageResult
} from '@/types/storage'

export class IndexedDBStorage {
  private db: IDBDatabase | null = null
  private readonly dbName = 'save'
  private readonly dbVersion = 1

  /**
   * 初始化数据库
   */
  async init(): Promise<StorageResult<IDBDatabase>> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => {
        reject({ success: false, error: 'Failed to open database' })
      }

      request.onsuccess = () => {
        this.db = request.result
        resolve({ success: true, data: this.db })
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        // 创建缓存文件存储区
        if (!db.objectStoreNames.contains('CachedFile')) {
          db.createObjectStore('CachedFile', { keyPath: 'url' })
        }
        
        // 创建保存数据存储区
        if (!db.objectStoreNames.contains('Save')) {
          db.createObjectStore('Save', { keyPath: 'url' })
        }
        
        // 创建答题历史存储区
        if (!db.objectStoreNames.contains('AnswerHistory')) {
          db.createObjectStore('AnswerHistory', { autoIncrement: true })
        }
      }
    })
  }

  /**
   * 获取缓存文件
   */
  async getCachedFile(url: string): Promise<StorageResult<CachedFile | null>> {
    if (!this.db) {
      return { success: false, error: 'Database not initialized' }
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['CachedFile'], 'readonly')
      const objectStore = transaction.objectStore('CachedFile')
      const request = objectStore.get(url)

      request.onerror = () => {
        reject({ success: false, error: 'Failed to get cached file' })
      }

      request.onsuccess = () => {
        const result = request.result
        resolve({ 
          success: true, 
          data: result || null 
        })
      }
    })
  }

  /**
   * 存储缓存文件
   */
  async setCachedFile(cachedFile: CachedFile): Promise<StorageResult<void>> {
    if (!this.db) {
      return { success: false, error: 'Database not initialized' }
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['CachedFile'], 'readwrite')
      const objectStore = transaction.objectStore('CachedFile')
      const request = objectStore.put(cachedFile)

      request.onerror = () => {
        reject({ success: false, error: 'Failed to cache file' })
      }

      request.onsuccess = () => {
        resolve({ success: true })
      }
    })
  }

  /**
   * 获取保存数据
   */
  async getSaveData(url: string): Promise<StorageResult<SaveData | null>> {
    if (!this.db) {
      return { success: false, error: 'Database not initialized' }
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['Save'], 'readonly')
      const objectStore = transaction.objectStore('Save')
      const request = objectStore.get(url)

      request.onerror = () => {
        reject({ success: false, error: 'Failed to get save data' })
      }

      request.onsuccess = () => {
        const result = request.result
        resolve({ 
          success: true, 
          data: result || null 
        })
      }
    })
  }

  /**
   * 保存数据
   */
  async setSaveData(saveData: SaveData): Promise<StorageResult<void>> {
    if (!this.db) {
      return { success: false, error: 'Database not initialized' }
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['Save'], 'readwrite')
      const objectStore = transaction.objectStore('Save')
      const request = objectStore.put(saveData)

      request.onerror = () => {
        reject({ success: false, error: 'Failed to save data' })
      }

      request.onsuccess = () => {
        resolve({ success: true })
      }
    })
  }

  /**
   * 添加答题历史
   */
  async addAnswerHistory(history: AnswerHistory): Promise<StorageResult<number>> {
    if (!this.db) {
      return { success: false, error: 'Database not initialized' }
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['AnswerHistory'], 'readwrite')
      const objectStore = transaction.objectStore('AnswerHistory')
      const request = objectStore.add(history)

      request.onerror = () => {
        reject({ success: false, error: 'Failed to add answer history' })
      }

      request.onsuccess = () => {
        resolve({ 
          success: true, 
          data: request.result as number 
        })
      }
    })
  }

  /**
   * 获取答题历史
   */
  async getAnswerHistory(url?: string): Promise<StorageResult<AnswerHistory[]>> {
    if (!this.db) {
      return { success: false, error: 'Database not initialized' }
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['AnswerHistory'], 'readonly')
      const objectStore = transaction.objectStore('AnswerHistory')
      const request = objectStore.getAll()

      request.onerror = () => {
        reject({ success: false, error: 'Failed to get answer history' })
      }

      request.onsuccess = () => {
        let history = request.result as AnswerHistory[]
        
        // 如果指定了URL，则过滤
        if (url) {
          history = history.filter(item => item.url === url)
        }
        
        resolve({ 
          success: true, 
          data: history 
        })
      }
    })
  }

  /**
   * 清空所有数据
   */
  async clearAll(): Promise<StorageResult<void>> {
    if (!this.db) {
      return { success: false, error: 'Database not initialized' }
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['CachedFile', 'Save', 'AnswerHistory'], 'readwrite')
      
      transaction.objectStore('CachedFile').clear()
      transaction.objectStore('Save').clear()
      transaction.objectStore('AnswerHistory').clear()

      transaction.onerror = () => {
        reject({ success: false, error: 'Failed to clear data' })
      }

      transaction.oncomplete = () => {
        resolve({ success: true })
      }
    })
  }
}

// 单例实例
export const storage = new IndexedDBStorage()
