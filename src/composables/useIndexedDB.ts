/**
 * IndexedDB 组合式函数
 */

import { ref, onMounted } from 'vue'
import { storage } from '@/utils/storage'

export function useIndexedDB() {
  const isInitialized = ref(false)
  const error = ref<string | null>(null)

  const init = async (): Promise<boolean> => {
    try {
      const result = await storage.init()
      if (result.success) {
        isInitialized.value = true
        error.value = null
        return true
      } else {
        error.value = result.error || 'Failed to initialize database'
        return false
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      return false
    }
  }

  onMounted(() => {
    init()
  })

  return {
    isInitialized,
    error,
    init
  }
}
