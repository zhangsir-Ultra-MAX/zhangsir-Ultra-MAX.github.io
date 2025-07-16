<template>
  <div class="wrap">
    <!-- Header -->
    <div class="wrap-header">
      <div class="header-content">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
            {{ $t('wrap.title') }}
          </h1>
          <p class="text-gray-600 dark:text-gray-400 mt-2">
            {{ $t('wrap.subtitle') }}
          </p>
        </div>
        
        <div class="header-actions">
          <el-button @click="refreshData" :loading="loading">
            <el-icon class="mr-2">
              <Refresh />
            </el-icon>
            {{ $t('common.refresh') }}
          </el-button>
        </div>
      </div>
    </div>

    <div class="wrap-content">
      <!-- Balance Overview -->
      <div class="balance-overview">
        <h2 class="section-title">
          {{ $t('wrap.balanceOverview') }}
        </h2>
        
        <div class="balance-grid">
          <div class="balance-card">
            <div class="card-header">
              <h3 class="card-title">sRMB {{ $t('wrap.balance') }}</h3>
              <el-icon class="card-icon">
                <Coin />
              </el-icon>
            </div>
            <div class="card-value">
              {{ formatNumber(sRMBBalance) }} sRMB
            </div>
            <div class="card-subtitle">
              {{ $t('wrap.availableToWrap') }}
            </div>
          </div>

          <div class="balance-card">
            <div class="card-header">
              <h3 class="card-title">sWRMB {{ $t('wrap.balance') }}</h3>
              <el-icon class="card-icon">
                <Wallet />
              </el-icon>
            </div>
            <div class="card-value">
              {{ formatNumber(sWRMBBalance) }} sWRMB
            </div>
            <div class="card-subtitle">
              {{ $t('wrap.totalBalance') }}
            </div>
          </div>

          <div class="balance-card">
            <div class="card-header">
              <h3 class="card-title">{{ $t('wrap.totalReserveTransferred') }}</h3>
              <el-icon class="card-icon">
                <Coin />
              </el-icon>
            </div>
            <div class="card-value">
              {{ formatNumber(totalReserveTransferred) }} WRMB
            </div>
            <div class="card-subtitle">
              {{ $t('wrap.reserveTransferredDescription') }}
            </div>
          </div>

          <div class="balance-card">
            <div class="card-header">
              <h3 class="card-title">{{ $t('wrap.unwrappableAmount') }}</h3>
              <el-icon class="card-icon">
                <Switch />
              </el-icon>
            </div>
            <div class="card-value">
              {{ formatNumber(userUnwrappableAmount) }} sRMB
            </div>
            <div class="card-subtitle">
              {{ $t('wrap.availableToUnwrap') }}
            </div>
          </div>
        </div>
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
                  <span class="balance-info">
                    {{ $t('wrap.balance') }}: {{ formatNumber(sRMBBalance) }} sRMB
                  </span>
                </div>
                
                <div class="input-container">
                  <el-input
                    v-model="wrapAmount"
                    :placeholder="$t('wrap.enterAmount')"
                    size="large"
                    class="amount-input"
                    @input="handleWrapAmountChange"
                  />
                  <div class="token-selector">
                    <div class="token-info">
                      <div class="token-icon srmb">sRMB</div>
                      <span class="token-name">sRMB</span>
                    </div>
                  </div>
                </div>
                
                <div class="quick-amounts">
                  <el-button
                    v-for="percentage in [25, 50, 75, 100]"
                    :key="percentage"
                    size="small"
                    @click="setWrapPercentage(percentage)"
                  >
                    {{ percentage }}%
                  </el-button>
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
                  <span class="balance-info">
                    {{ $t('wrap.balance') }}: {{ formatNumber(sWRMBBalance) }} sWRMB
                  </span>
                </div>
                
                <div class="input-container">
                  <el-input
                    :value="wrapPreview?.outputAmount || '0'"
                    :placeholder="$t('wrap.estimatedAmount')"
                    size="large"
                    class="amount-input"
                    readonly
                  />
                  <div class="token-selector">
                    <div class="token-info">
                      <div class="token-icon swrmb">sWRMB</div>
                      <span class="token-name">sWRMB</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Transaction Details -->
            <div v-if="wrapPreview" class="transaction-details">
              <h4 class="details-title">{{ $t('wrap.transactionDetails') }}</h4>
              <div class="details-list">
                <div class="detail-row">
                  <span>{{ $t('wrap.exchangeRate') }}</span>
                  <span>1 sRMB = {{ formatNumber(wrapPreview.exchangeRate, 6) }} sWRMB</span>
                </div>
                <div class="detail-row">
                  <span>{{ $t('wrap.fee') }}</span>
                  <span class="fee-value">{{ formatNumber(wrapPreview.fee) }} sRMB ({{ formatNumber(wrapPreview.feePercentage) }}%)</span>
                </div>
                <div class="detail-row">
                  <span>{{ $t('wrap.minimumReceived') }}</span>
                  <span>{{ formatNumber(wrapPreview.minimumReceived) }} sWRMB</span>
                </div>
                <div class="detail-row">
                  <span>{{ $t('wrap.priceImpact') }}</span>
                  <span :class="getPriceImpactClass(parseFloat(wrapPreview.priceImpact))">
                    {{ formatNumber(wrapPreview.priceImpact) }}%
                  </span>
                </div>
              </div>
            </div>

            <el-button
              type="primary"
              size="large"
              :loading="wrapInProgress"
              :disabled="!isWrapValid || !walletStore.isConnected"
              @click="handleWrap"
              class="action-button"
            >
              {{ walletStore.isConnected ? $t('wrap.wrapTokens') : $t('wallet.connectWallet') }}
            </el-button>
          </div>

          <!-- Unwrap Form -->
          <div v-else class="unwrap-form">
            <div class="form-section">
              <div class="token-input">
                <div class="input-header">
                  <span class="input-label">{{ $t('wrap.desiredAmount') }}</span>
                  <span class="balance-info">
                    {{ $t('wrap.maxUnwrappableAmount') }}: {{ formatNumber(userMaxUnwrappableAmount) }} sRMB
                  </span>
                </div>
                
                <div class="input-container">
                  <el-input
                    v-model="unwrapAmount"
                    :placeholder="$t('wrap.enterDesiredAmount')"
                    size="large"
                    class="amount-input"
                    @input="handleUnwrapAmountChange"
                  />
                  <div class="token-selector">
                    <div class="token-info">
                      <div class="token-icon srmb">sRMB</div>
                      <span class="token-name">sRMB</span>
                    </div>
                  </div>
                </div>
                
                <div class="quick-amounts">
                  <el-button
                    v-for="percentage in [25, 50, 75, 100]"
                    :key="percentage"
                    size="small"
                    @click="setUnwrapPercentage(percentage)"
                  >
                    {{ percentage }}%
                  </el-button>
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
                  <span class="balance-info">
                    {{ $t('wrap.balance') }}: {{ formatNumber(sWRMBBalance) }} sWRMB
                  </span>
                </div>
                
                <div class="input-container">
                  <el-input
                    :value="unwrapPreview?.sWRMBBurned || '0'"
                    :placeholder="$t('wrap.estimatedBurn')"
                    size="large"
                    class="amount-input"
                    readonly
                  />
                  <div class="token-selector">
                    <div class="token-info">
                      <div class="token-icon swrmb">sWRMB</div>
                      <span class="token-name">sWRMB</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Transaction Details -->
            <div v-if="unwrapPreview" class="transaction-details">
              <h4 class="details-title">{{ $t('wrap.transactionDetails') }}</h4>
              <div class="details-list">
                <div class="detail-row">
                  <span>{{ $t('wrap.desiredAmount') }}</span>
                  <span>{{ formatNumber(unwrapAmount) }} sRMB</span>
                </div>
                <div class="detail-row">
                  <span>{{ $t('wrap.fee') }}</span>
                  <span class="fee-value">{{ formatNumber(unwrapPreview.fee) }} sRMB ({{ formatNumber(unwrapPreview.feePercentage) }}%)</span>
                </div>
                <div class="detail-row">
                  <span>{{ $t('wrap.actualReceived') }}</span>
                  <span>{{ formatNumber(unwrapPreview.sRMBReceived) }} sRMB</span>
                </div>
                <div class="detail-row">
                  <span>{{ $t('wrap.sWRMBRequired') }}</span>
                  <span>{{ formatNumber(unwrapPreview.sWRMBBurned) }} sWRMB</span>
                </div>
              </div>
            </div>

            <el-button
              type="primary"
              size="large"
              :loading="unwrapInProgress"
              :disabled="!isUnwrapValid || !walletStore.isConnected"
              @click="handleUnwrap"
              class="action-button"
            >
              {{ walletStore.isConnected ? $t('wrap.unwrapTokens') : $t('wallet.connectWallet') }}
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
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import {
  Refresh,
  Coin,
  Wallet,
  Switch,
  InfoFilled,
  QuestionFilled,
  WarningFilled
} from '@element-plus/icons-vue'
import { formatUnits, parseUnits } from 'ethers'

