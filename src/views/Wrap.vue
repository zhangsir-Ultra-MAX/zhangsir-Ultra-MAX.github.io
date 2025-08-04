<template>
  <div class="wrap">
    <div class="wrap-content">
      <!-- Balance Overview -->
      <div class="balance-overview">
        <h2 class="section-title">
          {{ $t('wrap.title') }}
        </h2>
      </div>

      <!-- Wrap Interface -->
      <div class="wrap-interface">
        <div class="interface-card">
          <!-- Mode Toggle -->
          <div class="mode-toggle">
            <el-segmented
              v-model="mode"
              :options="modeOptions"
              size="large"
              @change="handleModeChange"
            />
          </div>

          <!-- Wrap Form -->
          <div v-if="mode === 'wrap'" class="wrap-form">
            <div class="form-section">
              <div class="token-input">
                <div class="input-header">
                  <span class="input-label">{{ $t('wrap.from') }}</span>
                </div>
                
                <div class="input-section">
                  <div class="input-group">
                    <el-input
                      v-model="wrapAmount"
                      :placeholder="formatNumberK(sRMBBalance) + '  ' + $t('available')"
                      size="large"
                      class="amount-input"
                      @input="handleWrapAmountChange"
                    >
                      <template #suffix>
                        <span class="input-suffix">sRMB</span>
                      </template>
                    </el-input>
                  </div>

                  <!-- Validation Error Message -->
                  <div v-if="wrapValidationError" class="validation-error">
                    <el-icon class="error-icon">
                      <WarningFilled />
                    </el-icon>
                    <span class="error-text">{{ wrapValidationError }}</span>
                  </div>
                  
                  <div class="quick-amounts">
                    <el-button
                      v-for="percentage in [25, 50, 75]"
                      :key="percentage"
                      size="small"
                      @click="setWrapPercentage(percentage)"
                    >
                      {{ percentage }}%
                    </el-button>
                    <el-button
                      class="max-button"
                      size="small"
                      @click="setWrapPercentage(100)"
                    >
                      Max
                    </el-button>
                  </div>
                </div>
              </div>

              <!-- Swap Arrow -->
              <div class="swap-arrow">
                <el-button
                  circle
                  @click="switchMode"
                  class="swap-button"
                >
                  <el-icon class="swap-icon">
                    <Switch />
                  </el-icon>
                </el-button>
              </div>

              <div class="token-input">
                <div class="input-header">
                  <span class="input-label">{{ $t('wrap.to') }}</span>
                </div>
                
                <div class="input-group">
                  <el-input
                    :value="wrapPreview?.outputAmount || '0'"
                    :placeholder="$t('wrap.estimatedAmount')"
                    size="large"
                    class="amount-input"
                    readonly
                  >
                    <template #suffix>
                      <span class="input-suffix">sWRMB</span>
                    </template>
                  </el-input>
                </div>
              </div>
            </div>

            <!-- Preview -->
            <div v-if="wrapPreview" class="preview-section">
              <h4 class="preview-title">{{ $t('wrap.preview') }}</h4>
              <div class="preview-details">
                <div class="preview-row">
                  <span>{{ $t('wrap.fee') }} ({{ formatNumber(wrapPreview.feePercentage) }}%)</span>
                  <span class="fee-value">{{ formatNumber(wrapPreview.fee) }} sRMB</span>
                </div>
                <div class="preview-row">
                  <span>{{ $t('wrap.minimumReceived') }}</span>
                  <span class="preview-value">{{ formatNumber(wrapPreview.minimumReceived) }} sWRMB</span>
                </div>
                <div class="preview-row exchange-rate">
                  <span>{{ $t('wrap.rate') }}</span>
                  <span class="preview-value">1 sRMB ≈ {{ formatNumber(wrapPreview.exchangeRate, 6) }} sWRMB</span>
                </div>
              </div>
            </div>

            <!-- 等待时间提示 -->
            <div v-if="wrapWaitTime > 0" class="countdown-notice">
              <el-icon class="countdown-icon">
                <Clock />
              </el-icon>
              <span class="countdown-text">
                {{ $t('wrap.availableAt') }}: {{ getExecutableTime(wrapWaitTime) }}
              </span>
            </div>

            <el-button
              type="primary"
              size="large"
              :loading="wrapInProgress"
              :disabled="!isWrapValid || !walletStore.isConnected || !canWrap"
              @click="handleWrap"
              class="action-button"
            >
              <template v-if="!walletStore.isConnected">
                {{ $t('wallet.connectWallet') }}
              </template>
              <template v-else-if="!canWrap">
                {{ $t('wrap.waitingForCooldown') }}
              </template>
              <template v-else>
                {{ $t('wrap.wrapTokens') }}
              </template>
            </el-button>
          </div>

          <!-- Unwrap Form -->
          <div v-else class="unwrap-form">
            <div class="form-section">
              <div class="token-input">
                <div class="input-header">
                  <span class="input-label">{{ $t('wrap.desiredAmount') }}</span>
                </div>
                
                <div class="input-section">
                  <div class="input-group">
                    <el-input
                      v-model="unwrapAmount"
                      :placeholder="formatNumberK(userMaxUnwrappableAmount) + '  ' + $t('available')"
                      size="large"
                      class="amount-input"
                      @input="handleUnwrapAmountChange"
                    >
                      <template #suffix>
                        <span class="input-suffix">sRMB</span>
                      </template>
                    </el-input>
                  </div>
                  
                  <!-- Validation Error Message -->
                  <div v-if="unwrapValidationError" class="validation-error">
                    <el-icon class="error-icon">
                      <WarningFilled />
                    </el-icon>
                    <span class="error-text">{{ unwrapValidationError }}</span>
                  </div>
                  
                  <div class="quick-amounts">
                    <el-button
                      v-for="percentage in [25, 50, 75]"
                      :key="percentage"
                      size="small"
                      @click="setUnwrapPercentage(percentage)"
                    >
                      {{ percentage }}%
                    </el-button>
                    <el-button
                      class="max-button"
                      size="small"
                      @click="setUnwrapPercentage(100)"
                    >
                      Max
                    </el-button>
                  </div>
                </div>
              </div>

              <!-- Swap Arrow -->
              <div class="swap-arrow">
                <el-button
                  circle
                  @click="switchMode"
                  class="swap-button"
                >
                  <el-icon class="swap-icon">
                    <Switch />
                  </el-icon>
                </el-button>
              </div>

              <div class="token-input">
                <div class="input-header">
                  <span class="input-label">{{ $t('wrap.requiredBurn') }}</span>
                </div>
                
                <div class="input-group">
                  <el-input
                    :value="unwrapPreview?.sWRMBBurned || '0'"
                    :placeholder="$t('wrap.estimatedBurn')"
                    size="large"
                    class="amount-input"
                    readonly
                  >
                    <template #suffix>
                      <span class="input-suffix">sWRMB</span>
                    </template>
                  </el-input>
                </div>
              </div>
            </div>

            <!-- Preview -->
            <div v-if="unwrapPreview" class="preview-section">
              <h4 class="preview-title">{{ $t('wrap.preview') }}</h4>
              <div class="preview-details">
                <div class="preview-row">
                  <span>{{ $t('savings.youWillReceive') }}</span>
                  <span class="preview-value">{{ formatNumber(unwrapAmount) }} sRMB</span>
                </div>
                <div class="preview-row">
                  <span>{{ $t('wrap.fee') }} ({{ formatNumber(unwrapPreview.feePercentage) }}%)</span>
                  <span class="fee-value">{{ formatNumber(unwrapPreview.fee) }} sRMB</span>
                </div>
                <div class="preview-row exchange-rate">
                  <span>{{ $t('wrap.rate') }}</span>
                  <span class="preview-value">1 sWRMB ≈ {{ formatNumber(unwrapPreview.exchangeRate, 6) }} sRMB</span>
                </div>
              </div>
            </div>

            <!-- 等待时间提示 -->
            <div v-if="unwrapWaitTime > 0" class="countdown-notice">
              <el-icon class="countdown-icon">
                <Clock />
              </el-icon>
              <span class="countdown-text">
                {{ $t('wrap.availableAt') }}: {{ getExecutableTime(unwrapWaitTime) }}
              </span>
            </div>

            <el-button
              type="primary"
              size="large"
              :loading="unwrapInProgress"
              :disabled="!isUnwrapValid || !walletStore.isConnected || !canUnwrap"
              @click="handleUnwrap"
              class="action-button"
            >
              <template v-if="!walletStore.isConnected">
                {{ $t('wallet.connectWallet') }}
              </template>
              <template v-else-if="!canUnwrap">
                {{ $t('wrap.waitingForCooldown') }}
              </template>
              <template v-else>
                {{ $t('wrap.unwrapTokens') }}
              </template>
            </el-button>
          </div>
        </div>
      </div>

      <!-- Information Cards -->
      <div class="info-section">
        <div class="info-grid">
          <div class="info-card">
            <div class="info-header">
              <el-icon class="info-icon">
                <InfoFilled />
              </el-icon>
              <h3 class="info-title">{{ $t('wrap.whatIsWrapping') }}</h3>
            </div>
            <p class="info-content">
              {{ $t('wrap.wrappingDescription') }}
            </p>
          </div>

          <div class="info-card">
            <div class="info-header">
              <el-icon class="info-icon">
                <QuestionFilled />
              </el-icon>
              <h3 class="info-title">{{ $t('wrap.fees') }}</h3>
            </div>
            <p class="info-content">
              {{ $t('wrap.feesDescription') }}
            </p>
          </div>

          <div class="info-card">
            <div class="info-header">
              <el-icon class="info-icon">
                <WarningFilled />
              </el-icon>
              <h3 class="info-title">{{ $t('wrap.risks') }}</h3>
            </div>
            <p class="info-content">
              {{ $t('wrap.risksDescription') }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Transaction Modal -->
    <TransactionModal
      v-model:visible="showTransactionModal"
      :title="transactionModalTitle"
      :steps="transactionSteps"
      :current-step="currentTransactionStep"
      :status="transactionStatus"
      :transaction-details="transactionDetails"
      :transaction-hash="transactionHash"
      :error-message="transactionError"
      @close="handleTransactionModalClose"
      @retry="handleTransactionRetry"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import {
  Refresh,
  Coin,
  Wallet,
  Switch,
  InfoFilled,
  QuestionFilled,
  WarningFilled,
  Clock
} from '@element-plus/icons-vue'
import { formatUnits, parseUnits } from 'ethers'

import TransactionModal from '@/components/common/TransactionModal.vue'
import { useWalletStore } from '@/stores/wallet'
import { contractService } from '@/services/contracts'
import { formatNumber, formatNumberK } from '@/utils/format'
import { debounce } from '@/utils/debounce'

// Type definitions
interface WrapPreview {
  outputAmount: string
  fee: string
  feePercentage: string
  exchangeRate: string
  minimumReceived: string
  waitTime: number
}

interface UnwrapPreview {
  sWRMBBurned: string
  sRMBReceived: string
  fee: string
  feePercentage: string
  exchangeRate: string
  waitTime: number
}

interface WrapConfig {
  minWrapAmount: string
  maxWrapAmount: string
  wrapFee: string
  minUnwrapAmount: string
  maxUnwrapAmount: string
  unwrapFee: string
}

interface UserWrapStats {
  totalWrapped: string
  availableToUnwrap: string
}

const { t } = useI18n()
const walletStore = useWalletStore()

const loading = ref(false)
const mode = ref<'wrap' | 'unwrap'>('wrap')
const wrapAmount = ref('')
const unwrapAmount = ref('')
const wrapPreview = ref<WrapPreview | null>(null)
const unwrapPreview = ref<UnwrapPreview | null>(null)
const wrapInProgress = ref(false)
const unwrapInProgress = ref(false)

// 等待时间相关状态
const wrapWaitTime = ref(0)
const unwrapWaitTime = ref(0)

// Real balances from contracts
const sRMBBalance = ref('0')
const sWRMBBalance = ref('0')
const wrapConfig = ref<WrapConfig | null>(null)
const userUnwrappableAmount = ref('0')
const userMaxUnwrappableAmount = ref('0')
const userWrapStats = ref<UserWrapStats | null>(null)
const totalReserveTransferred = ref('0')

// Transaction Modal
const showTransactionModal = ref(false)
const transactionModalTitle = ref('')
const currentTransactionStep = ref(0)
const transactionStatus = ref<'pending' | 'loading' | 'success' | 'error'>('pending')
const transactionHash = ref('')
const transactionError = ref('')
const gasInfo = ref(null)

const modeOptions = computed(() => [
  { label: t('wrap.wrap'), value: 'wrap' },
  { label: t('wrap.unwrap'), value: 'unwrap' }
])

const transactionSteps = ref([
  { label: t('transaction.approve'), description: t('transaction.approveDescription') },
  { label: t('transaction.confirm'), description: t('transaction.confirmDescription') },
  { label: t('transaction.complete'), description: t('transaction.completeDescription') }
])

const transactionDetails = computed(() => {
  const details = []
  
  if (mode.value === 'wrap' && wrapAmount.value) {
    details.push(
      { label: t('wrap.inputAmount'), value: `${formatNumber(wrapAmount.value, 2)} sRMB`, highlight: true },
      { label: t('wrap.outputAmount'), value: `${formatNumber(wrapPreview.value?.outputAmount || '0', 6)} sWRMB` },
      { label: t('wrap.fee'), value: `${formatNumber(wrapPreview.value?.fee || '0', 2)} sRMB` }
    )
  } else if (mode.value === 'unwrap' && unwrapAmount.value) {
    details.push(
      { label: t('wrap.inputAmount'), value: `${formatNumber(unwrapPreview.value?.sWRMBBurned || '0', 6)} sWRMB`, highlight: true },
      { label: t('wrap.outputAmount'), value: `${formatNumber(unwrapPreview.value?.sRMBReceived || '0', 2)} sRMB` },
      { label: t('wrap.fee'), value: `${formatNumber(unwrapPreview.value?.fee || '0', 1)} sRMB` }
    )
  }
  
  return details
})

const isWrapValid = computed(() => {
  const amount = parseFloat(wrapAmount.value)
  if (!amount || amount <= 0) return false
  if (amount > parseFloat(sRMBBalance.value)) return false
  
  // Check min/max amounts if config is loaded
  if (wrapConfig.value) {
    const minAmount = parseFloat(wrapConfig.value.minWrapAmount)
    const maxAmount = parseFloat(wrapConfig.value.maxWrapAmount)
    if (minAmount > 0 && amount < minAmount) return false
    if (maxAmount > 0 && amount > maxAmount) return false
  }
  
  return true
})

const wrapValidationError = computed(() => {
  if (!wrapAmount.value) return ''
  
  const amount = parseFloat(wrapAmount.value)
  if (!amount || amount <= 0) return t('wrap.invalidAmount')
  if (amount > parseFloat(sRMBBalance.value)) return t('wrap.insufficientBalance')
  
  // Check min/max amounts if config is loaded
  if (wrapConfig.value) {
    const minAmount = parseFloat(wrapConfig.value.minWrapAmount)
    const maxAmount = parseFloat(wrapConfig.value.maxWrapAmount)
    if (minAmount > 0 && amount < minAmount) return t('wrap.belowMinAmount', { min: formatNumber(minAmount) })
    if (maxAmount > 0 && amount > maxAmount) return t('wrap.aboveMaxAmount', { max: formatNumber(maxAmount) })
  }
  
  return ''
})

const isUnwrapValid = computed(() => {
  const amount = parseFloat(unwrapAmount.value)
  if (!amount || amount <= 0) return false
  
  // Check if user has enough wrapped amount to unwrap
  const unwrappableAmount = parseFloat(userMaxUnwrappableAmount.value)
  if (amount > unwrappableAmount) return false

  // Check min/max amounts if config is loaded
  if (wrapConfig.value) {
    const minAmount = parseFloat(wrapConfig.value.minUnwrapAmount)
    const maxAmount = parseFloat(wrapConfig.value.maxUnwrapAmount)
    if (minAmount > 0 && amount < minAmount) return false
    if (maxAmount > 0 && amount > maxAmount) return false
  }
  
  return true
})

const unwrapValidationError = computed(() => {
  if (!unwrapAmount.value) return ''
  
  const amount = parseFloat(unwrapAmount.value)
  if (!amount || amount <= 0) return t('wrap.invalidAmount')
  
  // Check if user has enough wrapped amount to unwrap
  const unwrappableAmount = parseFloat(userMaxUnwrappableAmount.value)
  if (amount > unwrappableAmount) return t('wrap.insufficientUnwrappableAmount')

  // Check min/max amounts if config is loaded
  if (wrapConfig.value) {
    const minAmount = parseFloat(wrapConfig.value.minUnwrapAmount)
    const maxAmount = parseFloat(wrapConfig.value.maxUnwrapAmount)
    if (minAmount > 0 && amount < minAmount) return t('wrap.belowMinUnwrapAmount', { min: formatNumber(minAmount) })
    if (maxAmount > 0 && amount > maxAmount) return t('wrap.aboveMaxUnwrapAmount', { max: formatNumber(maxAmount) })
  }
  
  return ''
})

// Real contract preview functions
const generateWrapPreview = async (amount: string): Promise<WrapPreview | null> => {
  try {
    const inputAmount = parseFloat(amount)
    if (!inputAmount || inputAmount <= 0) return null
    
    const wrapManager = contractService.getWrapManagerContract()
    if (!wrapManager) return null
    
    const amountWei = parseUnits(amount, 18)
    const [sWRMBReceived, wrmBMinted, fee, waitTime, currentNAV] = await wrapManager.previewWrap(walletStore.address, amountWei)
    
    const outputAmount = formatUnits(sWRMBReceived, 18)
    const feeAmount = formatUnits(fee, 18)
    const feePercentage = (parseFloat(feeAmount) / inputAmount * 100)
    const exchangeRate = parseFloat(outputAmount) / inputAmount
    
    // 处理等待时间
    const waitTimeSeconds = Number(waitTime)
    wrapWaitTime.value = waitTimeSeconds
    
    return {
      outputAmount: outputAmount,
      fee: feeAmount,
      feePercentage: feePercentage.toFixed(2),
      exchangeRate: exchangeRate.toFixed(6),
      minimumReceived: (parseFloat(outputAmount) * 0.995).toFixed(6), // 0.5% slippage
      waitTime: waitTimeSeconds
    }
  } catch (error) {
    console.error('Failed to generate wrap preview:', error)
    return null
  }
}

const generateUnwrapPreview = async (amount: string): Promise<UnwrapPreview | null> => {
  try {
    const inputAmount = parseFloat(amount)
    if (!inputAmount || inputAmount <= 0) return null
    
    const wrapManager = contractService.getWrapManagerContract()
    if (!wrapManager) return null
    
    // Now passing sRMB amount as input parameter
    const amountWei = parseUnits(amount, 18)
    const [sRMBReceived, sWRMBBurned, fee, waitTime, currentNAV] = await wrapManager.previewUnwrap(walletStore.address, amountWei)
    console.log(waitTime);
    const sWRMBBurnedAmount = formatUnits(sWRMBBurned, 18)
    const sRMBReceivedAmount = formatUnits(sRMBReceived, 18)
    const feeAmount = formatUnits(fee, 18)
    const feePercentage = (parseFloat(feeAmount) / inputAmount * 100)
    
    // 处理等待时间
    const waitTimeSeconds = Number(waitTime)
    unwrapWaitTime.value = waitTimeSeconds
    
    // 计算汇率：1 sWRMB = ? sRMB
    const exchangeRate = parseFloat(sWRMBBurnedAmount) > 0 ? inputAmount / parseFloat(sWRMBBurnedAmount) : 0
    
    return {
      sWRMBBurned: sWRMBBurnedAmount,
      sRMBReceived: sRMBReceivedAmount,
      fee: feeAmount,
      feePercentage: feePercentage.toFixed(2),
      exchangeRate: exchangeRate.toFixed(6),
      waitTime: waitTimeSeconds
    }
  } catch (error) {
    console.error('Failed to generate unwrap preview:', error)
    return null
  }
}

// 计算最终可执行时间
const getExecutableTime = (waitTimeSeconds: number): string => {
  if (waitTimeSeconds <= 0) return ''
  
  const now = new Date()
  const executableTime = new Date(now.getTime() + waitTimeSeconds * 1000)
  
  return executableTime.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

// 检查是否可以执行操作
const canWrap = computed(() => wrapWaitTime.value === 0)
const canUnwrap = computed(() => unwrapWaitTime.value === 0)

// Debounced preview functions
const debouncedWrapPreview = debounce(async (amount: string) => {
  wrapPreview.value = await generateWrapPreview(amount)
}, 500)

const debouncedUnwrapPreview = debounce(async (amount: string) => {
  unwrapPreview.value = await generateUnwrapPreview(amount)
}, 500)

const handleWrapAmountChange = (value: string) => {
  // 限制最大6位小数
  const cleanValue = value.replace(/[^0-9.]/g, '')
  const parts = cleanValue.split('.')
  if (parts.length > 2) {
    wrapAmount.value = parts[0] + '.' + parts.slice(1).join('')
    return
  }
  if (parts.length === 2 && parts[1].length > 6) {
    wrapAmount.value = parts[0] + '.' + parts[1].substring(0, 6)
    return
  }
  
  debouncedWrapPreview(value)
}

const handleUnwrapAmountChange = (value: string) => {
  // 限制最大6位小数
  const cleanValue = value.replace(/[^0-9.]/g, '')
  const parts = cleanValue.split('.')
  if (parts.length > 2) {
    unwrapAmount.value = parts[0] + '.' + parts.slice(1).join('')
    return
  }
  if (parts.length === 2 && parts[1].length > 6) {
    unwrapAmount.value = parts[0] + '.' + parts[1].substring(0, 6)
    return
  }
  
  debouncedUnwrapPreview(value)
}

const handleModeChange = (newMode: 'wrap' | 'unwrap') => {
  mode.value = newMode
  // Clear amounts and previews when switching modes
  wrapAmount.value = ''
  unwrapAmount.value = ''
  wrapPreview.value = null
  unwrapPreview.value = null
  
  // 清理等待时间状态
  wrapWaitTime.value = 0
  unwrapWaitTime.value = 0
}

const switchMode = () => {
  mode.value = mode.value === 'wrap' ? 'unwrap' : 'wrap'
  handleModeChange(mode.value)
}

const setWrapPercentage = (percentage: number) => {
  const amount = (parseFloat(sRMBBalance.value) * percentage / 100).toFixed(6)
  wrapAmount.value = amount
  handleWrapAmountChange(amount)
}

const setUnwrapPercentage = (percentage: number) => {
  const maxUnwrappable = parseFloat(userMaxUnwrappableAmount.value)
  const amount = (maxUnwrappable * percentage / 100).toFixed(6)
  unwrapAmount.value = amount
  handleUnwrapAmountChange(amount)
}

const getPriceImpactClass = (impact: number) => {
  if (impact < 1) return 'text-green-600 dark:text-green-400'
  if (impact < 3) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
}

const handleWrap = async () => {
  if (!isWrapValid.value || !walletStore.isConnected) return
  
  transactionModalTitle.value = t('wrap.wrapTransaction')
  showTransactionModal.value = true
  currentTransactionStep.value = 0
  transactionStatus.value = 'pending'
  wrapInProgress.value = true
  
  try {
    const amountWei = parseUnits(wrapAmount.value, 18)
    
    // Step 1: Check and approve sRMB if needed
    const sRMBContract = contractService.getSRMBContract(true)
    const wrapManagerAddress = contractService.getAddresses().WRAP_MANAGER
    
    if (!sRMBContract || !wrapManagerAddress) {
      throw new Error('Contract not available')
    }
    
    const allowance = await sRMBContract.allowance(walletStore.address, wrapManagerAddress)
    
    if (allowance < amountWei) {
      transactionStatus.value = 'loading'
      const approveTx = await sRMBContract.approve(wrapManagerAddress, amountWei)
      await approveTx.wait()
    }
    
    currentTransactionStep.value = 1
    
    // Step 2: Execute wrap
    const wrapManager = contractService.getWrapManagerContract(true)
    if (!wrapManager) {
      throw new Error('Wrap manager contract not available')
    }
    
    transactionStatus.value = 'loading'
    const wrapTx = await wrapManager.wrap(amountWei)
    currentTransactionStep.value = 2
    const receipt = await wrapTx.wait()
    
    transactionHash.value = receipt.hash
    currentTransactionStep.value = 3
    transactionStatus.value = 'success'
    
    // Reset form and refresh balances
    wrapAmount.value = ''
    wrapPreview.value = null
    await Promise.all([loadBalances(), loadUserWrapStats()])
    
    ElMessage.success(t('wrap.wrapSuccess'))
  } catch (error: any) {
    transactionStatus.value = 'error'
    transactionError.value = error.message || t('wrap.wrapFailed')
    console.error('Wrap failed:', error)
  } finally {
    wrapInProgress.value = false
  }
}

const handleUnwrap = async () => {
  if (!isUnwrapValid.value || !walletStore.isConnected) return
  
  // Additional runtime check for unwrappable amount
  const amount = parseFloat(unwrapAmount.value)
  const unwrappableAmount = parseFloat(userMaxUnwrappableAmount.value)
  if (amount > unwrappableAmount) {
    ElMessage.error(t('wrap.insufficientUnwrappableAmount'))
    return
  }
  
  transactionModalTitle.value = t('wrap.unwrapTransaction')
  showTransactionModal.value = true
  currentTransactionStep.value = 0
  transactionStatus.value = 'pending'
  unwrapInProgress.value = true
  
  try {
    const sRMBAmountWei = parseUnits(unwrapAmount.value, 18)
    
    // Get required sWRMB amount from preview
    if (!unwrapPreview.value) {
      throw new Error('Unable to calculate required sWRMB amount')
    }
    
    const sWRMBRequiredWei = parseUnits(unwrapPreview.value.sWRMBBurned, 18)
    
    // Step 1: Check and approve sWRMB if needed
    const savingsVault = contractService.getSavingsVaultContract(true)
    const wrapManagerAddress = contractService.getAddresses().WRAP_MANAGER
    
    if (!savingsVault || !wrapManagerAddress) {
      throw new Error('Contract not available')
    }
    
    const allowance = await savingsVault.allowance(walletStore.address, wrapManagerAddress)
    
    if (allowance < sWRMBRequiredWei) {
      transactionStatus.value = 'loading'
      const approveTx = await savingsVault.approve(wrapManagerAddress, sWRMBRequiredWei)
      await approveTx.wait()
    }
    
    currentTransactionStep.value = 1
    
    // Step 2: Execute unwrap with sRMB amount
    const wrapManager = contractService.getWrapManagerContract(true)
    if (!wrapManager) {
      throw new Error('Wrap manager contract not available')
    }
    
    transactionStatus.value = 'loading'
    const unwrapTx = await wrapManager.unwrap(sRMBAmountWei)
    currentTransactionStep.value = 2
    const receipt = await unwrapTx.wait()
    
    transactionHash.value = receipt.hash
    currentTransactionStep.value = 3
    transactionStatus.value = 'success'
    
    // Reset form and refresh balances
    unwrapAmount.value = ''
    unwrapPreview.value = null
    await Promise.all([loadBalances(), loadUserWrapStats(), loadTotalReserveTransferred()])
    
    ElMessage.success(t('wrap.unwrapSuccess'))
  } catch (error: any) {
    transactionStatus.value = 'error'
    transactionError.value = error.message || t('wrap.unwrapFailed')
    console.error('Unwrap failed:', error)
  } finally {
    unwrapInProgress.value = false
  }
}

const handleTransactionModalClose = () => {
  showTransactionModal.value = false
  transactionHash.value = ''
  transactionError.value = ''
}

const handleTransactionRetry = () => {
  if (mode.value === 'wrap') {
    handleWrap()
  } else {
    handleUnwrap()
  }
}

// Load user wrap statistics
const loadUserWrapStats = async () => {
  if (!walletStore.isConnected || !walletStore.address) {
    userMaxUnwrappableAmount.value = '0'
    userWrapStats.value = null
    return
  }
  
  try {
    const wrapManager = contractService.getWrapManagerContract()
    if (!wrapManager) return
    
    const [wrappedAmount, availableToUnwrap, userMaxUnwrappedAmount] = await wrapManager.getUserWrapStats(walletStore.address)
    
    userUnwrappableAmount.value = formatUnits(availableToUnwrap, 18)
    userMaxUnwrappableAmount.value = formatUnits(userMaxUnwrappedAmount, 18)
    userWrapStats.value = {
      totalWrapped: formatUnits(wrappedAmount, 18),
      availableToUnwrap: formatUnits(availableToUnwrap, 18)
    }
  } catch (error) {
    console.error('Failed to load user wrap stats:', error)
    userMaxUnwrappableAmount.value = '0'
    userWrapStats.value = null
  }
}

// Load balances from contracts
const loadBalances = async () => {
  if (!walletStore.isConnected || !walletStore.address) {
    sRMBBalance.value = '0'
    sWRMBBalance.value = '0'
    return
  }
  
  try {
    const [sRMBContract, savingsVault] = await Promise.all([
      contractService.getSRMBContract(),
      contractService.getSavingsVaultContract()
    ])
    
    if (sRMBContract && savingsVault) {
      const [sRMBBal, sWRMBBal] = await Promise.all([
        sRMBContract.balanceOf(walletStore.address),
        savingsVault.balanceOf(walletStore.address)
      ])
      
      sRMBBalance.value = formatUnits(sRMBBal, 18)
      sWRMBBalance.value = formatUnits(sWRMBBal, 18)
    }
  } catch (error) {
    console.error('Failed to load balances:', error)
    sRMBBalance.value = '0'
    sWRMBBalance.value = '0'
  }
}

// Load wrap configuration
const loadWrapConfig = async () => {
  try {
    const wrapManager = contractService.getWrapManagerContract()
    if (!wrapManager) return
    
    const config = await wrapManager.getConfiguration()

    wrapConfig.value = {
      minWrapAmount: formatUnits(config[3], 18),
      maxWrapAmount: formatUnits(config[4], 18),
      wrapFee: formatUnits(config[5], 18),
      minUnwrapAmount: formatUnits(config[6], 18),
      maxUnwrapAmount: formatUnits(config[7], 18),
      unwrapFee: formatUnits(config[8], 18)
    }
  } catch (error) {
    console.error('Failed to load wrap config:', error)
  }
}

// Load total reserve transferred
const loadTotalReserveTransferred = async () => {
  try {
    const wrapManager = contractService.getWrapManagerContract()
    if (!wrapManager) return
    
    const totalReserve = await wrapManager.totalReserveTransferred()
    totalReserveTransferred.value = formatUnits(totalReserve, 18)
  } catch (error) {
    console.error('Failed to load total reserve transferred:', error)
    totalReserveTransferred.value = '0'
  }
}

const refreshData = async () => {
  loading.value = true
  try {
    await Promise.all([
      loadBalances(),
      loadWrapConfig(),
      loadUserWrapStats(),
      loadTotalReserveTransferred()
    ])
  } catch (error) {
    console.error('Failed to refresh data:', error)
  } finally {
    loading.value = false
  }
}

// Watch for wallet connection changes
watch(() => walletStore.isConnected, (connected) => {
  if (connected) {
    refreshData()
  } else {
    sRMBBalance.value = '0'
    sWRMBBalance.value = '0'
    wrapConfig.value = null
    userMaxUnwrappableAmount.value = '0'
    userWrapStats.value = null
    totalReserveTransferred.value = '0'
    wrapPreview.value = null
    unwrapPreview.value = null
  }
})

watch(() => walletStore.address, () => {
  if (walletStore.isConnected) {
    refreshData()
  }
})

// Watch for chainId changes
watch(()=>walletStore.chainId, (chainId) => {
  if (chainId) {
    refreshData()
  }
})

// Watch for mode changes to reset input fields
watch(mode, () => {
  wrapAmount.value = ''
  unwrapAmount.value = ''
  wrapPreview.value = null
  unwrapPreview.value = null
  wrapWaitTime.value = 0
  unwrapWaitTime.value = 0
})

onMounted(() => {
  // Initialize data on mount
  if (walletStore.isConnected) {
    refreshData()
  }
})

// onUnmounted钩子已移除，因为不再需要清理定时器
</script>

<style scoped>
.wrap {
  @apply bg-gray-50 dark:bg-gray-900;
}

.wrap-header {
  @apply bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-8;
}

.header-content {
  @apply max-w-7xl mx-auto flex items-center justify-between;
}

.header-actions {
  @apply flex items-center space-x-4;
}

.wrap-content {
  @apply max-w-xl mx-auto px-6 py-8 space-y-8;
}

.section-title {
  @apply text-2xl font-bold text-gray-900 dark:text-white mb-6;
}

.balance-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6;
}

.balance-card {
  @apply bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6;
}

.card-header {
  @apply flex items-center justify-between mb-4;
}

.card-title {
  @apply text-sm font-medium text-gray-600 dark:text-gray-400;
}

.card-icon {
  @apply text-xl text-gray-400;
}

.card-value {
  @apply text-2xl font-bold text-gray-900 dark:text-white;
}

.card-subtitle {
  @apply text-sm text-gray-500 dark:text-gray-400 mt-1;
}

.interface-card {
  @apply bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8;
}

.mode-toggle {
  @apply flex justify-center mb-8;
}

.form-section {
  @apply space-y-6 mb-8;
}

.token-input {
  @apply space-y-3;
}

.input-header {
  @apply flex items-center justify-between;
}

.input-label {
  @apply text-sm font-medium text-gray-700 dark:text-gray-300;
}

.balance-info {
  @apply text-sm text-gray-500 dark:text-gray-400;
}

.input-section {
  @apply space-y-4 mb-6;
}

.input-group {
  @apply flex items-center space-x-3;
}

.amount-input {
  @apply flex-1;
}

.input-suffix {
  @apply text-gray-500 dark:text-gray-400 font-medium;
}

.quick-amounts {
  @apply flex space-x-2;
}

.max-button {
  @apply text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300;
}

.swap-arrow {
  @apply flex justify-center;
}

.swap-button {
  @apply bg-primary-50 dark:bg-primary-900 border-primary-200 dark:border-primary-700 hover:bg-primary-100 dark:hover:bg-primary-800;
}

.swap-icon {
  @apply text-primary-600 dark:text-primary-400 transition-transform duration-200;
}

.swap-button:hover .swap-icon {
  @apply rotate-180;
}

.preview-section {
  @apply bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6;
}

.preview-title {
  @apply text-sm font-medium text-gray-700 dark:text-gray-300 mb-3;
}

.preview-details {
  @apply space-y-2;
}

.preview-row {
  @apply flex items-center justify-between text-sm;
}

.preview-row span:first-child {
  @apply text-gray-600 dark:text-gray-400;
}

.preview-row.exchange-rate {
  @apply border-t border-gray-200 dark:border-gray-600 pt-2 mt-2;
}

.preview-row.exchange-rate .preview-value {
  @apply text-primary-400 dark:text-primary-300 font-semibold;
}

.preview-value {
  @apply font-medium text-gray-600 dark:text-white;
}

.fee-value {
  @apply text-yellow-600 dark:text-yellow-400 font-medium;
}

.action-button {
  @apply w-full;
}

.info-grid {
  @apply grid grid-cols-1 gap-6;
}

.info-card {
  @apply bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6;
}

.info-header {
  @apply flex items-center space-x-3 mb-4;
}

.info-icon {
  @apply text-2xl text-primary-500;
}

.info-title {
  @apply text-lg font-semibold text-gray-900 dark:text-white;
}

.info-content {
  @apply text-gray-600 dark:text-gray-400 text-sm leading-relaxed;
}

.validation-error {
  @apply flex items-center space-x-2 mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg;
}

.error-icon {
  @apply text-red-500 dark:text-red-400 text-sm;
}

.error-text {
  @apply text-red-600 dark:text-red-400 text-sm font-medium;
}

.countdown-notice {
  @apply flex items-center justify-center space-x-2 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg mb-4;
}

.countdown-icon {
  @apply text-blue-500 dark:text-blue-400 text-lg;
}

.countdown-text {
  @apply text-blue-700 dark:text-blue-300 font-medium;
}

:deep(.el-segmented) {
  @apply bg-gray-100 dark:bg-gray-700;
}

:deep(.el-segmented__item) {
  @apply text-gray-600 dark:text-gray-400;
}

:deep(.el-segmented__item.is-selected) {
  @apply bg-primary-500 text-white;
}

@media (max-width: 768px) {
  .wrap-header {
    @apply px-4 py-6;
  }
  
  .header-content {
    @apply flex-col items-start space-y-4;
  }
  
  .wrap-content {
    @apply px-4 py-6;
  }
  
  .balance-grid {
    @apply grid-cols-1 gap-4;
  }
  
  .interface-card {
    @apply p-6;
  }
  
  .info-grid {
    @apply grid-cols-1 gap-4;
  }
}
</style>