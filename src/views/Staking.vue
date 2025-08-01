<template>
  <div class="staking">
    <div class="staking-content">
      <!-- Staking Overview -->
      <div class="staking-overview">
        <h2 class="section-title">
          {{ $t('staking.overview') }}
        </h2>

        <div class="overview-grid">
          <!-- Your Staked -->
          <div class="overview-card">
            <div class="card-header">
              <h3 class="card-title">{{ $t('staking.yourStaked') }}</h3>
              <el-icon class="card-icon">
                <Lock />
              </el-icon>
            </div>
            <div class="card-value">
              <AnimatedNumber 
                :value="stakingStore.totalStaked" 
                :decimals="4"
                :auto-increment="walletStore.isConnected && parseFloat(stakingStore.totalStaked) > 0"
                :increment-amount="parseFloat(stakingStore.stakingRewardRate)"
                :increment-interval="1000"
                :cache-key="`totalStaked_${walletStore.address}`"
                :use-cache="false"
              />
              <span class="token-symbol">CINA</span>
            </div>
            <div class="card-subtitle">
              {{ $t('staking.apy') }}: {{ formatNumber(stakingStore.currentAPY) }}%
            </div>
          </div>
        </div>
      </div>

      <!-- Staking Actions -->
      <div class="action-section">
        <el-tabs v-model="activeTab" class="staking-tabs">
          <!-- Stake CINA Tab -->
          <el-tab-pane :label="$t('staking.stakeCINA')" name="stake">
            <div class="tab-content">
              <div class="action-form">
                <div class="input-section">
                  <div class="input-group">
                    <el-input 
                      v-model="stakeAmount" 
                      :placeholder="$t('staking.enterCINAAmount')" 
                      size="large"
                      class="amount-input" 
                      @input="handleStakeAmountChange"
                    >
                      <template #suffix>
                        <span class="input-suffix">CINA</span>
                      </template>
                    </el-input>
                  </div>
                  
                  <!-- Quick Amount Buttons -->
                  <div class="quick-amounts">
                    <el-button 
                      v-for="percentage in [25, 50, 75]" 
                      :key="percentage" 
                      size="small"
                      @click="setStakePercentage(percentage)"
                    >
                      {{ percentage }}%
                    </el-button>
                    <el-button @click="setMaxStake" class="max-button" size="small">
                      {{ $t('common.max') }}
                    </el-button>
                  </div>

                  <!-- Balance Display -->
                  <div class="balance-info">
                    <span class="balance-label">{{ $t('staking.cinaBalance') }}:</span>
                    <span class="balance-value">{{ formatNumber(stakingStore.cinaBalance) }} CINA</span>
                  </div>

                  <!-- Minimum Stake Warning -->
                  <div v-if="showMinStakeWarning" class="warning-info">
                    <el-icon><Warning /></el-icon>
                    <span>{{ $t('staking.minStakeWarning', { amount: formatNumber(stakingStore.minStakeAmount) }) }}</span>
                  </div>
                </div>

                <!-- Staking Preview -->
                <div v-if="stakePreview" class="preview-section">
                  <h4 class="preview-title">{{ $t('staking.preview') }}</h4>
                  <div class="preview-details">
                    <div class="preview-row">
                      <span>{{ $t('staking.youWillReceive') }}</span>
                      <span class="preview-value">{{ formatNumber(stakePreview.shares, 4) }} stCINA</span>
                    </div>
                    <div class="preview-row">
                      <span>{{ $t('staking.dailyReward') }}</span>
                      <span class="preview-value">{{ formatNumber(stakePreview.dailyReward, 4) }} CINA/day</span>
                    </div>
                    <div class="preview-row exchange-rate">
                      <span>{{ $t('staking.exchangeRate') }}</span>
                      <span class="preview-value">1 CINA = {{ formatNumber(stakePreview.exchangeRate, 6) }} stCINA</span>
                    </div>
                  </div>
                </div>

                <el-button 
                  type="primary" 
                  size="large" 
                  :loading="stakingStore.stakeInProgress"
                  :disabled="!isStakeValid" 
                  @click="handleStake" 
                  class="action-button"
                >
                  {{ $t('staking.stakeCINA') }}
                </el-button>
              </div>
            </div>
          </el-tab-pane>

          <!-- Unstake CINA Tab -->
          <el-tab-pane :label="$t('staking.unstakeCINA')" name="unstake">
            <div class="tab-content">
              <div class="action-form">
                <div class="input-section">
                  <div class="input-group">
                    <el-input 
                      v-model="unstakeAmount" 
                      :placeholder="$t('staking.enterCINAAmount')" 
                      size="large"
                      class="amount-input" 
                      @input="handleUnstakeAmountChange"
                    >
                      <template #suffix>
                        <span class="input-suffix">CINA</span>
                      </template>
                    </el-input>
                  </div>
                  
                  <!-- Quick Amount Buttons -->
                  <div class="quick-amounts">
                    <el-button 
                      v-for="percentage in [25, 50, 75]" 
                      :key="percentage" 
                      size="small"
                      @click="setUnstakePercentage(percentage)"
                    >
                      {{ percentage }}%
                    </el-button>
                    <el-button @click="setMaxUnstake" class="max-button" size="small">
                      {{ $t('common.max') }}
                    </el-button>
                  </div>

                  <!-- Staked Balance Display -->
                  <div class="balance-info">
                    <span class="balance-label">{{ $t('staking.stakedBalance') }}:</span>
                    <span class="balance-value">{{ formatNumber(stakingStore.stakedAmount) }} CINA</span>
                  </div>

                  <!-- Early Unstake Warning -->
                  <div v-if="showEarlyUnstakeWarning" class="warning-info early-unstake">
                    <el-icon><Warning /></el-icon>
                    <span>{{ $t('staking.earlyUnstakeWarning', { penalty: formatNumber(parseFloat(stakingStore.earlyUnstakePenalty) * 100) }) }}</span>
                  </div>
                </div>

                <!-- Unstaking Preview -->
                <div v-if="unstakePreview" class="preview-section">
                  <h4 class="preview-title">{{ $t('staking.preview') }}</h4>
                  <div class="preview-details">
                    <div class="preview-row">
                      <span>{{ $t('staking.youWillReceive') }}</span>
                      <span class="preview-value">{{ formatNumber(unstakePreview.actualAmount, 4) }} CINA</span>
                    </div>
                    <div v-if="unstakePreview.penalty > 0" class="preview-row penalty">
                      <span>{{ $t('staking.penalty') }}</span>
                      <span class="preview-value penalty-amount">-{{ formatNumber(unstakePreview.penalty, 4) }} CINA</span>
                    </div>
                    <div class="preview-row">
                      <span>{{ $t('staking.stakingPeriod') }}</span>
                      <span class="preview-value">{{ formatDuration(unstakePreview.stakingDuration) }}</span>
                    </div>
                  </div>
                </div>

                <el-button 
                  type="primary" 
                  size="large" 
                  :loading="stakingStore.unstakeInProgress"
                  :disabled="!isUnstakeValid" 
                  @click="handleUnstake" 
                  class="action-button"
                >
                  {{ $t('staking.unstakeCINA') }}
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
  Lock,
  Trophy,
  TrendCharts,
  Plus,
  Minus,
  Warning
} from '@element-plus/icons-vue'

