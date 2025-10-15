<template>
  <div id="app" class="app">
    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p class="loading-text">正在加载...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-container">
      <div class="error-icon">⚠️</div>
      <h2 class="error-title">加载失败</h2>
      <p class="error-message">{{ error }}</p>
      <button class="retry-button" @click="retry">重试</button>
    </div>

    <!-- 主内容 -->
    <div v-else class="main-content">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useIndexedDB } from '@/composables/useIndexedDB'

// 状态
const isLoading = ref(true)
const error = ref<string | null>(null)

// 组合式函数
const { init: initDB } = useIndexedDB()

// 初始化应用
const initializeApp = async () => {
  try {
    isLoading.value = true
    error.value = null
    
    // 初始化数据库
    await initDB()
    
    // 其他初始化逻辑...
    
  } catch (err) {
    error.value = err instanceof Error ? err.message : '初始化失败'
  } finally {
    isLoading.value = false
  }
}

// 重试
const retry = () => {
  initializeApp()
}

onMounted(() => {
  initializeApp()
})
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: var(--spacing-lg);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--color-border);
  border-top: 4px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: var(--spacing-md);
}

.loading-text {
  font-size: var(--font-size-lg);
  color: var(--color-text-muted);
  margin: 0;
}

.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: var(--spacing-lg);
  text-align: center;
}

.error-icon {
  font-size: 48px;
  margin-bottom: var(--spacing-md);
}

.error-title {
  font-size: var(--font-size-xxl);
  color: var(--color-danger);
  margin-bottom: var(--spacing-sm);
}

.error-message {
  font-size: var(--font-size-base);
  color: var(--color-text-muted);
  margin-bottom: var(--spacing-lg);
  max-width: 400px;
}

.retry-button {
  @include button-base;
  background-color: var(--color-primary);
  color: white;
  padding: var(--spacing-md) var(--spacing-lg);
  
  &:hover {
    background-color: var(--color-primary-dark);
  }
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}
</style>