import TransactionModal from '@/components/common/TransactionModal.vue'
import { useWalletStore } from '@/stores/wallet'
import { contractService } from '@/services/contracts'
import { formatNumber } from '@/utils/format'
import { debounce } from '@/utils/debounce'

// Type definitions
interface WrapPreview {
  outputAmount: string
  fee: string
  feePercentage: string
  exchangeRate: string
  minimumReceived: string
  priceImpact: string
}

interface UnwrapPreview {
  sWRMBBurned: string
  sRMBReceived: string
  fee: string
  feePercentage: string
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
      { label: t('wrap.inputAmount'), value: `${wrapAmount.value} sRMB`, highlight: true },
      { label: t('wrap.outputAmount'), value: `${wrapPreview.value?.outputAmount || '0'} sWRMB` },
      { label: t('wrap.fee'), value: `${wrapPreview.value?.fee || '0'} sRMB` }
    )
  } else if (mode.value === 'unwrap' && unwrapAmount.value) {
    details.push(
      { label: t('wrap.inputAmount'), value: `${unwrapPreview.value?.sWRMBBurned || '0'} sWRMB`, highlight: true },
      { label: t('wrap.outputAmount'), value: `${unwrapPreview.value?.sRMBReceived || '0'} sRMB` },
      { label: t('wrap.fee'), value: `${unwrapPreview.value?.fee || '0'} sWRMB` }
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

// Real contract preview functions
const generateWrapPreview = async (amount: string): Promise<WrapPreview | null> => {
  try {
    const inputAmount = parseFloat(amount)
    if (!inputAmount || inputAmount <= 0) return null
    
    const wrapManager = contractService.getWrapManagerContract()
    if (!wrapManager) return null
    
    const amountWei = parseUnits(amount, 18)
    const [sWRMBReceived, wrmBMinted, fee] = await wrapManager.previewWrap(amountWei)
    
    const outputAmount = formatUnits(sWRMBReceived, 18)
    const feeAmount = formatUnits(fee, 18)
    const feePercentage = (parseFloat(feeAmount) / inputAmount * 100)
    const exchangeRate = parseFloat(outputAmount) / inputAmount
    const priceImpact = Math.abs((1 - exchangeRate) * 100)
    
    return {
      outputAmount: parseFloat(outputAmount).toFixed(6),
      fee: parseFloat(feeAmount).toFixed(6),
      feePercentage: feePercentage.toFixed(2),
      exchangeRate: exchangeRate.toFixed(6),
      minimumReceived: (parseFloat(outputAmount) * 0.995).toFixed(6), // 0.5% slippage
      priceImpact: priceImpact.toFixed(2)
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
    const [sRMBReceived, sWRMBBurned, fee, currentNAV] = await wrapManager.previewUnwrap(amountWei)
    
    const sWRMBBurnedAmount = formatUnits(sWRMBBurned, 18)
    const sRMBReceivedAmount = formatUnits(sRMBReceived, 18)
    const feeAmount = formatUnits(fee, 18)
    const feePercentage = (parseFloat(feeAmount) / inputAmount * 100)
    
    return {
      sWRMBBurned: parseFloat(sWRMBBurnedAmount).toFixed(6),
      sRMBReceived: parseFloat(sRMBReceivedAmount).toFixed(6),
      fee: parseFloat(feeAmount).toFixed(6),
      feePercentage: feePercentage.toFixed(2)
    }
  } catch (error) {
    console.error('Failed to generate unwrap preview:', error)
    return null
  }
}

// Debounced preview functions
const debouncedWrapPreview = debounce(async (amount: string) => {
  wrapPreview.value = await generateWrapPreview(amount)
}, 500)

const debouncedUnwrapPreview = debounce(async (amount: string) => {
  unwrapPreview.value = await generateUnwrapPreview(amount)
}, 500)

const handleWrapAmountChange = (value: string) => {
  debouncedWrapPreview(value)
}

const handleUnwrapAmountChange = (value: string) => {
  debouncedUnwrapPreview(value)
}

const handleModeChange = (newMode: 'wrap' | 'unwrap') => {
  mode.value = newMode
  // Clear amounts and previews when switching modes
  wrapAmount.value = ''
  unwrapAmount.value = ''
  wrapPreview.value = null
  unwrapPreview.value = null
}

const switchMode = () => {
  mode.value = mode.value === 'wrap' ? 'unwrap' : 'wrap'
  handleModeChange(mode.value)
}

const setWrapPercentage = (percentage: number) => {
  const amount = (parseFloat(sRMBBalance.value) * percentage / 100).toString()
  wrapAmount.value = amount
  handleWrapAmountChange(amount)
}

const setUnwrapPercentage = (percentage: number) => {
  const maxUnwrappable = parseFloat(userMaxUnwrappableAmount.value)
  const amount = (maxUnwrappable * percentage / 100).toString()
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
    const receipt = await wrapTx.wait()
    
    transactionHash.value = receipt.hash
    currentTransactionStep.value = 2
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
    const receipt = await unwrapTx.wait()
    
    transactionHash.value = receipt.hash
    currentTransactionStep.value = 2
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

onMounted(() => {
  // Initialize data on mount
  if (walletStore.isConnected) {
    refreshData()
  }
})
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
  @apply mx-auto px-6 py-8 space-y-8;
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

.input-container {
  @apply flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600;
}

.amount-input {
  @apply flex-1 bg-transparent border-none;
}

.token-selector {
  @apply flex items-center space-x-2;
}

.token-info {
  @apply flex items-center space-x-2;
}

.token-icon {
  @apply w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold;
  overflow: hidden;
}

.token-icon.srmb {
  @apply bg-gradient-to-br from-blue-500 to-blue-600;
}

.token-icon.swrmb {
  @apply bg-gradient-to-br from-purple-500 to-purple-600;
}

.token-name {
  @apply font-medium text-gray-900 dark:text-white;
}

.quick-amounts {
  @apply flex space-x-2;
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

.transaction-details {
  @apply bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-8;
}

.details-title {
  @apply text-lg font-semibold text-gray-900 dark:text-white mb-4;
}

.details-list {
  @apply space-y-3;
}

.detail-row {
  @apply flex items-center justify-between text-sm;
}

.fee-value {
  @apply text-yellow-600 dark:text-yellow-400 font-medium;
}

.action-button {
  @apply w-full;
}

.info-grid {
  @apply grid grid-cols-1 md:grid-cols-3 gap-6;
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

:deep(.el-segmented) {
  @apply bg-gray-100 dark:bg-gray-700;
}

:deep(.el-segmented__item) {
  @apply text-gray-600 dark:text-gray-400;
}

:deep(.el-segmented__item.is-selected) {
  @apply bg-primary-500 text-white;
}

:deep(.amount-input .el-input__wrapper) {
  @apply bg-transparent shadow-none;
}

:deep(.amount-input .el-input__inner) {
  @apply text-lg font-medium;
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