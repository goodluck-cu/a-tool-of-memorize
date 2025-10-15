/**
 * UI相关类型定义
 */

// 设备类型
export type DeviceType = 'mobile' | 'tablet' | 'desktop'

// 屏幕方向
export type Orientation = 'portrait' | 'landscape'

// 断点配置
export interface BreakpointConfig {
  mobile: number
  tablet: number
  desktop: number
}

// 触摸手势类型
export type GestureType = 'tap' | 'swipe' | 'longpress' | 'pinch'

// 手势方向
export type SwipeDirection = 'left' | 'right' | 'up' | 'down'

// 手势事件
export interface GestureEvent {
  type: GestureType
  direction?: SwipeDirection
  startX: number
  startY: number
  endX: number
  endY: number
  duration: number
  target: EventTarget | null
}

// 手势处理器
export interface GestureHandlers {
  onTap?: (event: GestureEvent) => void
  onSwipe?: (direction: SwipeDirection, event: GestureEvent) => void
  onLongPress?: (event: GestureEvent) => void
  onPinch?: (event: GestureEvent) => void
}

// 主题配置
export interface ThemeConfig {
  colors: {
    primary: string
    secondary: string
    success: string
    danger: string
    warning: string
    info: string
    text: string
    textMuted: string
    background: string
    backgroundMuted: string
    border: string
  }
  spacing: {
    xs: string
    sm: string
    md: string
    lg: string
    xl: string
    xxl: string
  }
  typography: {
    fontSize: {
      xs: string
      sm: string
      base: string
      lg: string
      xl: string
      xxl: string
    }
    lineHeight: {
      tight: number
      normal: number
      relaxed: number
    }
  }
  borderRadius: {
    sm: string
    md: string
    lg: string
    xl: string
  }
}

// 响应式配置
export interface ResponsiveConfig {
  breakpoints: BreakpointConfig
  touchTargets: {
    min: string
    large: string
  }
}
