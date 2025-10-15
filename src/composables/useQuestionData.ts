/**
 * 题目数据管理组合式函数
 */

import { ref, computed } from 'vue'
import { CacheManager } from '@/utils/cache'
import { storage } from '@/utils/storage'
import type { ExtendedQuestion, SaveData } from '@/types'

export function useQuestionData() {
  console.log('🏗️ [QuestionData] Creating new useQuestionData instance')
  const questions = ref<ExtendedQuestion[]>([])
  const currentIndex = ref(0)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const currentUrl = ref<string | null>(null)

  // 计算属性
  const currentQuestion = computed(() => {
    const question = questions.value[currentIndex.value] || null
    console.log('🔍 [QuestionData] currentQuestion computed:', {
      currentIndex: currentIndex.value,
      questionsLength: questions.value.length,
      question: question
    })
    return question
  })

  const totalQuestions = computed(() => questions.value.length)

  const hasNext = computed(() => currentIndex.value < totalQuestions.value - 1)

  const hasPrevious = computed(() => currentIndex.value > 0)

  const progress = computed(() => {
    if (totalQuestions.value === 0) return 0
    return ((currentIndex.value + 1) / totalQuestions.value) * 100
  })

  // 加载题目数据
  const loadQuestions = async (url: string): Promise<void> => {
    console.log('📚 [QuestionData] Loading questions from URL:', url)
    isLoading.value = true
    error.value = null

    try {
      const result = await CacheManager.fetchQuestions(url)
      console.log('📚 [QuestionData] Cache result:', result)
      currentUrl.value = result.url
      
      // 转换为扩展题目格式
      const mappedQuestions = result.questions.map((q, index) => ({
        ...q,
        id: index,
        metadata: {
          source: result.url,
          version: '1.0',
          createdAt: new Date()
        }
      }))
      
      console.log('📚 [QuestionData] About to set questions.value:', {
        beforeLength: questions.value.length,
        newLength: mappedQuestions.length
      })
      
      questions.value = mappedQuestions
      
      console.log('📚 [QuestionData] Questions loaded, count:', questions.value.length)
      console.log('📚 [QuestionData] First question:', questions.value[0])

      // 加载保存的进度
      await loadProgress()
    } catch (err) {
      console.error('❌ [QuestionData] Failed to load questions:', err)
      error.value = err instanceof Error ? err.message : 'Failed to load questions'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // 加载进度
  const loadProgress = async (): Promise<void> => {
    console.log('📊 [QuestionData] Loading progress...', {
      currentUrl: currentUrl.value,
      questionsLength: questions.value.length
    })
    
    if (!currentUrl.value) return

    try {
      const result = await storage.getSaveData(currentUrl.value)
      console.log('📊 [QuestionData] Save data result:', result)
      if (result.success && result.data) {
        console.log('📊 [QuestionData] Setting currentIndex to:', result.data.current)
        currentIndex.value = result.data.current
      }
    } catch (err) {
      console.warn('Failed to load progress:', err)
    }
    
    console.log('📊 [QuestionData] Progress loaded, final state:', {
      currentIndex: currentIndex.value,
      questionsLength: questions.value.length
    })
  }

  // 保存进度
  const saveProgress = async (): Promise<void> => {
    if (!currentUrl.value) return

    try {
      const saveData: SaveData = {
        url: currentUrl.value,
        current: currentIndex.value
      }
      await storage.setSaveData(saveData)
    } catch (err) {
      console.warn('Failed to save progress:', err)
    }
  }

  // 导航方法
  const nextQuestion = async (): Promise<void> => {
    if (hasNext.value) {
      currentIndex.value++
      await saveProgress()
    }
  }

  const previousQuestion = async (): Promise<void> => {
    if (hasPrevious.value) {
      currentIndex.value--
      await saveProgress()
    }
  }

  const goToQuestion = async (index: number): Promise<void> => {
    if (index >= 0 && index < totalQuestions.value) {
      currentIndex.value = index
      await saveProgress()
    }
  }

  // 随机题目
  const randomQuestion = async (): Promise<void> => {
    if (totalQuestions.value > 0) {
      const randomIndex = Math.floor(Math.random() * totalQuestions.value)
      await goToQuestion(randomIndex)
    }
  }

  // 重置进度
  const resetProgress = async (): Promise<void> => {
    currentIndex.value = 0
    await saveProgress()
  }

  return {
    // 状态
    questions,
    currentIndex,
    isLoading,
    error,
    currentUrl,
    
    // 计算属性
    currentQuestion,
    totalQuestions,
    hasNext,
    hasPrevious,
    progress,
    
    // 方法
    loadQuestions,
    nextQuestion,
    previousQuestion,
    goToQuestion,
    randomQuestion,
    resetProgress,
    saveProgress
  }
}
