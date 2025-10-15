<template>
  <div class="feedback-panel">
    <!-- 结果状态 - 最醒目的显示 -->
    <div class="result-banner" :class="{ 'correct': isCorrect, 'incorrect': !isCorrect }">
      <div class="result-icon">
        {{ isCorrect ? '✓' : '✗' }}
      </div>
      <div class="result-text">
        {{ isCorrect ? '回答正确' : '回答错误' }}
      </div>
    </div>

    <!-- 答案对比显示 -->
    <div class="answer-comparison">
      <div class="answer-row">
        <span class="answer-label">正确答案：</span>
        <span class="correct-answer">{{ formatCorrectAnswer() }}</span>
      </div>
      <div class="answer-row">
        <span class="answer-label">你的答案：</span>
        <span class="user-answer" :class="{ 'correct': isCorrect, 'incorrect': !isCorrect }">
          {{ formatSelectedAnswers() }}
        </span>
      </div>
    </div>

    <!-- 知识点显示 -->
    <div v-if="question?.knowledge" class="knowledge-section">
      <h3 class="section-title">知识点：</h3>
      <div class="knowledge-content">
        {{ question.knowledge }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ExtendedQuestion } from '@/types'

// Props
interface Props {
  question?: ExtendedQuestion
  selectedAnswers: (string | boolean)[]
  isCorrect: boolean
}

const props = defineProps<Props>()

// 计算属性
const correctAnswer = computed(() => {
  if (!props.question) return ''
  
  if (props.question.type === 'judge') {
    return props.question.answer ? '正确' : '错误'
  }
  
  if (Array.isArray(props.question.answer)) {
    return props.question.answer.join('、')
  }
  
  return props.question.answer
})

// 方法
const formatCorrectAnswer = (): string => {
  return correctAnswer.value
}

const formatSelectedAnswers = (): string => {
  if (props.selectedAnswers.length === 0) return '未选择'
  
  return props.selectedAnswers.map(answer => {
    if (typeof answer === 'boolean') {
      return answer ? '正确' : '错误'
    }
    return answer
  }).join('、')
}
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.feedback-panel {
  margin-top: var(--spacing-lg);
  padding: var(--spacing-md);
  background-color: var(--color-bg-muted);
  border-radius: var(--radius-md);
}

// 结果横幅 - 最醒目的显示
.result-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  border-radius: var(--radius-lg);
  font-weight: bold;
  text-align: center;
  
  &.correct {
    background: linear-gradient(135deg, #28a745, #34ce57);
    color: white;
    box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
  }
  
  &.incorrect {
    background: linear-gradient(135deg, #dc3545, #e74c3c);
    color: white;
    box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
  }
  
  @include mobile-only {
    padding: var(--spacing-md);
    margin-bottom: var(--spacing-md);
  }
}

.result-icon {
  font-size: var(--font-size-xl);
  font-weight: bold;
  
  @include mobile-only {
    font-size: var(--font-size-lg);
  }
}

.result-text {
  font-size: var(--font-size-lg);
  
  @include mobile-only {
    font-size: var(--font-size-base);
  }
}

// 答案对比区域
.answer-comparison {
  background-color: var(--color-bg);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  border: 1px solid var(--color-border);
}

.answer-row {
  display: flex;
  align-items: center;
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--color-border);
  
  &:last-child {
    border-bottom: none;
  }
  
  @include mobile-only {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-xs);
  }
}

.answer-label {
  font-size: var(--font-size-base);
  font-weight: 500;
  color: var(--color-text);
  min-width: 80px;
  
  @include mobile-only {
    font-size: var(--font-size-sm);
    min-width: auto;
  }
}

.correct-answer {
  font-size: var(--font-size-base);
  font-weight: bold;
  color: var(--color-success);
  flex: 1;
  
  @include mobile-only {
    font-size: var(--font-size-sm);
  }
}

.user-answer {
  font-size: var(--font-size-base);
  font-weight: bold;
  flex: 1;
  
  &.correct {
    color: var(--color-success);
  }
  
  &.incorrect {
    color: var(--color-danger);
  }
  
  @include mobile-only {
    font-size: var(--font-size-sm);
  }
}

// 知识点区域
.knowledge-section {
  margin-bottom: var(--spacing-md);
  padding: var(--spacing-md);
  background-color: rgba(var(--color-info-rgb), 0.1);
  border-left: 4px solid var(--color-info);
  border-radius: var(--radius-sm);
}

.section-title {
  font-size: var(--font-size-base);
  font-weight: bold;
  color: var(--color-text);
  margin: 0 0 var(--spacing-sm) 0;
  
  @include mobile-only {
    font-size: var(--font-size-sm);
  }
}

.knowledge-content {
  font-size: var(--font-size-sm);
  color: var(--color-text);
  line-height: var(--line-height-relaxed);
  
  @include mobile-only {
    font-size: var(--font-size-xs);
    line-height: 1.4;
  }
}
</style>
