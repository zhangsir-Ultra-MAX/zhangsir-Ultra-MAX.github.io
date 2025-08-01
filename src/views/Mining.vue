<template>
  <div class="mining">
    <div class="mining-content">
      <!-- Mining Overview -->
      <div class="mining-overview">
        <h2 class="section-title">
          {{ $t('mining.overview') }}
        </h2>

        <div class="overview-grid">
          <!-- Your CINA Mined -->
          <div class="overview-card">
            <div class="card-header">
              <h3 class="card-title">{{ $t('mining.yourMined') }}</h3>
              <el-icon class="card-icon">
                <Coin />
              </el-icon>
            </div>
            <div class="card-value">
              <div class="value-content">
                <AnimatedNumber 
                  :value="miningStore.totalCINAMined" 
                  :decimals="4"
                  :auto-increment="walletStore.isConnected && parseFloat(miningStore.totalCINAMined) > 0"
                  :increment-amount="parseFloat(miningStore.miningRate)"
                  :increment-interval="1000"
                  :cache-key="`totalCINAMined_${walletStore.address}`"
                  :use-cache="false"
                />
                <span class="token-symbol">CINA</span>
              </div>
              <el-button 
                type="primary" 
                size="small" 
                :loading="miningStore.claimInProgress"
                :disabled="!isClaimValid" 
                @click="handleClaim" 
                class="claim-button-corner"
              >
                {{ $t('mining.claim') }}
              </el-button>
            </div>
            <div class="card-subtitle">
              {{ $t('mining.apy') }}: {{ formatNumber(miningStore.miningAPY) }}%
            </div>
          </div>
        </div>
      </div>

      <!-- Mining Actions -->
      <div class="action-section">
        <el-tabs v-model="activeTab" class="mining-tabs">
          <!-- Deposit Token Tab -->
          <el-tab-pane :label="$t('mining.deposit')" name="deposit">
            <div class="tab-content">
              <div class="action-form">
                <div class="input-section">
                  <div class="input-group">
                    <div class="input-with-select">
                      <el-input 
                        v-model="depositAmount" 
                        :placeholder="$t('mining.enterAmount')" 
                        size="large"
                        class="amount-input" 
                        @input="handleDepositAmountChange"
                      />
                      <el-select v-model="depositToken" class="token-select" size="large" value-key="symbol">
                        <el-option v-for="token in availableTokens" :key="token.symbol"
                          :label="token.symbol" :value="token">
                          <div class="token-option">
                            <span>{{ token.symbol }}</span>
                          </div>
                        </el-option>
                      </el-select>
                    </div>
                  </div>
                  
                  <!-- Quick Amount Buttons -->
                  <div class="quick-amounts">
                    <el-button 
                      v-for="percentage in [25, 50, 75]" 
                      :key="percentage" 
                      size="small"
                      @click="setDepositPercentage(percentage)"
                    >
                      {{ percentage }}%
                    </el-button>
                    <el-button @click="setMaxDeposit" class="max-button" size="small">
                      {{ $t('common.max') }}
                    </el-button>
                  </div>

                  <!-- Balance Display -->
                  <div class="balance-info">
                    <span class="balance-label">{{ $t('common.balance') }}:</span>
                    <span class="balance-value">{{ formatNumber(miningStore.usdtBalance) }} {{ depositToken?.symbol }}</span>
                  </div>
                </div>

                <!-- Mining Preview -->
                <div v-if="depositPreview" class="preview-section">
                  <h4 class="preview-title">{{ $t('mining.preview') }}</h4>
                  <div class="preview-details">
                    <div class="preview-row">
                      <span>{{ $t('mining.estimatedCINA') }}</span>
                      <span class="preview-value">{{ formatNumber(depositPreview.estimatedCINA, 4) }} CINA</span>
                    </div>
                    <div class="preview-row">
                      <span>{{ $t('mining.dailyReward') }}</span>
                      <span class="preview-value">{{ formatNumber(depositPreview.dailyReward, 4) }} CINA/day</span>
                    </div>
                    <div class="preview-row exchange-rate">
                      <span>{{ $t('mining.exchangeRate') }}</span>
                      <span class="preview-value">1 {{ depositToken?.symbol }} ≈ {{ formatNumber(depositPreview.exchangeRate, 4) }} CINA</span>
                    </div>
                  </div>
                </div>

                <el-button 
                  type="primary" 
                  size="large" 
                  :loading="miningStore.depositInProgress"
                  :disabled="!isDepositValid" 
                  @click="handleDeposit" 
                  class="action-button"
                >
                  {{ $t('mining.deposit') }}
                </el-button>
              </div>
            </div>
          </el-tab-pane>

          <!-- Withdraw Token Tab -->
          <el-tab-pane :label="$t('mining.withdraw')" name="withdraw">
            <div class="tab-content">
              <div class="action-form">
                <div class="input-section">
                  <div class="input-group">
                    <div class="input-with-select">
                      <el-input 
                        v-model="withdrawAmount" 
                        :placeholder="$t('mining.enterAmount')" 
                        size="large"
                        class="amount-input" 
                        @input="handleWithdrawAmountChange"
                      />
                      <el-select v-model="withdrawToken" class="token-select" size="large" value-key="symbol">
                        <el-option v-for="token in availableTokens" :key="token.symbol"
                          :label="token.symbol" :value="token">
                          <div class="token-option">
                            <span>{{ token.symbol }}</span>
                          </div>
                        </el-option>
                      </el-select>
                    </div>
                  </div>
                  
                  <!-- Quick Amount Buttons -->
                  <div class="quick-amounts">
                    <el-button 
                      v-for="percentage in [25, 50, 75]" 
                      :key="percentage" 
                      size="small"
                      @click="setWithdrawPercentage(percentage)"
                    >
                      {{ percentage }}%
                    </el-button>
                    <el-button @click="setMaxWithdraw" class="max-button" size="small">
                      {{ $t('common.max') }}
                    </el-button>
                  </div>

                  <!-- Claim CINA -->
                  <div class="input-group">
                    <el-checkbox v-model="withdrawCINA" class="withdraw-cina-checkbox">
                      {{ $t('mining.withdrawCINA') }}
                    </el-checkbox>
                  </div>

                  <!-- Deposited Balance Display -->
                  <div class="balance-info">
                    <span class="balance-label">{{ $t('common.balance') }}:</span>
                    <span class="balance-value">{{ formatNumber(miningStore.depositedAmount) }} {{ withdrawToken?.symbol }}</span>
                  </div>

                  <!-- Withdraw Fee Warning -->
                  <div v-if="withdrawPreview && withdrawPreview.fee > 0" class="warning-info">
                    <el-icon><Warning /></el-icon>
                    <span>{{ $t('mining.withdrawFeeWarning', { fee: formatNumber(withdrawPreview.fee * 100, 2) }) }}</span>
                  </div>
                </div>

                <!-- Withdraw Preview -->
                <div v-if="withdrawPreview" class="preview-section">
                  <h4 class="preview-title">{{ $t('mining.preview') }}</h4>
                  <div class="preview-details">
                    <div class="preview-row">
                      <span>{{ $t('mining.youWillReceive') }}</span>
                      <span class="preview-value">{{ formatNumber(withdrawPreview.netAmount, 4) }} {{ withdrawToken?.symbol }}</span>
                    </div>
                    <div v-if="withdrawPreview.fee > 0" class="preview-row fee">
                      <span>{{ $t('mining.withdrawFee') }}</span>
                      <span class="preview-value fee-amount">-{{ formatNumber(withdrawPreview.feeAmount, 4) }} {{ withdrawToken?.symbol }}</span>
                    </div>
                    <div class="preview-row">
                      <span>{{ $t('mining.remainingDeposited') }}</span>
                      <span class="preview-value">{{ formatNumber(withdrawPreview.remainingAmount, 4) }} {{ withdrawToken?.symbol }}</span>
                    </div>
                  </div>
                </div>

                <el-button 
                  type="primary" 
                  size="large" 
                  :loading="miningStore.withdrawInProgress"
                  :disabled="!isWithdrawValid" 
                  @click="handleWithdraw" 
                  class="action-button"
                >
                  {{ $t('mining.withdraw') }}
                </el-button>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import {
  Coin,
  Warning
} from '@element-plus/icons-vue'

