/**
 * 类型定义入口文件
 */

export * from './question'
export * from './storage'
export * from './ui'

// 全局应用状态
export interface AppState {
  isLoading: boolean
  error: string | null
  currentPractice: string | null
  questions: import('./question').Question[]
  currentQuestionIndex: number
  userProgress: import('./storage').SaveData | null
  answerHistory: import('./storage').AnswerHistory[]
}

// 路由参数
export interface RouteParams {
  practice?: string
}

// 组件Props基础类型
export interface BaseComponentProps {
  class?: string
  style?: string | Record<string, any>
}

// 事件处理器类型
export type EventHandler<T = Event> = (event: T) => void

// 异步操作状态
export interface AsyncState<T = any> {
  data: T | null
  loading: boolean
  error: string | null
}