import AnimatedNumber from '@/components/common/AnimatedNumber.vue'
import { useWalletStore } from '@/stores/wallet'
import { useStakingStore } from '@/stores/staking'
import { formatNumber, formatTimeAgo, formatDuration } from '@/utils/format'

const { t } = useI18n()
const walletStore = useWalletStore()
const stakingStore = useStakingStore()

const activeTab = ref('stake')
const stakeAmount = ref('')
const unstakeAmount = ref('')

// Computed properties
const isStakeValid = computed(() => {
  const amount = parseFloat(stakeAmount.value)
  return amount > 0 && 
         amount <= parseFloat(stakingStore.cinaBalance) && 
         amount >= parseFloat(stakingStore.minStakeAmount)
})

const isUnstakeValid = computed(() => {
  const amount = parseFloat(unstakeAmount.value)
  return amount > 0 && amount <= parseFloat(stakingStore.stakedAmount)
})



const showMinStakeWarning = computed(() => {
  const amount = parseFloat(stakeAmount.value)
  return amount > 0 && amount < parseFloat(stakingStore.minStakeAmount)
})

const showEarlyUnstakeWarning = computed(() => {
  return stakingStore.stakingDuration < stakingStore.minStakingPeriod
})

const stakePreview = computed(() => {
  const amount = parseFloat(stakeAmount.value)
  if (!amount || amount <= 0) return null
  
  const exchangeRate = parseFloat(stakingStore.stakeExchangeRate)
  const shares = amount * exchangeRate
  const dailyReward = amount * parseFloat(stakingStore.currentAPY) / 365 / 100
  
  return {
    shares,
    dailyReward,
    exchangeRate
  }
})