import AnimatedNumber from '@/components/common/AnimatedNumber.vue'
import { useWalletStore } from '@/stores/wallet'
import { useMiningStore } from '@/stores/mining'
import { formatNumber } from '@/utils/format'
import { TOKENS } from '@/constants'

// Define types
interface Token {
  symbol: string
  name: string
  address: string
  decimals: number
}

interface DepositPreview {
  estimatedCINA: number
  dailyReward: number
  exchangeRate: number
}

interface WithdrawPreview {
  netAmount: number
  feeAmount: number
  fee: number
  remainingAmount: number
}

const { t } = useI18n()
const walletStore = useWalletStore()
const miningStore = useMiningStore()

// Available tokens for mining
const availableTokens = computed<Token[]>(() => {
  const chainId = walletStore.chainId || 11155111
  
  return [
    {
      symbol: TOKENS.USDC.symbol,
      name: TOKENS.USDC.name,
      address: TOKENS.USDC.addresses[chainId as keyof typeof TOKENS.USDC.addresses] || TOKENS.USDC.addresses[11155111] || '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
      decimals: TOKENS.USDC.decimals
    },
    {
      symbol: TOKENS.USDT.symbol,
      name: TOKENS.USDT.name,
      address: TOKENS.USDT.addresses[chainId as keyof typeof TOKENS.USDT.addresses] || TOKENS.USDT.addresses[11155111] || '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
      decimals: TOKENS.USDT.decimals
    }
  ]
})

