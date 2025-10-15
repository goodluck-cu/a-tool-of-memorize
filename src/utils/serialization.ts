/**
 * 序列化和反序列化工具
 * 保持与现有序列化逻辑完全兼容
 */

import type { Question } from '@/types/question'

export class SerializationUtils {
  /**
   * 解析题目数据
   * 支持普通JSON和Base64编码的JSON
   */
  static parseQuestionData(text: string): Question[] {
    console.log('🔍 [Serialization] Starting to parse question data...')
    console.log('📄 [Serialization] Text length:', text.length)
    console.log('📄 [Serialization] Text preview (first 100 chars):', text.substring(0, 100))
    
    try {
      // 尝试直接解析JSON
      console.log('🔄 [Serialization] Attempting direct JSON parse...')
      const result = JSON.parse(text)
      console.log('✅ [Serialization] Direct JSON parse successful, questions count:', result.length)
      return result
    } catch (e) {
      console.log('❌ [Serialization] Direct JSON parse failed:', e instanceof Error ? e.message : 'Unknown error')
      try {
        // 尝试Base64解码后解析
        console.log('🔄 [Serialization] Attempting Base64 decode...')
        
        // 使用与 app.js 相同的 Base64 解码逻辑
        const jsonString = new TextDecoder('utf-8').decode(
          Uint8Array.from(atob(text), c => c.charCodeAt(0))
        )
        console.log('📄 [Serialization] Decoded text length:', jsonString.length)
        console.log('📄 [Serialization] Decoded text preview (first 100 chars):', jsonString.substring(0, 100))
        
        const result = JSON.parse(jsonString)
        console.log('✅ [Serialization] Base64 decode + JSON parse successful, questions count:', result.length)
        return result
      } catch (base64Error) {
        console.error('❌ [Serialization] Base64 decode failed:', base64Error instanceof Error ? base64Error.message : 'Unknown error')
        throw new Error(`Failed to parse question data: ${e instanceof Error ? e.message : 'Unknown error'}`)
      }
    }
  }

  /**
   * 序列化题目数据为JSON字符串
   */
  static serializeQuestionData(questions: Question[]): string {
    return JSON.stringify(questions, null, 2)
  }

  /**
   * 序列化题目数据为Base64编码
   */
  static serializeQuestionDataToBase64(questions: Question[]): string {
    const jsonString = this.serializeQuestionData(questions)
    const bytes = new TextEncoder().encode(jsonString)
    return btoa(String.fromCharCode(...bytes))
  }

  /**
   * 验证题目数据格式
   */
  static validateQuestionData(data: any): data is Question[] {
    if (!Array.isArray(data)) {
      return false
    }

    return data.every(item => {
      return (
        typeof item === 'object' &&
        item !== null &&
        typeof item.quest === 'string' &&
        (item.type === 'select' || item.type === 'judge') &&
        (typeof item.answer === 'string' || 
         Array.isArray(item.answer) || 
         typeof item.answer === 'boolean') &&
        (item.type === 'judge' || item.sels !== undefined) &&
        (item.knowledge === undefined || typeof item.knowledge === 'string')
      )
    })
  }

  /**
   * 清理和标准化题目数据
   */
  static normalizeQuestionData(questions: Question[]): Question[] {
    return questions.map((question) => ({
      ...question,
      quest: question.quest.trim(),
      knowledge: question.knowledge?.trim() || undefined,
      // 确保选择题有选项
      ...(question.type === 'select' && !question.sels && {
        sels: {}
      })
    }))
  }

  /**
   * 转换旧格式数据（如果需要）
   */
  static migrateLegacyData(data: any): Question[] {
    // 这里可以添加从旧格式迁移的逻辑
    // 目前直接返回，因为格式已经兼容
    return data
  }
}
