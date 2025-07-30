<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    :title="modalTitle"
    :width="dialogWidth"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="canClose"
    @close="handleClose"
  >
    <div class="transaction-modal">
      <!-- Transaction Steps -->
      <div class="steps-container mb-6">
        <div class="flex items-center justify-between">
          <div
            v-for="(step, index) in steps"
            :key="index"
            class="step-item"
            :class="{
              'active': currentStep === index,
              'completed': currentStep > index,
              'pending': currentStep < index
            }"
          >
            <div class="step-circle">
              <el-icon v-if="currentStep > index" class="text-white">
                <Check />
              </el-icon>
              <el-icon v-else-if="currentStep === index && (status === 'loading' || status === 'pending')" class="text-white animate-spin">
                <Loading />
              </el-icon>
              <span v-else class="text-sm font-medium">{{ index + 1 }}</span>
            </div>
            <span class="step-label">{{ step.label }}</span>
          </div>
        </div>
        
        <!-- Progress Line -->
        <div class="progress-line">
          <div 
            class="progress-fill"
            :style="{ width: `${(currentStep / (steps.length - 1)) * 100}%` }"
          ></div>
        </div>
      </div>

      <!-- Transaction Details -->
      <div class="transaction-details mb-6">
        <div class="detail-card">
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {{ $t('transaction.details') }}
          </h4>
          
          <div class="space-y-3">
            <div v-for="detail in transactionDetails" :key="detail.label" class="detail-row">
              <span class="detail-label">{{ detail.label }}</span>
              <span class="detail-value" :class="detail.highlight ? 'text-primary-600 dark:text-primary-400 font-semibold' : ''">
                {{ detail.value }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Gas Fee Information -->
      <div v-if="gasInfo" class="gas-info mb-6">
        <div class="detail-card">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ $t('transaction.gasFee') }}
            </h4>
            <el-button
              text
              size="small"
              @click="showGasDetails = !showGasDetails"
            >
              {{ showGasDetails ? $t('common.hide') : $t('common.details') }}
              <el-icon class="ml-1">
                <ArrowDown v-if="!showGasDetails" />
                <ArrowUp v-else />
              </el-icon>
            </el-button>
          </div>
          
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600 dark:text-gray-400">
              {{ $t('transaction.estimatedFee') }}
            </span>
            <span class="font-medium text-gray-900 dark:text-white">
              {{ gasInfo.estimatedFee }} ETH
            </span>
          </div>
          
          <el-collapse-transition>
            <div v-show="showGasDetails" class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">{{ $t('transaction.gasLimit') }}</span>
                  <span>{{ gasInfo.gasLimit }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">{{ $t('transaction.gasPrice') }}</span>
                  <span>{{ gasInfo.gasPrice }} Gwei</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">{{ $t('transaction.maxFee') }}</span>
                  <span>{{ gasInfo.maxFee }} ETH</span>
                </div>
              </div>
            </div>
          </el-collapse-transition>
        </div>
      </div>

      <!-- Status Messages -->
      <div class="status-section mb-6">
        <div v-if="status === 'pending'" class="status-message info">
          <el-icon class="text-blue-500">
            <InfoFilled />
          </el-icon>
          <span>{{ $t('transaction.confirmInWallet') }}</span>
        </div>
        
        <div v-else-if="status === 'loading'" class="status-message loading">
          <el-icon class="text-primary-500 animate-spin">
            <Loading />
          </el-icon>
          <span>{{ currentStepMessage }}</span>
        </div>
        
        <div v-else-if="status === 'success'" class="status-message success">
          <el-icon class="text-green-500">
            <SuccessFilled />
          </el-icon>
          <span>{{ $t('transaction.success') }}</span>
        </div>
        
        <!-- <div v-else-if="status === 'error'" class="status-message error">
          <el-icon class="text-red-500 flex-shrink-0">
            <CircleCloseFilled />
          </el-icon>
          <div class="error-message-container">
            <span>{{ errorMessage || $t('transaction.failed') }}</span>
          </div>
        </div> -->
      </div>

      <!-- Transaction Hash -->
      <div v-if="transactionHash" class="transaction-hash mb-6">
        <div class="detail-card">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ $t('transaction.hash') }}
            </span>
            <div class="flex items-center space-x-2">
              <el-button
                text
                size="small"
                @click="copyTransactionHash"
              >
                <el-icon><DocumentCopy /></el-icon>
              </el-button>
              <el-button
                text
                size="small"
                @click="viewOnExplorer"
              >
                <el-icon><Link /></el-icon>
              </el-button>
            </div>
          </div>
          <div class="mt-2">
            <code class="text-xs text-gray-600 dark:text-gray-400 break-all">
              {{ transactionHash }}
            </code>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer Actions -->
    <template #footer>
      <div class="flex justify-end space-x-3">
        <el-button
          v-if="canClose"
          @click="handleClose"
        >
          {{ status === 'success' ? $t('common.close') : $t('common.cancel') }}
        </el-button>
        
        <el-button
          v-if="status === 'error'"
          type="primary"
          @click="handleRetry"
        >
          {{ $t('common.retry') }}
        </el-button>
        
        <el-button
          v-if="status === 'success' && showViewTransaction"
          type="primary"
          @click="viewOnExplorer"
        >
          {{ $t('transaction.viewOnExplorer') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import {
  Check,
  Loading,
  ArrowDown,
  ArrowUp,
  InfoFilled,
  SuccessFilled,
  CircleCloseFilled,
  DocumentCopy,
  Link
} from '@element-plus/icons-vue'

import { useWalletStore } from '@/stores/wallet'

interface TransactionStep {
  label: string
  description?: string
}

interface TransactionDetail {
  label: string
  value: string
  highlight?: boolean
}

interface GasInfo {
  gasLimit: string
  gasPrice: string
  estimatedFee: string
  maxFee: string
}

interface Props {
  visible: boolean
  title?: string
  steps: TransactionStep[]
  currentStep: number
  status: 'pending' | 'loading' | 'success' | 'error'
  transactionDetails: TransactionDetail[]
  gasInfo?: GasInfo
  transactionHash?: string
  errorMessage?: string
  showViewTransaction?: boolean
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'close'): void
  (e: 'retry'): void
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  showViewTransaction: true
})