const unstakePreview = computed(() => {
  const amount = parseFloat(unstakeAmount.value)
  if (!amount || amount <= 0) return null
  
  const isEarlyUnstake = stakingStore.stakingDuration < stakingStore.minStakingPeriod
  const penalty = isEarlyUnstake ? amount * parseFloat(stakingStore.earlyUnstakePenalty) : 0
  const actualAmount = amount - penalty
  
  return {
    actualAmount,
    penalty,
    stakingDuration: stakingStore.stakingDuration
  }
})

// Methods
const handleStakeAmountChange = (value: string) => {
  const cleanValue = value.replace(/[^0-9.]/g, '')
  stakeAmount.value = cleanValue
}

const handleUnstakeAmountChange = (value: string) => {
  const cleanValue = value.replace(/[^0-9.]/g, '')
  unstakeAmount.value = cleanValue
}

const setStakePercentage = (percentage: number) => {
  const balance = parseFloat(stakingStore.cinaBalance)
  const amount = (balance * percentage / 100).toFixed(6)
  stakeAmount.value = amount
}

const setMaxStake = () => {
  stakeAmount.value = stakingStore.cinaBalance
}

const setUnstakePercentage = (percentage: number) => {
  const balance = parseFloat(stakingStore.stakedAmount)
  const amount = (balance * percentage / 100).toFixed(6)
  unstakeAmount.value = amount
}

const setMaxUnstake = () => {
  unstakeAmount.value = stakingStore.stakedAmount
}

const handleStake = async () => {
  try {
    const amount = parseFloat(stakeAmount.value)
    await stakingStore.stakeCINA(amount)
    ElMessage.success(t('staking.stakeSuccess'))
    stakeAmount.value = ''
  } catch (error) {
    console.error('Stake failed:', error)
    ElMessage.error(t('staking.stakeFailed'))
  }
}

const handleUnstake = async () => {
  try {
    const amount = parseFloat(unstakeAmount.value)
    await stakingStore.unstakeCINA(amount)
    ElMessage.success(t('staking.unstakeSuccess'))
    unstakeAmount.value = ''
  } catch (error) {
    console.error('Unstake failed:', error)
    ElMessage.error(t('staking.unstakeFailed'))
  }
}





// Lifecycle
onMounted(async () => {
  if (walletStore.isConnected) {
    await stakingStore.fetchStakingData()
  }
})

// Watch for wallet connection changes
watch(
  () => walletStore.isConnected,
  async (connected) => {
    if (connected) {
      await stakingStore.fetchStakingData()
    }
  }
)
</script>

<style scoped>
.staking {
  @apply min-h-screen bg-gray-50 dark:bg-gray-900;
}

.staking-content {
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

.staking-tabs {
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

.warning-info {
  @apply flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-800 dark:text-yellow-200;
}

.warning-info.early-unstake {
  @apply bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200;
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

.preview-row.penalty .preview-value {
  @apply text-red-600 dark:text-red-400;
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
  @apply bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 rounded-lg p-6;
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
  @apply bg-gradient-to-r from-primary-500 to-purple-500 hover:from-primary-600 hover:to-purple-600;
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
  .staking-content {
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