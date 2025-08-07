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
              <div class="card-subtitle">
                {{ $t('staking.apy') }} {{ formatNumber(stakingStore.currentAPY) }}%
              </div>
            </div>
            <div class="card-value">
              <img src="../assets/logo.png" alt="" class="token-icon">
              <AnimatedNumber class="animated-number" :value="stakingStore.yourStaked" :decimals="8"
                :auto-increment="walletStore.isConnected && parseFloat(stakingStore.yourStaked) > 0"
                :increment-amount="parseFloat(stakingStore.incrementAmount)" :increment-interval="1000"
                :cache-key="`yourStaked_${walletStore.address}`" :use-cache="false" />
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
                    <el-input v-model="stakeAmount"
                      :placeholder="formatNumberK(stakingStore.cinaBalance, 6) + '  available'" size="large"
                      class="amount-input" @input="handleStakeAmountChange">
                      <template #suffix>
                        <span class="input-suffix">CINA</span>
                      </template>
                    </el-input>
                  </div>

                  <!-- Quick Amount Buttons -->
                  <div class="quick-amounts">
                    <el-button v-for="percentage in [25, 50, 75]" :key="percentage" size="small"
                      @click="setStakePercentage(percentage)">
                      {{ percentage }}%
                    </el-button>
                    <el-button @click="setMaxStake" class="max-button" size="small">
                      {{ $t('common.max') }}
                    </el-button>
                  </div>

                  <!-- Minimum Stake Warning -->
                  <div v-if="showMinStakeWarning" class="warning-info">
                    <el-icon>
                      <Warning />
                    </el-icon>
                    <span>{{ $t('staking.minStakeWarning', { amount: formatNumber(stakingStore.minStakeAmount) })
                      }}</span>
                  </div>
                </div>

                <!-- Staking Preview -->
                <div v-if="stakePreviewData" class="preview-section">
                  <h4 class="preview-title">{{ $t('staking.preview') }}</h4>
                  <div class="preview-details">
                    <div class="preview-row">
                      <span>{{ $t('staking.youWillReceive') }}</span>
                      <span class="preview-value">{{ formatNumber(stakePreviewData.shares, 2) }} stCINA</span>
                    </div>
                    <div class="preview-row exchange-rate">
                      <span>{{ $t('staking.exchangeRate') }}</span>
                      <span class="preview-value">1 CINA ≈ {{ formatNumber((1 / parseFloat(stakePreviewData.shares)), 6)
                        }} stCINA</span>
                    </div>
                  </div>
                </div>

                <el-button type="primary" size="large"
                  :loading="transactionStatus === 'loading' && activeTab === 'stake'" :disabled="!isStakeValid"
                  @click="handleStake" class="action-button">
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
                    <el-input v-model="unstakeAmount"
                      :placeholder="formatNumberK(stakingStore.stakedAmount, 6) + '  available'" size="large"
                      class="amount-input" @input="handleUnstakeAmountChange">
                      <template #suffix>
                        <span class="input-suffix">CINA</span>
                      </template>
                    </el-input>
                  </div>

                  <!-- Quick Amount Buttons -->
                  <div class="quick-amounts">
                    <el-button v-for="percentage in [25, 50, 75]" :key="percentage" size="small"
                      @click="setUnstakePercentage(percentage)">
                      {{ percentage }}%
                    </el-button>
                    <el-button @click="setMaxUnstake" class="max-button" size="small">
                      {{ $t('common.max') }}
                    </el-button>
                  </div>

                  <!-- Note: Early unstake penalty not available in current contract -->
                  <div v-if="false" class="warning-info early-unstake">
                    <el-icon>
                      <Warning />
                    </el-icon>
                    <span>{{ $t('staking.earlyUnstakeWarning', { penalty: 0 }) }}</span>
                  </div>
                </div>

                <!-- Unstaking Preview -->
                <div v-if="unstakePreviewData" class="preview-section">
                  <h4 class="preview-title">{{ $t('staking.preview') }}</h4>
                  <div class="preview-details">
                    <div class="preview-row">
                      <span>{{ $t('staking.required') }}</span>
                      <span class="preview-value">{{ formatNumber(unstakePreviewData.shares, 2) }} stCINA</span>
                    </div>
                    <div class="preview-row exchange-rate">
                      <span>{{ $t('staking.exchangeRate') }}</span>
                      <span class="preview-value">1 stCINA ≈ {{ formatNumber(stakingStore.navCina, 6) }} CINA</span>
                    </div>
                  </div>
                </div>

                <el-button type="primary" size="large"
                  :loading="transactionStatus === 'loading' && activeTab === 'unstake'" :disabled="!isUnstakeValid"
                  @click="handleUnstake" class="action-button">
                  {{ $t('staking.unstakeCINA') }}
                </el-button>
              </div>
            </div>
          </el-tab-pane>

        </el-tabs>
      </div>


    </div>

    <!-- Transaction Modal -->
    <TransactionModal v-model:visible="showTransactionModal" :title="transactionModalTitle" :steps="transactionSteps"
      :current-step="currentTransactionStep" :status="transactionStatus" :transaction-details="transactionDetails"
      :transaction-hash="transactionHash" :error-message="transactionError" @close="handleTransactionModalClose"
      @retry="handleTransactionRetry" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import {
  Warning
} from '@element-plus/icons-vue'
import { parseUnits } from 'ethers'

