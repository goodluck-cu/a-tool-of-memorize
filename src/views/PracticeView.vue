<template>
  <div class="practice-view">
    <!-- 头部信息 -->
    <header class="practice-header">
      <div class="progress-info">
        <span class="current-question">{{ currentIndex + 1 }}</span>
        <span class="separator">/</span>
        <span class="total-questions">{{ totalQuestions }}</span>
      </div>
      <div class="progress-bar">
        <div 
          class="progress-fill" 
          :style="{ width: `${progress}%` }"
        ></div>
      </div>
    </header>

    <!-- 题目卡片 -->
    <main class="practice-main">
      <QuestionCard
        v-if="currentQuestion"
        :question="currentQuestion"
        :current-index="currentIndex"
        :total-questions="totalQuestions"
        :selected-answers="selectedAnswers"
        :is-answered="isAnswered"
        :show-answer="showAnswer"
        :show-knowledge="showKnowledge"
        @option-select="handleOptionSelect"
        @select-answer="handleSelectAnswer"
        @toggle-answer="handleToggleAnswer"
        @submit-answer="handleSubmitAnswer"
        @toggle-knowledge="toggleKnowledge"
      />
      
      <!-- 空状态 -->
      <div v-else class="empty-state">
        <div class="empty-icon">📚</div>
        <h2 class="empty-title">暂无题目</h2>
        <p class="empty-message">请检查练习文件是否正确加载</p>
      </div>
    </main>

    <!-- 底部导航 -->
    <footer class="practice-footer">
      <div class="nav-buttons">
        <button
          class="nav-button prev-button"
          :disabled="!hasPrevious"
          @click="handlePrevious"
        >
          ← 上一题
        </button>
        <button
          class="nav-button submit-button"
          :disabled="!isAnswered"
          @click="handleSubmitAnswer"
        >
          提交
        </button>
        <button
          class="nav-button random-button"
          @click="handleRandom"
        >
          🎲 随机
        </button>
        <button
          class="nav-button next-button"
          :disabled="!hasNext"
          @click="handleNext"
        >
          下一题 →
        </button>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useQuestionData } from '@/composables/useQuestionData'
import { useAnswerTracking } from '@/composables/useAnswerTracking'
import { useMobileOptimization } from '@/composables/useMobileOptimization'
import QuestionCard from '@/components/QuestionCard.vue'

// Props
interface Props {
  practiceFile?: string
}

const props = withDefaults(defineProps<Props>(), {
  practiceFile: 'default'
})

// 路由
const route = useRoute()

// 组合式函数
const { 
  questions,
  currentIndex,
  currentQuestion,
  totalQuestions,
  hasNext,
  hasPrevious,
  progress,
  isLoading,
  error,
  currentUrl,
  loadQuestions,
  nextQuestion,
  previousQuestion,
  randomQuestion
} = useQuestionData()

const { 
  selectedAnswers,
  isAnswered,
  showAnswer,
  showKnowledge,
  selectAnswer,
  toggleAnswer,
  submitAnswer,
  toggleKnowledge,
  resetAnswer 
} = useAnswerTracking()
const { isMobile } = useMobileOptimization()

// 计算属性
const practiceFileName = computed(() => {
  return props.practiceFile || (route.query.practice as string) || 'default'
})

// 调试日志
watch([currentQuestion, currentIndex, totalQuestions], ([question, index, total]) => {
  console.log('🔍 [PracticeView] State changed:', {
    currentQuestion: question,
    currentIndex: index,
    totalQuestions: total,
    hasQuestion: !!question
  })
}, { immediate: true })

// 方法
const handleNext = async () => {
  await nextQuestion()
  resetAnswer()
}

const handlePrevious = async () => {
  await previousQuestion()
  resetAnswer()
}

const handleRandom = async () => {
  await randomQuestion()
  resetAnswer()
}


const handleSubmitAnswer = async () => {
  if (!currentQuestion.value) return
  
  await submitAnswer(
    currentQuestion.value.id,
    currentUrl.value || '',
    Array.isArray(currentQuestion.value.answer) 
      ? currentQuestion.value.answer 
      : [currentQuestion.value.answer]
  )
}

const handleOptionSelect = (value: string | boolean) => {
  console.log('🎯 [PracticeView] Option selected:', value)
}

const handleSelectAnswer = (value: string | boolean) => {
  console.log('🎯 [PracticeView] Select answer:', value)
  selectAnswer(value)
}

const handleToggleAnswer = (value: string | boolean) => {
  console.log('🎯 [PracticeView] Toggle answer:', value)
  toggleAnswer(value)
}

// 加载题目数据
const loadPracticeData = async () => {
  try {
    const fileName = practiceFileName.value
    const fileUrl = `./${fileName}.txt`
    console.log('🎯 [PracticeView] Loading practice data...')
    console.log('🎯 [PracticeView] File name:', fileName)
    console.log('🎯 [PracticeView] File URL:', fileUrl)
    await loadQuestions(fileUrl)
    console.log('✅ [PracticeView] Practice data loaded successfully')
  } catch (err) {
    console.error('❌ [PracticeView] Failed to load practice data:', err)
  }
}

// 监听练习文件变化
watch(practiceFileName, () => {
  loadPracticeData()
})

onMounted(() => {
  loadPracticeData()
})
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;
.practice-view {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--color-bg-muted);
}

.practice-header {
  background: var(--color-bg);
  padding: var(--spacing-md);
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
}

.progress-info {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--spacing-sm);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  
  @include mobile-only {
    font-size: var(--font-size-base);
  }
}

.current-question {
  color: var(--color-primary);
}

.separator {
  margin: 0 var(--spacing-xs);
  color: var(--color-text-muted);
}

.total-questions {
  color: var(--color-text-muted);
}

.progress-bar {
  width: 100%;
  height: 4px;
  background-color: var(--color-border);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: var(--color-primary);
  border-radius: var(--radius-full);
  transition: width var(--transition-normal);
}

.practice-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: var(--spacing-md);
  
  @include mobile-only {
    padding: var(--spacing-sm);
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  text-align: center;
  padding: var(--spacing-xl);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: var(--spacing-lg);
}

.empty-title {
  font-size: var(--font-size-xxl);
  color: var(--color-text);
  margin-bottom: var(--spacing-sm);
}

.empty-message {
  font-size: var(--font-size-base);
  color: var(--color-text-muted);
  max-width: 400px;
}

.practice-footer {
  background: var(--color-bg);
  padding: var(--spacing-md);
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  bottom: 0;
  z-index: var(--z-sticky);
}

.nav-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: var(--spacing-sm);
  max-width: 600px;
  margin: 0 auto;
}

.nav-button {
  @include button-base;
  flex: 1;
  padding: var(--spacing-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  
  @include mobile-only {
    font-size: var(--font-size-xs);
    padding: var(--spacing-sm);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &.prev-button {
    background-color: var(--color-bg-muted);
    color: var(--color-text);
    border: 1px solid var(--color-border);
    
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
  
  &.random-button {
    background-color: var(--color-info);
    color: white;
    
    &:hover {
      background-color: var(--color-info);
      opacity: 0.9;
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

@include mobile-only {
  .nav-buttons {
    gap: var(--spacing-xs);
  }
  
  .nav-button {
    padding: var(--spacing-sm);
    font-size: var(--font-size-xs);
  }
}
</style>
