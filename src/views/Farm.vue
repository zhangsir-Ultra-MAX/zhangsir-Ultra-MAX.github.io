<template>
  <div class="farm">
    <div class="farm-content">
      <!-- Farm Overview -->
      <div class="farm-overview">
        <h2 class="section-title">
          {{ $t('farm.overview') }}
        </h2>

        <div class="overview-grid">
          <!-- Your CINA Mined -->
          <div class="overview-card">
            <div class="card-header">
              <h3 class="card-title">{{ $t('farm.yourMined') }}</h3>
              <div class="card-subtitle">
                {{ $t('farm.apy') }} {{ formatNumber(farmStore.farmAPY) }}%
              </div>
            </div>
            <div class="card-value">
              <img src="../assets/logo.png" alt="" class="token-icon">
              <AnimatedNumber class="animated-number" :value="farmStore.pendingCINA" :decimals="8"
                :auto-increment="walletStore.isConnected && parseFloat(farmStore.pendingCINA) > 0"
                :increment-amount="parseFloat(farmStore.incrementAmount)" :increment-interval="1000"
                :cache-key="`totalCINAMined_${walletStore.address}`" :use-cache="false" />
            </div>
          </div>
        </div>
      </div>

      <!-- Farm Actions -->
      <div class="action-section">
        <el-tabs v-model="activeTab" class="farm-tabs">
          <!-- Deposit Token Tab -->
          <el-tab-pane :label="$t('farm.deposit')" name="deposit">
            <div class="tab-content">
              <div class="action-form">
                <div class="input-section">
                  <div class="input-group">
                    <div class="input-with-select">
                      <el-input v-model="depositAmount"
                        :placeholder="formatNumberK(farmStore.usdtBalance) + '  ' + $t('available')" size="large"
                        class="amount-input" @input="handleDepositAmountChange" />
                      <TokenSelect v-model="depositToken" :tokens="availableTokens" placeholder="Select token" />
                    </div>
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

                <!-- Farm Preview -->
                <div v-if="depositPreview" class="preview-section">
                  <h4 class="preview-title">{{ $t('farm.preview') }}</h4>
                  <div class="preview-details">
                    <div class="preview-row">
                      <span>{{ $t('farm.dailyReward') }}</span>
                      <span class="preview-value">{{ formatNumber(depositPreview.dailyReward, 2) }} CINA</span>
                    </div>
                  </div>
                </div>

                <el-button type="primary" size="large" :loading="farmStore.depositInProgress"
                  :disabled="!isDepositValid" @click="handleDeposit" class="action-button">
                  {{ $t('farm.deposit') }}
                </el-button>
              </div>
            </div>
          </el-tab-pane>

          <!-- Withdraw Token Tab -->
          <el-tab-pane :label="$t('farm.withdraw')" name="withdraw">
            <div class="tab-content">
              <div class="action-form">
                <div class="input-section">
                  <div class="input-group">
                    <div class="input-with-select">
                      <el-input v-model="withdrawAmount"
                        :placeholder="formatNumberK(farmStore.depositedAmount) + '  ' + $t('available')" size="large"
                        class="amount-input" @input="handleWithdrawAmountChange" />
                      <TokenSelect v-model="withdrawToken" :tokens="availableTokens" placeholder="Select token" />
                    </div>
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

                  <!-- Claim CINA -->
                  <div class="input-group">
                    <el-checkbox v-model="withdrawCINA" class="withdraw-cina-checkbox">
                      {{ $t('farm.withdrawCINA') }}
                    </el-checkbox>
                  </div>
                </div>

                <!-- Withdraw Preview -->
                <div v-if="withdrawPreview" class="preview-section">
                  <h4 class="preview-title">{{ $t('farm.preview') }}</h4>
                  <div class="preview-details">
                    <div class="preview-row">
                      <span>Liquidity</span>
                      <span class="preview-value liquidity-value">{{ formatNumber(withdrawPreview.liquidityAmount, 2) }} {{
                        withdrawToken?.symbol }}</span>
                    </div>
                    <div v-if="withdrawCINA" class="preview-row">
                      <span>Farm Reward</span>
                      <span class="preview-value">{{ formatNumber(withdrawPreview.rewardAmount, 2) }} CINA</span>
                    </div>
                  </div>
                </div>

                <el-button type="primary" size="large"
                  :loading="farmStore.withdrawInProgress || farmStore.claimInProgress" :disabled="!isWithdrawValid"
                  @click="handleWithdraw" class="action-button">
                  {{ withdrawCINA && (!withdrawAmount || parseFloat(withdrawAmount) === 0) ? $t('farm.claim') :
                    $t('farm.withdraw') }}
                </el-button>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
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
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { parseUnits } from 'ethers'

import AnimatedNumber from '@/components/common/AnimatedNumber.vue'
import TokenSelect from '@/components/TokenSelect.vue'
import TransactionModal from '@/components/common/TransactionModal.vue'
import { useWalletStore } from '@/stores/wallet'
import { useFarmStore } from '@/stores/farm'
import { contractService } from '@/services/contracts'
import { formatNumber, formatNumberK } from '@/utils/format'
import { TOKENS } from '@/constants'