import TransactionModal from '@/components/common/TransactionModal.vue'
import AnimatedNumber from '@/components/common/AnimatedNumber.vue'
import { useWalletStore } from '@/stores/wallet'
import { useStakingStore } from '@/stores/staking'
import { contractService } from '@/services/contracts'
import { formatNumber, formatNumberK } from '@/utils/format'
import { debounce } from '@/utils/debounce'

const { t } = useI18n()
const walletStore = useWalletStore()
const stakingStore = useStakingStore()

const activeTab = ref('stake')
const stakeAmount = ref('')
const unstakeAmount = ref('')
const stakePreviewData = ref({
  shares: '',
  fee: '0'
})
const unstakePreviewData = ref({
  shares: ''
})

// Transaction Modal
const showTransactionModal = ref(false)
const transactionModalTitle = ref('')
const currentTransactionStep = ref(0)
const transactionStatus = ref<'pending' | 'loading' | 'success' | 'error'>('pending')
const transactionHash = ref('')
const transactionError = ref('')

const transactionSteps = ref([
  { label: t('transaction.approve'), description: t('transaction.approveDescription') },
  { label: t('transaction.confirm'), description: t('transaction.confirmDescription') },
  { label: t('transaction.complete'), description: t('transaction.completeDescription') }
])

const transactionDetails = computed(() => {
  const details = []

  if (activeTab.value === 'stake' && stakeAmount.value) {
    details.push(
      { label: t('pay'), value: `-${formatNumber(stakeAmount.value, 6)} CINA`, highlight: true },
      { label: t('receive'), value: `${formatNumber(stakePreviewData.value?.shares || '0', 6)} stCINA` }
    )
  } else if (activeTab.value === 'unstake' && unstakeAmount.value) {
    details.push(
      { label: t('pay'), value: `-${formatNumber(unstakePreviewData.value?.shares || '0', 6)} stCINA` },
      { label: t('receive'), value: `${formatNumber(unstakeAmount.value, 6)} CINA`, highlight: true },
    )
  }

  return details
})

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


const stakePreview = computed(() => {
  const amount = parseFloat(stakeAmount.value)
  if (!amount || amount <= 0) return null

  const navCina = parseFloat(stakingStore.navCina)
  const shares = amount / navCina // ERC4626: shares = assets / NAV

  return {
    shares,
    exchangeRate: 1 / navCina
  }
})

const unstakePreview = computed(() => {
  const amount = parseFloat(unstakeAmount.value)
  if (!amount || amount <= 0) return null

  const navCina = parseFloat(stakingStore.navCina)
  const actualAmount = amount * navCina // ERC4626: assets = shares * NAV

  return {
    requiredAmount: actualAmount
  }
})

// Debounced preview functions
const debouncedStakePreview = debounce(async (amount: string) => {
  if (amount && parseFloat(amount) > 0) {
    try {
      stakePreviewData.value = await stakingStore.previewDeposit(amount)
    } catch (error) {
      console.error('Failed to preview stake:', error)
    }
  } else {
    stakePreviewData.value = { shares: '', fee: '0' }
  }
}, 500)

const debouncedUnstakePreview = debounce(async (amount: string) => {
  if (amount && parseFloat(amount) > 0) {
    try {
      unstakePreviewData.value = await stakingStore.previewWithdraw(amount)
    } catch (error) {
      console.error('Failed to preview unstake:', error)
    }
  } else {
    unstakePreviewData.value = { shares: '' }
  }
}, 500)

// Methods
const handleStakeAmountChange = (value: string) => {
  const cleanValue = value.replace(/[^0-9.]/g, '')
  stakeAmount.value = cleanValue
  debouncedStakePreview(cleanValue)
}

const handleUnstakeAmountChange = (value: string) => {
  const cleanValue = value.replace(/[^0-9.]/g, '')
  unstakeAmount.value = cleanValue
  debouncedUnstakePreview(cleanValue)
}

const setStakePercentage = (percentage: number) => {
  const balance = parseFloat(stakingStore.cinaBalance)
  let amount = '0.0'
  if (balance > 0) {
    amount = (balance * percentage / 100).toFixed(6)
  }
  stakeAmount.value = amount
  debouncedStakePreview(amount)
}

const setMaxStake = () => {
  stakeAmount.value = stakingStore.cinaBalance
  debouncedStakePreview(stakingStore.cinaBalance)
}

const setUnstakePercentage = (percentage: number) => {
  const balance = parseFloat(stakingStore.stakedAmount)
  let amount = '0.0'
  if (balance > 0) {
    amount = (balance * percentage / 100).toFixed(6)
  }
  unstakeAmount.value = amount
  debouncedUnstakePreview(amount)
}

const setMaxUnstake = () => {
  unstakeAmount.value = stakingStore.stakedAmount
  debouncedUnstakePreview(stakingStore.stakedAmount)
}

