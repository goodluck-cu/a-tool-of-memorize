/**
 * 答题跟踪组合式函数
 */

import { ref, computed } from 'vue'
import { storage } from '@/utils/storage'
import type { AnswerHistory, UserSelection, AnswerResult } from '@/types'

export function useAnswerTracking() {
  const userSelections = ref<UserSelection[]>([])
  const isAnswered = ref(false)
  const showAnswer = ref(false)
  const showKnowledge = ref(false)
  const answerHistory = ref<AnswerHistory[]>([])

  // 计算属性
  const selectedAnswers = computed(() => 
    userSelections.value.map(selection => selection.value)
  )

  const isCorrect = computed(() => {
    // 这里需要根据当前题目来判断，暂时返回false
    return false
  })

  // 选择答案
  const selectAnswer = (value: string | boolean): void => {
    const selection: UserSelection = {
      value,
      timestamp: new Date()
    }

    // 如果是单选题，清除之前的选择
    // 这里需要根据题目类型来判断
    userSelections.value = [selection]
    isAnswered.value = true
  }

  // 多选答案
  const toggleAnswer = (value: string | boolean): void => {
    const existingIndex = userSelections.value.findIndex(
      selection => selection.value === value
    )

    if (existingIndex >= 0) {
      // 取消选择
      userSelections.value.splice(existingIndex, 1)
    } else {
      // 添加选择
      const selection: UserSelection = {
        value,
        timestamp: new Date()
      }
      userSelections.value.push(selection)
    }

    isAnswered.value = userSelections.value.length > 0
  }

  // 提交答案
  const submitAnswer = async (
    questionId: number,
    url: string,
    correctAnswers: (string | boolean)[]
  ): Promise<AnswerResult> => {
    const result: AnswerResult = {
      isCorrect: checkAnswer(correctAnswers),
      selectedAnswers: selectedAnswers.value,
      correctAnswers,
      timeSpent: 0 // 这里可以计算答题时间
    }

    // 保存答题历史
    const history: AnswerHistory = {
      quest_id: questionId,
      url,
      date: new Date(),
      selected: selectedAnswers.value,
      right: result.isCorrect
    }

    try {
      const result = await storage.addAnswerHistory(history)
      if (result.success) {
        answerHistory.value.push(history)
      }
    } catch (error) {
      console.warn('Failed to save answer history:', error)
    }

    showAnswer.value = true
    return result
  }

  // 检查答案是否正确
  const checkAnswer = (correctAnswers: (string | boolean)[]): boolean => {
    if (selectedAnswers.value.length !== correctAnswers.length) {
      return false
    }

    return correctAnswers.every(answer => 
      selectedAnswers.value.includes(answer)
    )
  }

  // 显示知识点
  const toggleKnowledge = (): void => {
    showKnowledge.value = !showKnowledge.value
  }

  // 重置答题状态
  const resetAnswer = (): void => {
    userSelections.value = []
    isAnswered.value = false
    showAnswer.value = false
    showKnowledge.value = false
  }

  // 加载答题历史
  const loadAnswerHistory = async (url?: string): Promise<void> => {
    try {
      const result = await storage.getAnswerHistory(url)
      if (result.success && result.data) {
        answerHistory.value = result.data
      }
    } catch (error) {
      console.warn('Failed to load answer history:', error)
    }
  }

  return {
    // 状态
    userSelections,
    isAnswered,
    showAnswer,
    showKnowledge,
    answerHistory,
    
    // 计算属性
    selectedAnswers,
    isCorrect,
    
    // 方法
    selectAnswer,
    toggleAnswer,
    submitAnswer,
    toggleKnowledge,
    resetAnswer,
    loadAnswerHistory
  }
}