const activeTab = ref('deposit')
const depositAmount = ref('')
const withdrawAmount = ref('')
const withdrawCINA = ref(false) // 是否同时提取CINA的开关
const depositToken = ref<Token>()
const withdrawToken = ref<Token>()

// Initialize tokens
watch(availableTokens, (tokens) => {
  if (tokens.length >= 1) {
    if (!depositToken.value || depositToken.value.symbol !== tokens[0].symbol) {
      depositToken.value = tokens[0]
    }
    if (!withdrawToken.value || withdrawToken.value.symbol !== tokens[0].symbol) {
      withdrawToken.value = tokens[0]
    }
  }
}, { immediate: true })

// Computed properties
const isDepositValid = computed(() => {
  const amount = parseFloat(depositAmount.value)
  return amount > 0 && amount <= parseFloat(miningStore.usdtBalance)
})

const isClaimValid = computed(() => {
  return parseFloat(miningStore.pendingCINA) > 0
})

const isWithdrawValid = computed(() => {
  const amount = parseFloat(withdrawAmount.value)
  return amount > 0 && amount <= parseFloat(miningStore.depositedAmount)
})

const depositPreview = computed(() => {
  const amount = parseFloat(depositAmount.value)
  if (!amount || amount <= 0) return null
  
  const exchangeRate = parseFloat(miningStore.exchangeRate)
  const estimatedCINA = amount * exchangeRate
  const dailyReward = estimatedCINA * parseFloat(miningStore.miningAPY) / 365 / 100
  
  return {
    estimatedCINA,
    dailyReward,
    exchangeRate
  }
})

const withdrawPreview = computed(() => {
  const amount = parseFloat(withdrawAmount.value)
  if (!amount || amount <= 0) return null
  
  const fee = parseFloat(miningStore.withdrawalFee || '0.02') // 2% default fee
  const feeAmount = amount * fee
  const netAmount = amount - feeAmount
  const remainingAmount = parseFloat(miningStore.depositedAmount) - amount
  
  return {
    netAmount,
    feeAmount,
    fee,
    remainingAmount
  }
})

// Methods
const handleDepositAmountChange = (value: string) => {
  // Remove non-numeric characters except decimal point
  const cleanValue = value.replace(/[^0-9.]/g, '')
  depositAmount.value = cleanValue
}

const setDepositPercentage = (percentage: number) => {
  const balance = parseFloat(miningStore.usdtBalance)
  const amount = (balance * percentage / 100).toFixed(6)
  depositAmount.value = amount
}

const setMaxDeposit = () => {
  depositAmount.value = miningStore.usdtBalance
}

const handleDeposit = async () => {
  try {
    const amount = parseFloat(depositAmount.value)
    await miningStore.depositUSDT(amount)
    ElMessage.success(t('mining.depositSuccess'))
    depositAmount.value = ''
  } catch (error) {
    console.error('Deposit failed:', error)
    ElMessage.error(t('mining.depositFailed'))
  }
}

const handleClaim = async () => {
  try {
    await miningStore.claimCINA()
    ElMessage.success(t('mining.claimSuccess'))
  } catch (error) {
    console.error('Claim failed:', error)
    ElMessage.error(t('mining.claimFailed'))
  }
}

const handleWithdrawAmountChange = (value: string) => {
  // Remove non-numeric characters except decimal point
  const cleanValue = value.replace(/[^0-9.]/g, '')
  withdrawAmount.value = cleanValue
}

const setWithdrawPercentage = (percentage: number) => {
  const balance = parseFloat(miningStore.depositedAmount)
  const amount = (balance * percentage / 100).toFixed(6)
  withdrawAmount.value = amount
}

const setMaxWithdraw = () => {
  withdrawAmount.value = miningStore.depositedAmount
}

const handleWithdraw = async () => {
  try {
    const amount = parseFloat(withdrawAmount.value)
    
    // 如果选择了同时提取CINA，先执行CINA提取
    if (withdrawCINA.value && parseFloat(miningStore.pendingCINA) > 0) {
      await miningStore.claimCINA()
    }
    
    // 执行USDT提现
    await miningStore.withdrawUSDT(amount)
    
    ElMessage.success(t('mining.withdrawSuccess'))
    withdrawAmount.value = ''
    withdrawCINA.value = false // 重置开关状态
  } catch (error) {
    console.error('Withdraw failed:', error)
    ElMessage.error(t('mining.withdrawFailed'))
  }
}

// Lifecycle
onMounted(async () => {
  if (walletStore.isConnected) {
    await miningStore.fetchMiningData()
  }
})

