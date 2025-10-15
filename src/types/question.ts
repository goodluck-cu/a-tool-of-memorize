/**
 * 题目相关类型定义
 * 保持与现有JSON格式完全兼容
 */

// 基础题目接口 - 与现有格式完全一致
export interface Question {
  quest: string
  type: 'select' | 'judge'
  answer: string | string[] | boolean
  sels?: { [key: string]: string }
  knowledge?: string
}

// 扩展题目接口 - 添加运行时信息
export interface ExtendedQuestion extends Question {
  id: number
  metadata?: {
    source: string
    version: string
    createdAt?: Date
  }
}

// 选择题答案类型
export type SelectAnswer = string | string[]

// 判断题答案类型
export type JudgeAnswer = boolean

// 用户选择
export interface UserSelection {
  value: string | boolean
  timestamp: Date
}

// 答题结果
export interface AnswerResult {
  isCorrect: boolean
  selectedAnswers: (string | boolean)[]
  correctAnswers: (string | boolean)[]
  timeSpent: number
}

// 题目状态
export interface QuestionState {
  currentQuestion: ExtendedQuestion | null
  currentIndex: number
  totalQuestions: number
  userSelection: UserSelection[]
  isAnswered: boolean
  showAnswer: boolean
  showKnowledge: boolean
}
