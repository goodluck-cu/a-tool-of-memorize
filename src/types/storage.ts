/**
 * 存储相关类型定义
 * 保持与现有IndexedDB结构完全兼容
 */

// 缓存文件接口
export interface CachedFile {
  url: string
  last_modified: Date
  content: string
}

// 保存数据接口
export interface SaveData {
  url: string
  current: number
}

// 答题历史接口
export interface AnswerHistory {
  quest_id: number
  url: string
  date: Date
  selected: (string | boolean)[]
  right: boolean
}

// IndexedDB 存储区配置
export interface StorageSchema {
  CachedFile: {
    keyPath: 'url'
    value: CachedFile
  }
  Save: {
    keyPath: 'url'
    value: SaveData
  }
  AnswerHistory: {
    autoIncrement: true
    value: AnswerHistory
  }
}

// 存储操作结果
export interface StorageResult<T = any> {
  success: boolean
  data?: T
  error?: string
}

// 数据库配置
export interface DatabaseConfig {
  name: string
  version: number
  stores: {
    CachedFile: IDBObjectStoreParameters
    Save: IDBObjectStoreParameters
    AnswerHistory: IDBObjectStoreParameters
  }
}
