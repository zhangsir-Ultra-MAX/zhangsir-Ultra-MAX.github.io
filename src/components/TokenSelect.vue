<template>
  <el-select :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" @change="handleChange"
    class="token-select" size="large" value-key="symbol" :placeholder="placeholder">
    <template #prefix v-if="modelValue">
      <img :src="getTokenIcon(modelValue.symbol)" :alt="modelValue.symbol" class="token-icon" />
    </template>
    <el-option v-for="token in tokens" :key="token.symbol" :label="token.symbol" :value="token">
      <div class="token-option">
        <img :src="getTokenIcon(token.symbol)" :alt="token.symbol" class="token-icon" />
        <span>{{ token.symbol }}</span>
      </div>
    </el-option>
  </el-select>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'

interface Token {
  symbol: string
  name: string
  address: string
  decimals: number
  balance?: number
}

interface Props {
  modelValue?: Token
  tokens: Token[]
  placeholder?: string
}

interface Emits {
  'update:modelValue': [value: Token],
  'tokenChange': [value: Token, oldValue: Token | undefined]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Get token icon based on symbol
const getTokenIcon = (symbol: string): string => {
  const iconMap: Record<string, string> = {
    'WRMB': new URL('../assets/wrmb.png', import.meta.url).href,
    'USDC': new URL('../assets/usdc.png', import.meta.url).href,
    'USDT': new URL('../assets/usdt.png', import.meta.url).href
  }
  return iconMap[symbol] || ''
}

const handleChange = (value: Token) => {
  const oldValue = props.modelValue
  emit('tokenChange', value, oldValue);
}
</script>

<style scoped>
.token-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.token-icon {
  @apply w-5 h-5 rounded-full object-cover;
}
</style>