const handleStake = async () => {
  if (!isStakeValid.value || !walletStore.isConnected) return

  transactionModalTitle.value = t('staking.stakeTransaction')
  showTransactionModal.value = true
  currentTransactionStep.value = 0
  transactionStatus.value = 'pending'

  try {
    const amountWei = parseUnits(stakeAmount.value, 18)

    // Step 1: Check and approve CINA if needed
    const stakingContract = contractService.getStakingVaultContract(true)
    const cinaContract = contractService.getCINAContract(true)

    if (!stakingContract || !cinaContract) {
      throw new Error('Contract not available')
    }

    const stakingAddress = await stakingContract.getAddress()
    const allowance = await cinaContract.allowance(walletStore.address, stakingAddress)

    if (allowance < amountWei) {
      transactionStatus.value = 'loading'
      const approveTx = await cinaContract.approve(stakingAddress, amountWei)
      await approveTx.wait()
    }

    currentTransactionStep.value = 1

    // Step 2: Execute staking
    transactionStatus.value = 'loading'
    const depositTx = await stakingContract.deposit(amountWei, walletStore.address)
    const receipt = await depositTx.wait()

    transactionHash.value = receipt.hash
    currentTransactionStep.value = 2
    transactionStatus.value = 'success'

    // Reset form and refresh data
    stakeAmount.value = ''
    await stakingStore.fetchStakingData()
    currentTransactionStep.value = 3
    ElMessage.success(t('staking.stakeSuccess'))
  } catch (error: any) {
    transactionStatus.value = 'error'
    transactionError.value = error.message || t('staking.stakeFailed')
    console.error('Stake failed:', error)
  }
}

const handleUnstake = async () => {
  if (!isUnstakeValid.value || !walletStore.isConnected) return

  transactionModalTitle.value = t('staking.unstakeTransaction')
  showTransactionModal.value = true
  currentTransactionStep.value = 1
  transactionStatus.value = 'loading'

  try {
    const amountWei = parseUnits(unstakeAmount.value, 18)

    // Execute unstaking
    const stakingContract = contractService.getStakingVaultContract(true)
    if (!stakingContract) {
      throw new Error('Contract not available')
    }

    if (unstakeAmount.value == stakingStore.stakedAmount) {
      const withdrawTx = await stakingContract.redeem(
        parseUnits(stakingStore.stCINABalance, 18),
        walletStore.address,
        walletStore.address
      )
      const receipt = await withdrawTx.wait()
      transactionHash.value = receipt.hash
    } else {
      const withdrawTx = await stakingContract.withdraw(amountWei, walletStore.address, walletStore.address)
      const receipt = await withdrawTx.wait()
      transactionHash.value = receipt.hash
    }

    currentTransactionStep.value = 2
    transactionStatus.value = 'success'

    // Reset form and refresh data
    unstakeAmount.value = ''
    await stakingStore.fetchStakingData()
    currentTransactionStep.value = 3
    ElMessage.success(t('staking.unstakeSuccess'))
  } catch (error: any) {
    transactionStatus.value = 'error'
    transactionError.value = error.message || t('staking.unstakeFailed')
    console.error('Unstake failed:', error)
  }
}

// Lifecycle
onMounted(async () => {
  if (walletStore.isConnected) {
    await stakingStore.fetchStakingData()
    await stakingStore.startAutoRefresh()
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

// Watch for tab changes and reset input fields
watch(activeTab, (newTab) => {
  // Reset input amounts when switching tabs
  stakeAmount.value = ''
  unstakeAmount.value = ''
})

const handleTransactionModalClose = () => {
  showTransactionModal.value = false
  transactionHash.value = ''
  transactionError.value = ''
}

const handleTransactionRetry = () => {
  if (activeTab.value === 'stake') {
    handleStake()
  } else {
    handleUnstake()
  }
}
</script>

<style scoped>
.staking {
  @apply min-h-screen bg-gray-50 dark:bg-gray-900;
}

.staking-content {
  @apply max-w-xl mx-auto px-6 py-8;
}

.section-title {
  @apply text-2xl font-bold text-gray-900 dark:text-white mb-6;
}

.overview-grid {
  @apply grid grid-cols-1 gap-6 mb-8;
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
  @apply text-2xl font-bold text-gray-700 dark:text-white mb-2 flex items-center gap-2;
}

.token-icon {
  @apply w-8 h-8 rounded-full object-cover;
}

.animated-number {
  @apply flex items-center;
}

.token-symbol {
  @apply text-lg font-medium text-gray-600 dark:text-gray-400;
}

.card-subtitle {
  @apply text-sm font-medium text-gray-500 dark:text-gray-400;
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
  @apply flex space-x-2;
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
  @apply font-medium text-gray-700 dark:text-white;
}

.preview-row.penalty .preview-value {
  @apply text-red-600 dark:text-red-400;
}

.exchange-rate {
  @apply pt-2 border-t border-gray-200 dark:border-gray-600;
}

.preview-row.exchange-rate .preview-value {
  @apply text-primary-400 dark:text-primary-300 font-semibold;
}

.action-button {
  @apply w-full h-12 text-base font-medium;
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
}
</style>