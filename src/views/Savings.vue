<template>
  <PullToRefresh :is-pulling="isPulling" :is-refreshing="isRefreshing" :pull-distance="pullDistance"
    :can-refresh="canRefresh">
    <div class="savings">
      <div class="savings-content">
        <!-- Vault Overview -->
        <div class="vault-overview">
          <h2 class="section-title">
            {{ $t('savings.vaultOverview') }}
          </h2>

          <div class="overview-grid">
            <!-- Total Assets -->
            <div class="overview-card">
              <div class="card-header">
                <h3 class="card-title">{{ $t('savings.assetValue') }}</h3>
                <div class="card-subtitle">
                  {{ $t('savings.apy') }} {{ formatNumber(savingsStore.dynamicAPY) }}%
                </div>
              </div>
              <div class="card-value">
                <img src="../assets/wrmb.png" alt="" class="wrmb-icon">
                <AnimatedNumber class="animated-number" :value="savingsStore.userAssetValue" :decimals="dynamicDecimals"
                  :auto-increment="walletStore.isConnected && parseFloat(savingsStore.userAssetValue) > 0"
                  :increment-amount="parseFloat(savingsStore.userIncrementAmount)" :increment-interval="1000"
                  :cache-key="`userAssetValue_${walletStore.address}`" :use-cache="false" />
              </div>
            </div>
          </div>
        </div>

        <!-- Action Tabs -->
        <div class="action-section">
          <el-tabs v-model="activeTab" class="savings-tabs">
            <!-- Deposit Tab -->
            <el-tab-pane :label="$t('savings.deposit')" name="deposit">
              <div class="tab-content">
                <div class="action-form">
                  <div class="input-section">
                    <div class="input-group">
                      <el-input v-model="depositAmount"
                        :placeholder="formatNumberK(savingsStore.wrmbBalance) + '  ' + $t('available')" size="large"
                        class="amount-input" @input="handleDepositAmountChange">
                        <template #suffix>
                          <span class="input-suffix">WRMB</span>
                        </template>
                      </el-input>
                    </div>

                    <!-- Quick Amount Buttons -->
                    <div class="quick-amounts">
                      <el-button v-for="percentage in [25, 50, 75]" :key="percentage" size="small"
                        @click="setDepositPercentage(percentage)">
                        {{ percentage }}%
                      </el-button>
                      <el-button @click="setMaxDeposit" class="max-button" size="small">
                        {{ $t('common.max') }}
                      </el-button>
                    </div>
                  </div>

                  <!-- Preview -->
                  <div v-if="depositPreview.shares" class="preview-section">
                    <h4 class="preview-title">{{ $t('savings.preview') }}</h4>
                    <div class="preview-details">
                      <div class="preview-row">
                        <span>{{ $t('savings.youWillReceive') }}</span>
                        <span class="preview-value">{{ formatNumber(depositPreview.shares, 2) }} sWRMB</span>
                      </div>
                      <div class="preview-row exchange-rate">
                        <span>{{ $t('savings.currentExchangeRate') }}</span>
                        <span class="preview-value">1 WRMB ≈ {{ formatNumber((1 / parseFloat(savingsStore.currentNAV ||
                          '1')), 6) }}
                          sWRMB</span>
                      </div>
                    </div>
                  </div>

                  <el-button type="primary" size="large" :loading="savingsStore.depositInProgress"
                    :disabled="!isDepositValid" @click="handleDeposit" class="action-button">
                    {{ $t('savings.deposit') }}
                  </el-button>
                </div>
              </div>
            </el-tab-pane>

            <!-- Withdraw Tab -->
            <el-tab-pane :label="$t('savings.withdraw')" name="withdraw">
              <div class="tab-content">
                <div class="action-form">
                  <div class="input-section">
                    <div class="input-group">
                      <el-input v-model="withdrawAmount"
                        :placeholder="formatNumberK(savingsStore.userAssetValue) + '  ' + $t('available')" size="large"
                        class="amount-input" @input="handleWithdrawAmountChange">
                        <template #suffix>
                          <span class="input-suffix">WRMB</span>
                        </template>
                      </el-input>
                    </div>

                    <!-- Quick Amount Buttons -->
                    <div class="quick-amounts">
                      <el-button v-for="percentage in [25, 50, 75]" :key="percentage" size="small"
                        @click="setWithdrawPercentage(percentage)">
                        {{ percentage }}%
                      </el-button>
                      <el-button @click="setMaxWithdraw" class="max-button" size="small">
                        {{ $t('common.max') }}
                      </el-button>
                    </div>
                  </div>

                  <!-- Preview -->
                  <div v-if="withdrawPreview.shares" class="preview-section">
                    <h4 class="preview-title">{{ $t('savings.preview') }}</h4>
                    <div class="preview-details">
                      <div class="preview-row">
                        <span>{{ $t('savings.youWillReceive') }}</span>
                        <span class="preview-value">{{ formatNumber(withdrawPreview.assets, 2) }} WRMB</span>
                      </div>
                      <div class="preview-row">
                        <span>{{ $t('savings.fee') }} ({{ formatNumber((parseFloat(withdrawPreview.fee) *
                          100).toString())
                          }}%)</span>
                        <span class="fee-value">{{ formatNumber(withdrawPreviewFee, 2) }} WRMB</span>
                      </div>

                      <div class="preview-row exchange-rate">
                        <span>{{ $t('savings.currentExchangeRate') }}</span>
                        <span class="preview-value">1 sWRMB ≈ {{ formatNumber(savingsStore.currentNAV, 6) }} WRMB</span>
                      </div>
                    </div>
                  </div>

                  <el-button type="primary" size="large" :loading="savingsStore.withdrawInProgress"
                    :disabled="!isWithdrawValid" @click="handleWithdraw" class="action-button">
                    {{ $t('savings.withdraw') }}
                  </el-button>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>

        <!-- Statistics -->
        <div class="statistics-section">
          <h2 class="section-title">
            {{ $t('savings.statistics') }}
          </h2>

          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-label">{{ $t('savings.totalSupply') }}</div>
              <div class="stat-value">{{ formatNumberK(savingsStore.totalAssets) }}</div>
            </div>

            <div class="stat-item">
              <div class="stat-label">{{ $t('savings.yourShare') }}</div>
              <div class="stat-value">{{ formatNumberK(savingsStore.userSharePercentage) }}%</div>
            </div>

            <div class="stat-item">
              <div class="stat-label">{{ $t('savings.totalValue') }}</div>
              <div class="stat-value">${{ formatNumberK(parseFloat(savingsStore.totalAssets) * 0.14, 2) }}</div>
            </div>

            <div class="stat-item">
              <div class="stat-label">{{ $t('savings.yourValue') }}</div>
              <div class="stat-value">${{ formatNumberK(parseFloat(savingsStore.userAssetValue) * 0.14, 2) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Transaction Modal -->
      <TransactionModal v-model:visible="showTransactionModal" :title="transactionModalTitle" :steps="transactionSteps"
        :current-step="currentTransactionStep" :status="transactionStatus" :transaction-details="transactionDetails"
        :transaction-hash="transactionHash" :error-message="transactionError" @close="handleTransactionModalClose"
        @retry="handleTransactionRetry" />
    </div>
  </PullToRefresh>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { parseUnits } from 'ethers'

import PullToRefresh from '@/components/common/PullToRefresh.vue'
import TransactionModal from '@/components/common/TransactionModal.vue'
import AnimatedNumber from '@/components/common/AnimatedNumber.vue'
import { useSavingsStore } from '@/stores/savings'
import { useWalletStore } from '@/stores/wallet'
import { contractService } from '@/services/contracts'
import { formatNumber, formatNumberK } from '@/utils/format'
import { debounce } from '@/utils/debounce'
import { usePullToRefresh } from '@/composables/usePullToRefresh'

const { t } = useI18n()
const savingsStore = useSavingsStore()
const walletStore = useWalletStore()

const activeTab = ref('deposit')
const depositAmount = ref('')
const withdrawAmount = ref('')
const depositPreview = ref({
  shares: '',
  fee: '0'
})
const withdrawPreview = ref({
  shares: '',
  assets: '',
  fee: '0'
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
  const details: {
    label: string
    value: string
    highlight?: boolean
    type?: 'debit' | 'credit'
  }[] = []

  if (activeTab.value === 'deposit' && depositAmount.value) {
    details.push(
      { label: t('pay'), value: `-${formatNumber(depositAmount.value, 6)} WRMB`, highlight: true, type: 'debit' },
      { label: t('receive'), value: `+${formatNumber(depositPreview.value?.shares || '0', 6)} sWRMB`, type: 'credit' }
    )
  } else if (activeTab.value === 'withdraw' && withdrawAmount.value) {
    details.push(
      { label: t('pay'), value: `-${formatNumber(withdrawPreview.value?.shares || '0', 6)} sWRMB`, type: 'debit' },
      { label: t('receive'), value: `+${formatNumber(withdrawPreview.value?.assets || '0', 6)} WRMB`, highlight: true, type: 'credit' },
    )
    if (parseFloat(withdrawPreviewFee.value) > 0) {
      details.push({ label: t('savings.fee'), value: `-${formatNumber(withdrawPreviewFee.value, 6)} WRMB`, type: 'debit' })
    }
  }

  return details
})

const isDepositValid = computed(() => {
  const amount = parseFloat(depositAmount.value)
  return amount > 0 && amount <= parseFloat(savingsStore.wrmbBalance)
})

const isWithdrawValid = computed(() => {
  const amount = parseFloat(withdrawAmount.value)
  const maxWithdrawable = parseFloat(savingsStore.userAssetValue)
  return amount > 0 && amount <= maxWithdrawable
})

const withdrawPreviewFee = computed(() => {
  const amount = parseFloat(withdrawAmount.value)
  const fee = parseFloat(withdrawPreview.value.fee)
  return (amount * fee).toString()
})

// 动态小数位数计算
const dynamicDecimals = computed(() => {
  const value = parseFloat(savingsStore.userAssetValue)
  if (value >= 10000) {
    return 8
  } else if (value >= 1000) {
    return 9
  } else if (value >= 100) {
    return 10
  } else if (value >= 10) {
    return 11
  } else if (value < 1) {
    return 12
  } else {
    return 10 // 默认值，适用于1-999.99范围
  }
})

// Debounced preview functions
const debouncedDepositPreview = debounce(async (amount: string) => {
  if (amount && parseFloat(amount) > 0) {
    try {
      depositPreview.value = await savingsStore.previewDeposit(amount)
    } catch (error) {
      console.error('Failed to preview deposit:', error)
    }
  } else {
    depositPreview.value = { shares: '', fee: '0' }
  }
}, 500)

const debouncedWithdrawPreview = debounce(async (amount: string) => {
  if (amount && parseFloat(amount) > 0) {
    try {
      withdrawPreview.value = await savingsStore.previewWithdraw(amount)
    } catch (error) {
      console.error('Failed to preview withdraw:', error)
    }
  } else {
    withdrawPreview.value = { shares: '', assets: '', fee: '0' }
  }
}, 500)

const handleDepositAmountChange = (value: string) => {
  debouncedDepositPreview(value)
}

const handleWithdrawAmountChange = (value: string) => {
  debouncedWithdrawPreview(value)
}

const setMaxDeposit = () => {
  depositAmount.value = savingsStore.wrmbBalance
  handleDepositAmountChange(depositAmount.value)
}

const setMaxWithdraw = () => {
  withdrawAmount.value = savingsStore.userAssetValue
  handleWithdrawAmountChange(withdrawAmount.value)
}

const setDepositPercentage = (percentage: number) => {
  const amount = (parseFloat(savingsStore.wrmbBalance) * percentage / 100).toString()
  depositAmount.value = amount
  handleDepositAmountChange(amount)
}

const setWithdrawPercentage = (percentage: number) => {
  const amount = (parseFloat(savingsStore.userAssetValue) * percentage / 100).toString()
  withdrawAmount.value = amount
  handleWithdrawAmountChange(amount)
}

const handleDeposit = async () => {
  if (!isDepositValid.value || !walletStore.isConnected) return

  transactionModalTitle.value = t('savings.depositTransaction')
  showTransactionModal.value = true
  currentTransactionStep.value = 0
  transactionStatus.value = 'pending'

  try {
    const amountWei = parseUnits(depositAmount.value, 18)

    // Step 1: Check and approve WRMB if needed
    const wrmbContract = contractService.getWRMBContract(true)
    const savingsContract = contractService.getSavingsVaultContract(true)

    if (!wrmbContract || !savingsContract) {
      throw new Error('Contract not available')
    }

    const savingsAddress = await savingsContract.getAddress()
    const allowance = await wrmbContract.allowance(walletStore.address, savingsAddress)

    if (allowance < amountWei) {
      transactionStatus.value = 'loading'
      const approveTx = await wrmbContract.approve(savingsAddress, amountWei)
      await approveTx.wait()
    }

    currentTransactionStep.value = 1

    // Step 2: Execute deposit
    transactionStatus.value = 'loading'
    const depositTx = await savingsContract.deposit(amountWei, walletStore.address)
    const receipt = await depositTx.wait()

    transactionHash.value = receipt.hash
    currentTransactionStep.value = 2
    transactionStatus.value = 'success'

    // Reset form and refresh data
    depositAmount.value = ''
    depositPreview.value = { shares: '', fee: '0' }
    await savingsStore.fetchVaultData()
    currentTransactionStep.value = 3
    ElMessage.success(t('savings.depositSuccess'))
  } catch (error: any) {
    transactionStatus.value = 'error'
    transactionError.value = error.message || t('savings.depositFailed')
    console.error('Deposit failed:', error)
  }
}

const handleWithdraw = async () => {
  if (!isWithdrawValid.value || !walletStore.isConnected) return

  // 检查手续费是否超过10%，需要二次确认
  const feePercentage = parseFloat(withdrawPreview.value.fee) * 100
  if (feePercentage > 10) {
    const confirmed = await ElMessageBox.confirm(
      `${t('savings.highFeeWarning')} ${formatNumber(feePercentage.toString(), 2)}%。${t('savings.confirmHighFeeWithdraw')}`,
      t('savings.highFeeTitle'),
      {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'warning',
        dangerouslyUseHTMLString: false
      }
    ).catch(() => false)

    if (!confirmed) {
      return
    }
  }

  transactionModalTitle.value = t('savings.withdrawTransaction')
  showTransactionModal.value = true
  currentTransactionStep.value = 1
  transactionStatus.value = 'loading'

  try {
    const amountWei = parseUnits(withdrawAmount.value, 18)

    // Execute withdraw
    const savingsContract = contractService.getSavingsVaultContract(true)
    if (!savingsContract) {
      throw new Error('Contract not available')
    }

    if (withdrawAmount.value === savingsStore.userAssetValue) {
      const withdrawTx = await savingsContract.redeem(
        parseUnits(savingsStore.userBalance, 18),
        walletStore.address,
        walletStore.address
      )
      const receipt = await withdrawTx.wait()
      transactionHash.value = receipt.hash
    } else {
      const withdrawTx = await savingsContract.withdraw(
        amountWei,
        walletStore.address,
        walletStore.address
      )
      const receipt = await withdrawTx.wait()
      transactionHash.value = receipt.hash
    }

    currentTransactionStep.value = 2
    transactionStatus.value = 'success'

    // Reset form and refresh data
    withdrawAmount.value = ''
    withdrawPreview.value = { shares: '', assets: '', fee: '0' }
    await savingsStore.fetchVaultData()
    currentTransactionStep.value = 3
    ElMessage.success(t('savings.withdrawSuccess'))
  } catch (error: any) {
    transactionStatus.value = 'error'
    transactionError.value = error.message || t('savings.withdrawFailed')
    console.error('Withdraw failed:', error)
  }
}

const handleTransactionModalClose = () => {
  showTransactionModal.value = false
  transactionHash.value = ''
  transactionError.value = ''
}

const handleTransactionRetry = () => {
  if (activeTab.value === 'deposit') {
    handleDeposit()
  } else {
    handleWithdraw()
  }
}

const refreshData = async () => {
  await Promise.all([
    savingsStore.fetchVaultData(),
    savingsStore.fetchUserBalances(),
    savingsStore.fetchWRMBPrice()
  ])
}

// Pull to refresh functionality
const { isRefreshing, pullDistance, isPulling, canRefresh } = usePullToRefresh({
  onRefresh: refreshData,
  enabled: true
})

onMounted(async () => {
  if (walletStore.isConnected) {
    await refreshData()
    savingsStore.startAutoRefresh()
  } else {
    // Even if wallet is not connected, fetch basic vault data and price
    await savingsStore.fetchVaultData()
  }
})

// Watch for wallet connection changes
watch(
  () => walletStore.isConnected,
  async (connected) => {
    if (connected) {
      await refreshData()
      savingsStore.startAutoRefresh()
    } else {
      savingsStore.stopAutoRefresh()
    }
  }
)

// Watch for chainId changes
watch(
  () => walletStore.chainId,
  async (chainId) => {
    if (chainId) {
      await refreshData()
    }
  }
)

// Watch for tab changes and reset input fields
watch(activeTab, (newTab) => {
  // Reset input amounts and previews when switching tabs
  depositAmount.value = ''
  withdrawAmount.value = ''
  depositPreview.value = { shares: '', fee: '0' }
  withdrawPreview.value = { shares: '', assets: '', fee: '0' }
})
</script>

<style scoped>
.savings {
  @apply bg-gray-50 dark:bg-gray-900;
}

.savings-header {
  @apply bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-8;
}

.header-content {
  @apply max-w-7xl mx-auto flex items-center justify-between;
}

.header-actions {
  @apply flex items-center space-x-4;
}

.savings-content {
  @apply max-w-xl mx-auto px-6 py-8 space-y-8;
}

.section-title {
  @apply text-2xl font-bold text-gray-900 dark:text-white mb-6;
}

.overview-grid {
  @apply grid grid-cols-1 gap-6;
}

.overview-card {
  @apply bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-all duration-200 hover:shadow-md;
}

.overview-card.highlight {
  @apply bg-gradient-to-br from-primary-500 to-primary-600 text-white border-primary-500;
}

.card-header {
  @apply flex items-center justify-between mb-4;
}

.card-title {
  @apply text-sm font-medium text-gray-600 dark:text-gray-400;
}

.overview-card.highlight .card-title {
  @apply text-primary-100;
}

.card-icon {
  @apply text-xl text-gray-400;
}

.overview-card.highlight .card-icon {
  @apply text-primary-200;
}

.card-value {
  @apply text-2xl font-bold text-gray-700 dark:text-white flex items-center gap-2;
}

.wrmb-icon {
  @apply w-8 h-8 rounded-full object-cover flex-shrink-0;
}

.animated-number {
  @apply flex items-center;
}

.overview-card.highlight .card-value {
  @apply text-white;
}

.card-subtitle {
  @apply text-sm font-medium text-gray-500 dark:text-gray-400;
}

.overview-card.highlight .card-subtitle {
  @apply text-primary-100;
}

.action-section {
  @apply bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700;
}

.savings-tabs {
  @apply p-6;
}

.tab-content {
  @apply mt-6;
}

.action-form {
  @apply max-w-md mx-auto;
}

.form-header {
  @apply flex items-center justify-between mb-6;
}

.form-title {
  @apply text-lg font-semibold text-gray-900 dark:text-white;
}

.balance-info {
  @apply text-sm;
}

.balance-label {
  @apply text-gray-600 dark:text-gray-400;
}

.balance-value {
  @apply font-medium text-gray-900 dark:text-white ml-1;
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

.max-button {
  @apply text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300;
}

.quick-amounts {
  @apply flex space-x-2;
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

.statistics-section {
  @apply bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6;
}

.stats-grid {
  @apply grid grid-cols-2 lg:grid-cols-4 gap-6;
}

.stat-item {
  @apply text-center;
}

.stat-label {
  @apply text-sm text-gray-600 dark:text-gray-400 mb-2;
}

.stat-value {
  @apply text-sm font-bold text-gray-900 dark:text-white;
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
  .savings-header {
    @apply px-4 py-6;
  }

  .header-content {
    @apply flex-col items-start space-y-4;
  }

  .savings-content {
    @apply px-4 py-6;
  }

  .overview-grid {
    @apply grid-cols-1 gap-4;
  }

  .stats-grid {
    @apply grid-cols-2 gap-4;
  }

  .action-form {
    @apply max-w-full;
  }
}
</style>