const emit = defineEmits<Emits>()

const { t } = useI18n()
const walletStore = useWalletStore()

const showGasDetails = ref(false)
const isMobile = ref(false)
const windowWidth = ref(window.innerWidth)

const updateWindowWidth = () => {
  windowWidth.value = window.innerWidth
  isMobile.value = windowWidth.value < 640
}

onMounted(() => {
  updateWindowWidth()
  window.addEventListener('resize', updateWindowWidth)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateWindowWidth)
})

const dialogWidth = computed(() => {
  return isMobile.value ? '95%' : '500px'
})

const modalTitle = computed(() => {
  return props.title || t('transaction.title')
})

const canClose = computed(() => {
  return props.status !== 'loading'
})

const currentStepMessage = computed(() => {
  const step = props.steps[props.currentStep]
  return step?.description || step?.label || ''
})

const handleClose = () => {
  emit('update:visible', false)
  emit('close')
}

const handleRetry = () => {
  emit('retry')
}

const copyTransactionHash = async () => {
  if (!props.transactionHash) return
  
  try {
    await navigator.clipboard.writeText(props.transactionHash)
    ElMessage.success(t('transaction.hashCopied'))
  } catch (error) {
    console.error('Failed to copy transaction hash:', error)
    ElMessage.error(t('transaction.copyFailed'))
  }
}

const viewOnExplorer = () => {
  if (!props.transactionHash) return
  
  const explorerUrl = walletStore.currentNetwork?.blockExplorer
  if (explorerUrl) {
    window.open(`${explorerUrl}/tx/${props.transactionHash}`, '_blank')
  }
}

// Auto-close on success after delay
watch(
  () => props.status,
  (newStatus) => {
    if (newStatus === 'success') {
      setTimeout(() => {
        if (props.visible) {
          handleClose()
        }
      }, 3000)
    }
  }
)
</script>

<style scoped>
.transaction-modal {
  @apply max-h-96 overflow-y-auto;
}

.steps-container {
  @apply relative;
}

.step-item {
  @apply flex flex-col items-center space-y-2 relative z-10;
  flex: 1;
}

.step-circle {
  @apply w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300;
}

.step-item.pending .step-circle {
  @apply bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400;
}

.step-item.active .step-circle {
  @apply bg-primary-500 text-white;
}

.step-item.completed .step-circle {
  @apply bg-green-500 text-white;
}

.step-label {
  @apply text-xs text-center text-gray-600 dark:text-gray-400 max-w-20;
}

.step-item.active .step-label {
  @apply text-primary-600 dark:text-primary-400 font-medium;
}

.step-item.completed .step-label {
  @apply text-green-600 dark:text-green-400;
}

.progress-line {
  @apply absolute top-4 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700 -z-10;
}

.progress-fill {
  @apply h-full bg-primary-500 transition-all duration-500 ease-out;
}

.detail-card {
  @apply p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700;
}

.detail-row {
  @apply flex items-center justify-between;
}

.detail-label {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.detail-value {
  @apply text-sm font-medium text-gray-900 dark:text-white text-right;
  max-width: 60%;
  word-break: break-word;
}

.status-message {
  @apply flex items-center space-x-3 p-3 rounded-lg;
}

.status-message.info {
  @apply bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300;
}

.status-message.loading {
  @apply bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300;
}

.status-message.success {
  @apply bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300;
}

.status-message.error {
  @apply bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300;
}

.error-message-container {
  @apply overflow-x-auto;
  max-width: calc(100% - 2rem);
  scrollbar-width: thin;
}

.error-message-container::-webkit-scrollbar {
  height: 4px;
}

.error-message-container::-webkit-scrollbar-track {
  @apply bg-transparent;
}

.error-message-container::-webkit-scrollbar-thumb {
  @apply bg-gray-300 dark:bg-gray-600 rounded-full;
}

.transaction-hash code {
  @apply font-mono;
}

:deep(.el-dialog__body) {
  @apply pt-4;
}

:deep(.el-dialog__footer) {
  @apply pt-4 border-t border-gray-200 dark:border-gray-700;
}

@media (max-width: 640px) {
  .transaction-modal {
    @apply max-h-[70vh];
  }
  
  .step-circle {
    @apply w-6 h-6;
  }
  
  .step-label {
    @apply text-xs max-w-16;
  }
  
  .detail-row {
    @apply flex-col items-start space-y-1;
  }
  
  .detail-value {
    @apply text-left max-w-full;
  }
  
  .status-message {
    @apply p-2;
  }
  
  :deep(.el-dialog__header) {
    @apply py-3 px-4;
  }
  
  :deep(.el-dialog__body) {
    @apply px-4 py-3;
  }
  
  :deep(.el-dialog__footer) {
    @apply py-3 px-4;
  }
  
  :deep(.el-button) {
    @apply text-sm py-1 px-2;
  }
}
</style>