<template>
  <div 
    class="question-card"
    :class="{ 'mobile': isMobile }"
  >
    <!-- 题目文本 -->
    <div class="question-text">
      <h2 class="question-title">
        {{ currentIndex + 1 }}. {{ currentQuestion?.quest }}
        <span class="question-type">({{ getQuestionTypeText() }})</span>
      </h2>
    </div>

    <!-- 选项列表 -->
    <div class="options-container">
      <ul class="options-list">
        <li
          v-for="(option, key) in getOptions()"
          :key="key"
          class="option-item"
          :class="getOptionClasses(key)"
          @click="handleOptionClick(key)"
        >
          <span class="option-key">{{ key }}.</span>
          <span class="option-text">{{ option }}</span>
        </li>
      </ul>
    </div>

    <!-- 反馈面板 -->
    <FeedbackPanel
      v-if="props.showAnswer"
      :question="currentQuestion"
      :selected-answers="props.selectedAnswers"
      :is-correct="isCorrect"
    />

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useMobileOptimization, useGestureHandlers } from '@/composables/useMobileOptimization'
import { useAnswerTracking } from '@/composables/useAnswerTracking'
import FeedbackPanel from './FeedbackPanel.vue'
import type { ExtendedQuestion } from '@/types'

// Props
interface Props {
  question?: ExtendedQuestion
  currentIndex?: number
  totalQuestions?: number
  selectedAnswers?: (string | boolean)[]
  isAnswered?: boolean
  showAnswer?: boolean
  showKnowledge?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  question: undefined,
  currentIndex: 0,
  totalQuestions: 0,
  selectedAnswers: () => [],
  isAnswered: false,
  showAnswer: false,
  showKnowledge: false
})

// Emits
const emit = defineEmits<{
  optionSelect: [value: string | boolean]
  selectAnswer: [value: string | boolean]
  toggleAnswer: [value: string | boolean]
  submitAnswer: []
  toggleKnowledge: []
}>()

// 组合式函数
const { isMobile } = useMobileOptimization()

// 计算属性
const currentQuestion = computed(() => props.question)
const hasNext = computed(() => props.currentIndex! < props.totalQuestions! - 1)
const hasPrevious = computed(() => props.currentIndex! > 0)

// 判断题选项映射
const mapJudgeAnswer = (answer: string | boolean): boolean => {
  if (typeof answer === 'boolean') return answer
  if (answer === '正确') return true
  if (answer === '错误') return false
  return false
}

const isCorrect = computed(() => {
  if (!currentQuestion.value) return false
  
  if (currentQuestion.value.type === 'judge') {
    // 判断题：比较布尔值
    const correctAnswer = currentQuestion.value.answer
    const selectedAnswer = mapJudgeAnswer(props.selectedAnswers![0])
    return correctAnswer === selectedAnswer
  } else {
    // 选择题：比较字符串数组，必须完全匹配
    const correctAnswers = Array.isArray(currentQuestion.value.answer) 
      ? currentQuestion.value.answer 
      : [currentQuestion.value.answer]
    
    // 检查长度是否相同
    if (correctAnswers.length !== props.selectedAnswers!.length) {
      return false
    }
    
    // 检查每个答案是否都匹配
    return correctAnswers.every(answer => props.selectedAnswers!.includes(answer))
  }
})

// 方法
const getQuestionTypeText = (): string => {
  if (!currentQuestion.value) return ''
  
  switch (currentQuestion.value.type) {
    case 'select':
      return Array.isArray(currentQuestion.value.answer) ? '多选' : '单选'
    case 'judge':
      return '判断'
    default:
      return '未知'
  }
}

const getOptions = () => {
  if (!currentQuestion.value) return {}
  
  if (currentQuestion.value.type === 'judge') {
    return { '正确': '正确', '错误': '错误' }
  }
  
  return currentQuestion.value.sels || {}
}

const getOptionClasses = (key: string) => {
  const classes = ['option-item']
  
  if (!props.showAnswer) {
    // 未提交状态：只显示选中状态
    if (props.selectedAnswers!.includes(key)) {
      classes.push('selected')
    }
    return classes
  }
  
  // 已提交状态：显示4种组合状态
  let isCorrectOption = false
  let isSelectedOption = props.selectedAnswers!.includes(key)
  
  if (currentQuestion.value?.type === 'judge') {
    // 判断题：比较布尔值
    const correctAnswer = currentQuestion.value.answer
    isCorrectOption = (key === '正确' && correctAnswer === true) || (key === '错误' && correctAnswer === false)
  } else {
    // 选择题：比较字符串
    const correctAnswers = Array.isArray(currentQuestion.value?.answer) 
      ? currentQuestion.value.answer 
      : [currentQuestion.value?.answer]
    isCorrectOption = correctAnswers.includes(key)
  }
  
  // 4种状态组合
  if (isCorrectOption && isSelectedOption) {
    // 1. 正确答案 + 已选择 = 选对了
    classes.push('correct-selected')
  } else if (isCorrectOption && !isSelectedOption) {
    // 2. 正确答案 + 未选择 = 漏选了
    classes.push('correct-missed')
  } else if (!isCorrectOption && isSelectedOption) {
    // 3. 错误答案 + 已选择 = 选错了
    classes.push('incorrect-selected')
  } else {
    // 4. 错误答案 + 未选择 = 正确未选
    classes.push('incorrect-unselected')
  }
  
  return classes
}

