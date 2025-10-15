/**
 * 缓存管理工具
 * 保持与现有缓存逻辑完全兼容
 */

import { storage } from './storage'
import { SerializationUtils } from './serialization'
import type { Question } from '@/types/question'
import type { CachedFile } from '@/types/storage'

export class CacheManager {
  /**
   * 获取题目数据（带缓存）
   */
  static async fetchQuestions(url: string): Promise<{
    url: string
    questions: Question[]
    fromCache: boolean
  }> {
    console.log('🌐 [Cache] Fetching questions from URL:', url)
    const fullUrl = new URL(url, window.location.href).toString()
    console.log('🌐 [Cache] Full URL:', fullUrl)
    
    // 初始化存储
    await storage.init()
    
    // 获取缓存
    const cachedResult = await storage.getCachedFile(fullUrl)
    const cachedFile = cachedResult.data
    console.log('💾 [Cache] Cached file found:', !!cachedFile)

    try {
      // 获取远程文件
      console.log('📡 [Cache] Fetching remote file...')
      const response = await fetch(fullUrl)
      console.log('📡 [Cache] Response status:', response.status)
      const lastModified = response.headers.get('Last-Modified')
      const lastModifiedDate = lastModified ? new Date(lastModified) : new Date()
      const text = await response.text()
      console.log('📡 [Cache] Response text length:', text.length)

      // 检查是否需要更新缓存
      let shouldUpdateCache = true
      let questions: Question[]

      if (cachedFile && lastModified) {
        console.log('🔄 [Cache] Comparing cache dates...')
        console.log('🔄 [Cache] Cached date:', cachedFile.last_modified)
        console.log('🔄 [Cache] Remote date:', lastModifiedDate)
        if (cachedFile.last_modified >= lastModifiedDate) {
          // 使用缓存
          console.log('✅ [Cache] Using cached data')
          questions = SerializationUtils.parseQuestionData(cachedFile.content)
          shouldUpdateCache = false
        } else {
          // 更新缓存
          console.log('🔄 [Cache] Updating cache with new data')
          questions = SerializationUtils.parseQuestionData(text)
        }
      } else {
        // 首次获取或没有Last-Modified头
        console.log('🆕 [Cache] First time loading or no Last-Modified header')
        questions = SerializationUtils.parseQuestionData(text)
      }

      // 更新缓存
      if (shouldUpdateCache) {
        console.log('💾 [Cache] Saving to cache...')
        const newCachedFile: CachedFile = {
          url: fullUrl,
          last_modified: lastModifiedDate,
          content: text
        }
        await storage.setCachedFile(newCachedFile)
        console.log('✅ [Cache] Cache updated successfully')
      }

      console.log('🎉 [Cache] Returning questions, count:', questions.length)
      return {
        url: fullUrl,
        questions,
        fromCache: !shouldUpdateCache
      }
    } catch (error) {
      // 如果网络请求失败，尝试使用缓存
      if (cachedFile) {
        console.warn('Network request failed, using cached data:', error)
        const questions = SerializationUtils.parseQuestionData(cachedFile.content)
        return {
          url: fullUrl,
          questions,
          fromCache: true
        }
      }
      throw error
    }
  }

  /**
   * 预加载题目数据
   */
  static async preloadQuestions(urls: string[]): Promise<void> {
    const promises = urls.map(url => 
      this.fetchQuestions(url).catch(error => {
        console.warn(`Failed to preload ${url}:`, error)
        return null
      })
    )

    await Promise.all(promises)
  }

  /**
   * 清理过期缓存
   */
  static async cleanExpiredCache(_maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    // 这里可以实现清理过期缓存的逻辑
    // 由于IndexedDB没有直接的过期机制，可以通过定期清理实现
    console.log('Cache cleanup not implemented yet')
  }

  /**
   * 获取缓存统计信息
   */
  static async getCacheStats(): Promise<{
    totalFiles: number
    totalSize: number
    oldestFile?: Date
    newestFile?: Date
  }> {
    // 这里可以实现获取缓存统计信息的逻辑
    return {
      totalFiles: 0,
      totalSize: 0
    }
  }
}