// Define types
interface Token {
  symbol: string
  name: string
  address: string
  decimals: number
}

const { t } = useI18n()
const walletStore = useWalletStore()
const farmStore = useFarmStore()

// Available tokens for farm
const availableTokens = computed<Token[]>(() => {
  const chainId = walletStore.chainId || 11155111

  return [
    {
      symbol: TOKENS.USDT.symbol,
      name: TOKENS.USDT.name,
      address: TOKENS.USDT.addresses[chainId as keyof typeof TOKENS.USDT.addresses] || TOKENS.USDT.addresses[11155111] || '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
      decimals: TOKENS.USDT.decimals
    },
    // {
    //   symbol: TOKENS.USDC.symbol,
    //   name: TOKENS.USDC.name,
    //   address: TOKENS.USDC.addresses[chainId as keyof typeof TOKENS.USDC.addresses] || TOKENS.USDC.addresses[11155111] || '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    //   decimals: TOKENS.USDC.decimals
    // }
  ]
})

const activeTab = ref('deposit')
const depositAmount = ref('')
const withdrawAmount = ref('')
const withdrawCINA = ref(false) // 是否同时提取CINA的开关
const depositToken = ref<Token>()
const withdrawToken = ref<Token>()

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

  if (activeTab.value === 'deposit' && depositAmount.value) {
    details.push(
      { label: t('pay'), value: `-${formatNumber(depositAmount.value, 2)} USDT`, highlight: true }
    )
  } else if (activeTab.value === 'withdraw') {
    if(withdrawAmount.value) {
      details.push(
        { label: t('receive'), value: `${formatNumber(withdrawAmount.value, 2)} USDT`, highlight: true }
      )
    }
    if (withdrawCINA.value && parseFloat(farmStore.pendingCINA) > 0) {
      details.push(
        { label: t('receive'), value: `${formatNumber(farmStore.pendingCINA, 6)} CINA` }
      )
    }
  }

  return details
})

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
  return amount > 0 && amount <= parseFloat(farmStore.usdtBalance)
})

const isClaimValid = computed(() => {
  return parseFloat(farmStore.pendingCINA) > 0
})

const isWithdrawValid = computed(() => {
  const amount = parseFloat(withdrawAmount.value)
  // 如果勾选了withdrawCINA但没有输入金额，只要有可claim的CINA就有效
  if (withdrawCINA.value && (!withdrawAmount.value || amount === 0)) {
    return parseFloat(farmStore.pendingCINA) > 0
  }
  // 如果有输入金额，检查金额是否有效
  return amount > 0 && amount <= parseFloat(farmStore.depositedAmount)
})

const depositPreview = computed(() => {
  const amount = parseFloat(depositAmount.value)
  if (!amount || amount <= 0) return null

  const exchangeRate = parseFloat(farmStore.exchangeRate)
  const estimatedCINA = amount * exchangeRate
  const dailyReward = estimatedCINA * parseFloat(farmStore.farmAPY) / 365 / 100

  return {
    estimatedCINA,
    dailyReward
  }
})

const withdrawPreview = computed(() => {
  const amount = parseFloat(withdrawAmount.value)
  if (!amount || amount <= 0) return null

  return {
    rewardAmount: farmStore.pendingCINA,
    liquidityAmount: farmStore.liquidityAmount
  }
})

// Methods
const handleDepositAmountChange = (value: string) => {
  // Remove non-numeric characters except decimal point
  const cleanValue = value.replace(/[^0-9.]/g, '')
  depositAmount.value = cleanValue
}

const setDepositPercentage = (percentage: number) => {
  const balance = parseFloat(farmStore.usdtBalance)
  const amount = (balance * percentage / 100).toFixed(6)
  depositAmount.value = amount
}

const setMaxDeposit = () => {
  depositAmount.value = farmStore.usdtBalance
}

const handleDeposit = async () => {
  if (!isDepositValid.value || !walletStore.isConnected) return

  transactionModalTitle.value = t('savings.depositTransaction')
  showTransactionModal.value = true
  currentTransactionStep.value = 0
  transactionStatus.value = 'pending'

  try {
    const amount = parseFloat(depositAmount.value)
    const amountWei = parseUnits(amount.toString(), 6) // USDT has 6 decimals
    
    // Step 1: Check and approve USDT if needed
    transactionStatus.value = 'loading'
    
    const usdtContract = contractService.getUSDTContract(true)
    const farmContract = contractService.getFarmVaultContract(true)
    
    if (!usdtContract || !farmContract) {
      throw new Error('Contract not available')
    }
    
    const farmAddress = await farmContract.getAddress()
    const allowance = await usdtContract.allowance(walletStore.address, farmAddress)
    
    // Check and approve USDT if needed
    if (allowance < amountWei) {
      const approveTx = await usdtContract.approve(farmAddress, amountWei)
      await approveTx.wait()
    }
    
    currentTransactionStep.value = 1
    
    // Step 2: Execute deposit
    const depositTx = await farmContract.deposit(amountWei)
    currentTransactionStep.value = 2
    const receipt = await depositTx.wait()
    
    transactionHash.value = receipt.hash
    currentTransactionStep.value = 3
    transactionStatus.value = 'success'
    
    // Reset form and refresh data
    depositAmount.value = ''
    await farmStore.fetchFarmData()
    await farmStore.fetchUserFarmData()
    ElMessage.success(t('farm.depositSuccess'))
  } catch (error: any) {
    transactionStatus.value = 'error'
    transactionError.value = error.message || t('farm.depositFailed')
    console.error('Deposit failed:', error)
  }
}