const handleOptionClick = (key: string) => {
  console.log('🖱️ [QuestionCard] Option clicked:', key)
  console.log('🖱️ [QuestionCard] showAnswer:', props.showAnswer)
  
  if (props.showAnswer) {
    console.log('🖱️ [QuestionCard] Answer already shown, ignoring click')
    return
  }
  
  if (currentQuestion.value?.type === 'select' && Array.isArray(currentQuestion.value.answer)) {
    // 多选题
    console.log('🖱️ [QuestionCard] Emitting toggleAnswer for multiple choice')
    emit('toggleAnswer', key)
  } else {
    // 单选题或判断题
    console.log('🖱️ [QuestionCard] Emitting selectAnswer for single choice')
    emit('selectAnswer', key)
  }
  
  emit('optionSelect', key)
}

const handleSubmit = () => {
  if (!currentQuestion.value || !props.isAnswered) return
  
  emit('submitAnswer')
}

// 手势处理 - 暂时禁用，因为导航按钮在底部
// const gestureHandlers = useGestureHandlers({
//   onSwipe: (direction) => {
//     if (direction === 'left' && hasNext.value) {
//       handleNext()
//     } else if (direction === 'right' && hasPrevious.value) {
//       handlePrevious()
//     }
//   }
// })

// const { handleTouchStart, handleTouchMove, handleTouchEnd } = gestureHandlers
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;
.question-card {
  background: var(--color-bg);
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin: var(--spacing-md);
  padding: var(--spacing-lg);
  min-height: 60vh;
  display: flex;
  flex-direction: column;

  &.mobile {
    margin: var(--spacing-sm);
    padding: var(--spacing-md);
    min-height: 70vh;
  }
}

.question-text {
  margin-bottom: var(--spacing-lg);
}

.question-title {
  font-size: var(--font-size-lg);
  line-height: var(--line-height-relaxed);
  color: var(--color-text);
  margin: 0;
  
  .question-type {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    font-weight: normal;
  }
  
  @include mobile-only {
    font-size: var(--font-size-base);
    line-height: 1.4;
    
    .question-type {
      font-size: var(--font-size-xs);
    }
  }
}

.options-container {
  flex: 1;
  margin-bottom: var(--spacing-lg);
}

.options-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.option-item {
  display: flex;
  align-items: center;
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: var(--touch-target);
  font-size: var(--font-size-base);
  
  &:hover {
    border-color: var(--color-primary);
    background-color: var(--color-bg-muted);
  }
  
  // 未提交状态
  &.selected {
    border-color: var(--color-primary);
    background-color: rgba(var(--color-primary-rgb), 0.1);
  }
  
  // 已提交状态的4种组合
  &.correct-selected {
    // 1. 正确答案 + 已选择 = 选对了 (绿色 + 勾选标记)
    border-color: var(--color-success);
    background-color: rgba(var(--color-success-rgb), 0.15);
    position: relative;
    
    &::after {
      content: '✓';
      position: absolute;
      right: var(--spacing-sm);
      top: 50%;
      transform: translateY(-50%);
      color: var(--color-success);
      font-weight: bold;
      font-size: var(--font-size-lg);
    }
  }
  
  &.correct-missed {
    // 2. 正确答案 + 未选择 = 漏选了 (绿色边框 + 感叹号)
    border-color: var(--color-success);
    background-color: rgba(var(--color-success-rgb), 0.05);
    position: relative;
    
    &::after {
      content: '!';
      position: absolute;
      right: var(--spacing-sm);
      top: 50%;
      transform: translateY(-50%);
      color: var(--color-success);
      font-weight: bold;
      font-size: var(--font-size-lg);
    }
  }
  
  &.incorrect-selected {
    // 3. 错误答案 + 已选择 = 选错了 (红色 + 叉号)
    border-color: var(--color-danger);
    background-color: rgba(var(--color-danger-rgb), 0.15);
    position: relative;
    
    &::after {
      content: '✗';
      position: absolute;
      right: var(--spacing-sm);
      top: 50%;
      transform: translateY(-50%);
      color: var(--color-danger);
      font-weight: bold;
      font-size: var(--font-size-lg);
    }
  }
  
  &.incorrect-unselected {
    // 4. 错误答案 + 未选择 = 正确未选 (灰色边框)
    border-color: var(--color-border);
    background-color: var(--color-bg-muted);
    opacity: 0.7;
  }
  
  @include mobile-only {
    font-size: var(--font-size-sm);
    padding: var(--spacing-sm);
    min-height: 40px;
  }
}

.option-key {
  font-weight: bold;
  margin-right: var(--spacing-sm);
  color: var(--color-primary);
  font-size: var(--font-size-base);
  
  @include mobile-only {
    font-size: var(--font-size-sm);
  }
}

.option-text {
  flex: 1;
  line-height: var(--line-height-normal);
  font-size: var(--font-size-base);
  
  @include mobile-only {
    font-size: var(--font-size-sm);
    line-height: 1.3;
  }
}

.navigation-buttons {
  display: flex;
  gap: var(--spacing-sm);
  justify-content: space-between;
}

.nav-button {
  flex: 1;
  padding: var(--spacing-md);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: var(--touch-target);
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &.prev-button {
    background-color: var(--color-bg-muted);
    color: var(--color-text);
    
    &:not(:disabled):hover {
      background-color: var(--color-border);
    }
  }
  
  &.submit-button {
    background-color: var(--color-primary);
    color: white;
    
    &:not(:disabled):hover {
      background-color: var(--color-primary-dark);
    }
  }
  
  &.next-button {
    background-color: var(--color-success);
    color: white;
    
    &:not(:disabled):hover {
      background-color: var(--color-success-dark);
    }
  }
}
</style>