// Watch for wallet connection changes
watch(
  () => walletStore.isConnected,
  async (connected) => {
    if (connected) {
      await miningStore.fetchMiningData()
    }
  }
)
</script>

<style scoped>
.mining {
  @apply min-h-screen bg-gray-50 dark:bg-gray-900;
}

.mining-content {
  @apply max-w-6xl mx-auto px-6 py-8;
}

.section-title {
  @apply text-2xl font-bold text-gray-900 dark:text-white mb-6;
}

.overview-grid {
  @apply grid grid-cols-1 md:grid-cols-3 gap-6 mb-8;
}

.overview-card {
  @apply bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700;
}

.card-header {
  @apply flex items-center justify-between mb-4;
}

.card-title {
  @apply text-sm font-medium text-gray-600 dark:text-gray-400;
}

.card-icon {
  @apply text-xl text-primary-500;
}

.card-value {
  @apply text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2;
}

.token-symbol {
  @apply text-lg font-medium text-gray-600 dark:text-gray-400;
}

.card-subtitle {
  @apply text-sm text-gray-500 dark:text-gray-400;
}

.action-section {
  @apply bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8;
}

.mining-tabs {
  @apply p-6;
}

.tab-content {
  @apply mt-6;
}

.action-form {
  @apply space-y-6;
}

.input-section {
  @apply space-y-4;
}

.input-group {
  @apply space-y-2;
}

.amount-input {
  @apply w-full;
}

.input-suffix {
  @apply text-gray-500 dark:text-gray-400 font-medium;
}

.quick-amounts {
  @apply flex gap-2;
}

.max-button {
  @apply text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300;
}

.balance-info {
  @apply flex justify-between items-center text-sm;
}

.balance-label {
  @apply text-gray-600 dark:text-gray-400;
}

.balance-value {
  @apply font-medium text-gray-900 dark:text-white;
}

.preview-section {
  @apply bg-gray-50 dark:bg-gray-700 rounded-lg p-4;
}

.preview-title {
  @apply text-sm font-medium text-gray-700 dark:text-gray-300 mb-3;
}

.preview-details {
  @apply space-y-2;
}

.preview-row {
  @apply flex justify-between items-center text-sm;
}

.preview-row span:first-child {
  @apply text-gray-600 dark:text-gray-400;
}

.preview-value {
  @apply font-medium text-gray-900 dark:text-white;
}

.exchange-rate {
  @apply pt-2 border-t border-gray-200 dark:border-gray-600;
}

.action-button {
  @apply w-full h-12 text-base font-medium;
}

.claim-section {
  @apply space-y-6;
}

.claim-info {
  @apply bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 rounded-lg p-6;
}

.claim-amount {
  @apply text-center mb-4;
}

.claim-amount h3 {
  @apply text-lg font-medium text-gray-700 dark:text-gray-300 mb-2;
}

.amount-display {
  @apply text-3xl font-bold text-primary-600 dark:text-primary-400 flex items-center justify-center gap-2;
}

.claim-details {
  @apply space-y-2;
}

.input-with-select {
  @apply flex w-full;
}

.input-with-select .el-input {
  @apply flex-1;
}

.token-select {
  @apply ml-2 w-32;
}

.token-option {
  @apply flex items-center gap-2;
}

.detail-row {
  @apply flex justify-between items-center text-sm;
}

.detail-row span:first-child {
  @apply text-gray-600 dark:text-gray-400;
}

.detail-row span:last-child {
  @apply font-medium text-gray-900 dark:text-white;
}

.claim-button {
  @apply bg-gradient-to-r from-primary-500 to-blue-500 hover:from-primary-600 hover:to-blue-600;
}

.card-value {
  @apply relative flex items-start justify-between;
}

.value-content {
  @apply flex items-baseline gap-2;
}

.claim-button-corner {
  @apply absolute bottom-0 right-0 text-xs px-2 py-1;
  @apply bg-gradient-to-r from-primary-500 to-blue-500 hover:from-primary-600 hover:to-blue-600;
  @apply border-0 rounded-md shadow-sm;
}



:deep(.el-tabs__header) {
  @apply mb-0;
}

:deep(.el-tabs__nav-wrap::after) {
  @apply bg-gray-200 dark:bg-gray-700;
}

:deep(.el-tabs__active-bar) {
  @apply bg-primary-500;
}

:deep(.el-tabs__item) {
  @apply text-gray-600 dark:text-gray-400;
}

:deep(.el-tabs__item.is-active) {
  @apply text-primary-600 dark:text-primary-400;
}

@media (max-width: 768px) {
  .mining-content {
    @apply px-4 py-6;
  }
  
  .overview-grid {
    @apply grid-cols-1 gap-4;
  }
  
  .quick-amounts {
    @apply grid grid-cols-4 gap-2;
  }
  

}
</style>