<template>
  <div class="practice-view">
    <!-- 头部信息 -->
    <header class="practice-header">
      <div class="progress-info" @click="showJumpDialog = true">
        <span class="current-question">{{ currentIndex + 1 }}</span>
        <span class="separator">/</span>
        <span class="total-questions">{{ totalQuestions }}</span>
        <span class="jump-hint">点击跳转</span>
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

    <!-- 跳转对话框 -->
    <div v-if="showJumpDialog" class="jump-dialog-overlay" @click="showJumpDialog = false">
      <div class="jump-dialog" @click.stop>
        <h3 class="dialog-title">跳转到指定题目</h3>
        <p class="dialog-description">
          请输入题目编号 (1 - {{ totalQuestions }})
        </p>
        <div class="dialog-input">
          <input 
            ref="jumpInput"
            v-model="jumpToNumber" 
            type="number" 
            :min="1" 
            :max="totalQuestions"
            placeholder="输入题目编号"
            @keyup.enter="handleJump"
            @keyup.escape="showJumpDialog = false"
          />
        </div>
        <div class="dialog-buttons">
          <button class="dialog-button cancel" @click="showJumpDialog = false">
            取消
          </button>
          <button class="dialog-button confirm" @click="handleJump" :disabled="!isValidJumpNumber">
            跳转
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
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
  randomQuestion,
  goToQuestion
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

// 跳转功能相关
const showJumpDialog = ref(false)
const jumpToNumber = ref<number | null>(null)
const jumpInput = ref<HTMLInputElement | null>(null)

// 计算属性
const practiceFileName = computed(() => {
  return props.practiceFile || (route.query.practice as string) || 'default'
})

// 验证跳转数字是否有效
const isValidJumpNumber = computed(() => {
  return jumpToNumber.value !== null && 
         jumpToNumber.value >= 1 && 
         jumpToNumber.value <= totalQuestions.value
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

// 跳转处理方法
const handleJump = async () => {
  if (!isValidJumpNumber.value) return
  
  const targetIndex = jumpToNumber.value! - 1 // 转换为0基索引
  await goToQuestion(targetIndex)
  resetAnswer()
  
  // 关闭对话框并重置输入
  showJumpDialog.value = false
  jumpToNumber.value = null
}

// 监听对话框显示状态，自动聚焦输入框
watch(showJumpDialog, async (show) => {
  if (show) {
    await nextTick()
    jumpInput.value?.focus()
    jumpToNumber.value = currentIndex.value + 1 // 设置当前题目编号
  }
})

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

// 跳转对话框样式
.jump-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  padding: var(--spacing-md);
}

.jump-dialog {
  background: var(--color-bg);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  max-width: 400px;
  width: 100%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  
  @include mobile-only {
    padding: var(--spacing-lg);
    margin: var(--spacing-md);
  }
}

.dialog-title {
  font-size: var(--font-size-xl);
  font-weight: bold;
  color: var(--color-text);
  margin: 0 0 var(--spacing-md) 0;
  text-align: center;
  
  @include mobile-only {
    font-size: var(--font-size-lg);
  }
}

.dialog-description {
  font-size: var(--font-size-base);
  color: var(--color-text-muted);
  margin: 0 0 var(--spacing-lg) 0;
  text-align: center;
  
  @include mobile-only {
    font-size: var(--font-size-sm);
  }
}

.dialog-input {
  margin-bottom: var(--spacing-lg);
  
  input {
    width: 100%;
    padding: var(--spacing-md);
    border: 2px solid var(--color-border);
    border-radius: var(--radius-md);
    font-size: var(--font-size-lg);
    text-align: center;
    background: var(--color-bg);
    color: var(--color-text);
    
    &:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.1);
    }
    
    @include mobile-only {
      font-size: var(--font-size-base);
      padding: var(--spacing-sm);
    }
  }
}

.dialog-buttons {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
}

.dialog-button {
  padding: var(--spacing-md) var(--spacing-lg);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 80px;
  
  &.cancel {
    background-color: var(--color-bg-muted);
    color: var(--color-text);
    border: 1px solid var(--color-border);
    
    &:hover {
      background-color: var(--color-border);
    }
  }
  
  &.confirm {
    background-color: var(--color-primary);
    color: white;
    
    &:hover:not(:disabled) {
      background-color: var(--color-primary-dark);
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
  
  @include mobile-only {
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: var(--font-size-sm);
  }
}

// 进度信息点击提示
.jump-hint {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  margin-left: var(--spacing-sm);
  opacity: 0.7;
  transition: opacity 0.2s ease;
  
  @include mobile-only {
    display: none; // 在移动端隐藏提示文字
  }
}

.progress-info {
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    .jump-hint {
      opacity: 1;
    }
  }
  
  &:active {
    transform: scale(0.98);
  }
}
</style>