const handleWithdrawAmountChange = (value: string) => {
  // Remove non-numeric characters except decimal point
  const cleanValue = value.replace(/[^0-9.]/g, '')
  withdrawAmount.value = cleanValue
}

const setWithdrawPercentage = (percentage: number) => {
  const balance = parseFloat(farmStore.depositedAmount)
  const amount = (balance * percentage / 100).toFixed(6)
  withdrawAmount.value = amount
}

const setMaxWithdraw = () => {
  withdrawAmount.value = farmStore.depositedAmount
}

const handleWithdraw = async () => {
  if (!walletStore.isConnected) return

  transactionModalTitle.value = t('savings.withdrawTransaction')
  showTransactionModal.value = true
  currentTransactionStep.value = 1
  transactionStatus.value = 'pending'

  try {
    const amount = parseFloat(withdrawAmount.value)
    transactionStatus.value = 'loading'
    
    const farmContract = contractService.getFarmVaultContract(true)
    if (!farmContract) {
      throw new Error('Farm contract not available')
    }

    // 如果勾选了withdrawCINA但没有输入金额，只执行claim
    if (withdrawCINA.value && (!withdrawAmount.value || amount === 0)) {
      if (parseFloat(farmStore.pendingCINA) > 0) {
        // Execute getReward to claim CINA rewards
        const claimTx = await farmContract.getReward()
        currentTransactionStep.value = 2
        const receipt = await claimTx.wait()
        
        transactionHash.value = receipt.hash
        transactionStatus.value = 'success'
        ElMessage.success(t('farm.claimSuccess'))
      }
    } else {
      // 执行USDT提现
      const amountWei = parseUnits(amount.toString(), 6) // USDT has 6 decimals
      // Execute withdraw with isClaim=false (only withdraw, don't claim rewards)
      const withdrawTx = await farmContract.withdraw(amountWei, withdrawCINA.value?1:0)
      currentTransactionStep.value = 2
      const receipt = await withdrawTx.wait()
      
      transactionHash.value = receipt.hash
      transactionStatus.value = 'success'
      ElMessage.success(t('farm.withdrawSuccess'))
    }

    currentTransactionStep.value = 3
    withdrawAmount.value = ''
    withdrawCINA.value = false // 重置开关状态
    
    // Refresh data
    await farmStore.fetchFarmData()
    await farmStore.fetchUserFarmData()
  } catch (error: any) {
    transactionStatus.value = 'error'
    transactionError.value = error.message || t('farm.withdrawFailed')
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

// Lifecycle
onMounted(async () => {
  if (walletStore.isConnected) {
    await farmStore.fetchFarmData()
  }
})

// Watch for wallet connection changes
watch(
  () => walletStore.isConnected,
  async (connected) => {
    if (connected) {
      await farmStore.fetchFarmData()
    }
  }
)

// Watch for tab changes and reset input fields
watch(activeTab, (newTab) => {
  // Reset input amounts when switching tabs
  depositAmount.value = ''
  withdrawAmount.value = ''
})
</script>

<style scoped>
.farm {
  @apply min-h-screen bg-gray-50 dark:bg-gray-900;
}

.farm-content {
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
  @apply text-2xl font-bold text-gray-700 dark:text-white mb-2 flex items-center justify-between gap-2;
}

.token-icon {
  @apply w-8 h-8 rounded-full object-cover;
}

.animated-number {
  @apply flex items-center;
}

.card-value .animated-number {
  @apply flex-1;
}

.card-actions {
  @apply mt-4;
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

.farm-tabs {
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

.max-button {
  @apply text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300;
}

.quick-amounts {
  @apply flex space-x-2;
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
  @apply font-medium text-gray-600 dark:text-white;
}

.preview-row.fee .preview-value {
  @apply text-red-600 dark:text-red-400;
}

.liquidity-value {
  @apply text-yellow-600 dark:text-yellow-400 font-medium;
}

.fee-amount {
  @apply text-red-600 dark:text-red-400;
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
  .farm-content {
    @apply px-4 py-6;
  }

  .overview-grid {
    @apply grid-cols-1 gap-4;
  }
}
</style>