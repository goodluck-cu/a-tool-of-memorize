/**
 * 移动端优化组合式函数
 */

import { ref, computed, onMounted } from 'vue'
import { useBreakpoints, useDeviceOrientation } from '@vueuse/core'
import type { DeviceType, Orientation, GestureEvent, GestureHandlers } from '@/types'

export function useMobileOptimization() {
  // 响应式断点
  const breakpoints = useBreakpoints({
    mobile: 0,
    tablet: 768,
    desktop: 1024
  })

  // 设备方向
  const orientation = useDeviceOrientation()

  // 计算属性
  const isMobile = computed(() => breakpoints.smaller('tablet').value)
  const isTablet = computed(() => breakpoints.between('tablet', 'desktop').value)
  const isDesktop = computed(() => breakpoints.greater('desktop').value)
  
  const deviceType = computed((): DeviceType => {
    if (isMobile.value) return 'mobile'
    if (isTablet.value) return 'tablet'
    return 'desktop'
  })

  const isPortrait = computed((): boolean => {
    return orientation.isSupported.value && 
           window.innerHeight > window.innerWidth
  })

  const currentOrientation = computed((): Orientation => {
    return isPortrait.value ? 'portrait' : 'landscape'
  })

  return {
    // 设备检测
    isMobile,
    isTablet,
    isDesktop,
    deviceType,
    isPortrait,
    currentOrientation,
    
    // 断点
    breakpoints
  }
}

/**
 * 手势处理组合式函数
 */
export function useGestureHandlers(handlers: GestureHandlers) {
  const isGestureActive = ref(false)
  const startPosition = ref({ x: 0, y: 0 })
  const startTime = ref(0)

  const handleTouchStart = (event: TouchEvent) => {
    if (event.touches.length !== 1) return

    const touch = event.touches[0]
    startPosition.value = { x: touch.clientX, y: touch.clientY }
    startTime.value = Date.now()
    isGestureActive.value = true
  }

  const handleTouchMove = (event: TouchEvent) => {
    if (!isGestureActive.value || event.touches.length !== 1) return

    event.preventDefault() // 防止页面滚动
  }

  const handleTouchEnd = (event: TouchEvent) => {
    if (!isGestureActive.value) return

    const touch = event.changedTouches[0]
    const endPosition = { x: touch.clientX, y: touch.clientY }
    const endTime = Date.now()

    const deltaX = endPosition.x - startPosition.value.x
    const deltaY = endPosition.y - startPosition.value.y
    const duration = endTime - startTime.value

    // 判断手势类型
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    const minDistance = 50 // 最小滑动距离
    const maxDuration = 500 // 最大持续时间

    const gestureEvent: GestureEvent = {
      type: distance < 10 ? 'tap' : 'swipe',
      startX: startPosition.value.x,
      startY: startPosition.value.y,
      endX: endPosition.x,
      endY: endPosition.y,
      duration,
      target: event.target
    }

    if (distance < 10 && duration < 300) {
      // 点击
      handlers.onTap?.(gestureEvent)
    } else if (distance >= minDistance && duration < maxDuration) {
      // 滑动
      let direction: 'left' | 'right' | 'up' | 'down'
      
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        direction = deltaX > 0 ? 'right' : 'left'
      } else {
        direction = deltaY > 0 ? 'down' : 'up'
      }

      gestureEvent.direction = direction
      handlers.onSwipe?.(direction, gestureEvent)
    }

    isGestureActive.value = false
  }

  const handleLongPress = (event: TouchEvent) => {
    // 长按处理逻辑
    const gestureEvent: GestureEvent = {
      type: 'longpress',
      startX: startPosition.value.x,
      startY: startPosition.value.y,
      endX: startPosition.value.x,
      endY: startPosition.value.y,
      duration: 0,
      target: event.target
    }

    handlers.onLongPress?.(gestureEvent)
  }

  return {
    isGestureActive,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleLongPress
  }
}

/**
 * 性能优化组合式函数
 */
export function usePerformanceOptimization() {
  const isLowEndDevice = ref(false)
  const connectionType = ref<string>('unknown')

  const checkDevicePerformance = () => {
    // 检测低端设备
    const memory = (navigator as any).deviceMemory || 4
    const cores = navigator.hardwareConcurrency || 4
    
    isLowEndDevice.value = memory < 4 || cores < 4
  }

  const checkConnectionType = () => {
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection
    
    if (connection) {
      connectionType.value = connection.effectiveType || 'unknown'
    }
  }

  onMounted(() => {
    checkDevicePerformance()
    checkConnectionType()
  })

  return {
    isLowEndDevice,
    connectionType
  }
}
