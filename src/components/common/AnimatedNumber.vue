<template>
  <span>
    <span class="integer-part">{{ formatNumber(integerPart, 0) }}</span>
    <span class="decimal-part" v-if="decimalPart">{{ decimalPart }}</span>
  </span>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import { formatNumber } from '@/utils/format'

interface Props {
  value: number | string
  duration?: number
  decimals?: number
  increment?: number
  autoIncrement?: boolean
  incrementInterval?: number
  incrementAmount?: number
}

const props = withDefaults(defineProps<Props>(), {
  duration: 1000,
  decimals: 8,
  increment: 0.00000001,
  autoIncrement: false,
  incrementInterval: 100,
  incrementAmount: 0.00000001
})

const displayValue = ref('0')
const currentValue = ref(0)
const targetValue = ref(0)
const animationId = ref<number | null>(null)
const incrementTimer = ref<number | null>(null)

// 计算整数和小数部分
const integerPart = computed(() => {
  const parts = displayValue.value.split('.')
  return parts[0]
})

const decimalPart = computed(() => {
  const parts = displayValue.value.split('.')
  return parts.length > 1 ? '.' + parts[1] : ''
})

const curFormatNumber = (num: number): string => {
  return num.toFixed(props.decimals)
}

const animateToTarget = () => {
  const startValue = currentValue.value
  const endValue = targetValue.value
  const startTime = Date.now()
  
  const animate = () => {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / props.duration, 1)
    
    // 使用缓动函数，让动画更自然
    const easeOutQuart = 1 - Math.pow(1 - progress, 4)
    
    currentValue.value = startValue + (endValue - startValue) * easeOutQuart
    displayValue.value = curFormatNumber(currentValue.value)
    
    if (progress < 1) {
      animationId.value = requestAnimationFrame(animate)
    } else {
      currentValue.value = endValue
      displayValue.value = curFormatNumber(endValue)
    }
  }
  
  animate()
}

const startAutoIncrement = () => {
  if (!props.autoIncrement) return
  
  incrementTimer.value = window.setInterval(() => {
    targetValue.value += props.incrementAmount
    animateToTarget()
  }, props.incrementInterval)
}

const stopAutoIncrement = () => {
  if (incrementTimer.value) {
    clearInterval(incrementTimer.value)
    incrementTimer.value = null
  }
}

watch(
  () => props.value,
  (newValue) => {
    const numValue = typeof newValue === 'string' ? parseFloat(newValue) : newValue
    if (!isNaN(numValue) && numValue !== targetValue.value) {
      targetValue.value = numValue
      animateToTarget()
    }
  },
  { immediate: true }
)

watch(
  () => props.autoIncrement,
  (newValue) => {
    if (newValue) {
      startAutoIncrement()
    } else {
      stopAutoIncrement()
    }
  },
  { immediate: true }
)

onMounted(() => {
  const initialValue = typeof props.value === 'string' ? parseFloat(props.value) : props.value
  if (!isNaN(initialValue)) {
    currentValue.value = initialValue
    targetValue.value = initialValue
    displayValue.value = curFormatNumber(initialValue)
  }
  
  if (props.autoIncrement) {
    startAutoIncrement()
  }
})

onUnmounted(() => {
  if (animationId.value) {
    cancelAnimationFrame(animationId.value)
  }
  stopAutoIncrement()
})
</script>

<style scoped>
.decimal-part {
  font-size: 0.8em;
}
</style>