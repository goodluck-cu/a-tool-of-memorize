import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia } from 'pinia'
import App from './App.vue'
import PracticeView from './views/PracticeView.vue'
import '@/assets/styles/global.scss'

// 路由配置
const routes = [
  {
    path: '/',
    name: 'Practice',
    component: PracticeView,
    props: (route: any) => ({
      practiceFile: route.query.practice || 'default'
    })
  }
]

const router = createRouter({
  history: createWebHistory('/'),
  routes
})

// 状态管理
const pinia = createPinia()

// 创建应用
const app = createApp(App)

app.use(router)
app.use(pinia)

app.mount('#app')
