<template>
  <PullToRefresh
    :is-pulling="isPulling"
    :is-refreshing="isRefreshing"
    :pull-distance="pullDistance"
    :can-refresh="canRefresh"
  >
    <div class="bonds">
    <div class="bonds-content">
      <!-- Pool Overview -->
      <div class="pool-overview">
        <h2 class="section-title">
          {{ $t('bonds.poolOverview') }}
        </h2>
        
        <div class="overview-grid">
          <div class="overview-card">
            <div class="card-header">
              <h3 class="card-title">{{ $t('bonds.totalPoolSize') }}</h3>
              <el-icon class="card-icon">
                <Wallet />
              </el-icon>
            </div>
            <div class="card-value">
              {{ formatNumber(poolStats.totalSize) }} USDT
            </div>
            <div class="card-subtitle">
              {{ $t('bonds.totalCapacity') }}
            </div>
          </div>

          <div class="overview-card">
            <div class="card-header">
              <h3 class="card-title">{{ $t('bonds.activeBonds') }}</h3>
              <el-icon class="card-icon">
                <Document />
              </el-icon>
            </div>
            <div class="card-value">
              {{ poolStats.activeBonds }}
            </div>
            <div class="card-subtitle">
              {{ $t('bonds.totalBonds') }}
            </div>
          </div>

          <div class="overview-card highlight">
            <div class="card-header">
              <h3 class="card-title">{{ $t('bonds.currentRate') }}</h3>
              <el-icon class="card-icon">
                <TrendCharts />
              </el-icon>
            </div>
            <div class="card-value">
              {{ formatNumber(poolStats.interestRate) }}%
            </div>
            <div class="card-subtitle">
              {{ $t('bonds.annualRate') }}
            </div>
          </div>

          <div class="overview-card">
            <div class="card-header">
              <h3 class="card-title">{{ $t('bonds.availableCapacity') }}</h3>
              <el-icon class="card-icon">
                <DataAnalysis />
              </el-icon>
            </div>
            <div class="card-value">
              {{ formatNumber(poolStats.availableCapacity) }} USDT
            </div>
            <div class="card-subtitle">
              {{ formatNumber((poolStats.availableCapacity / poolStats.totalSize) * 100) }}% {{ $t('bonds.remaining') }}
            </div>
          </div>
        </div>
      </div>

      <!-- Bond Subscription -->
      <div class="subscription-section">
        <div class="section-header">
          <h2 class="section-title">
            {{ $t('bonds.subscribe') }}
          </h2>
        </div>
        
        <div class="subscription-card">
          <div class="subscription-form">
            <div class="form-header">
              <h3 class="form-title">{{ $t('bonds.subscribeWithUSDT') }}</h3>
              <div class="balance-info">
                <span class="balance-label">{{ $t('bonds.usdtBalance') }}:</span>
                <span class="balance-value">{{ formatNumber(usdtBalance) }} USDT</span>
              </div>
            </div>

            <div class="input-section">
              <div class="input-group">
                <el-input
                  v-model="subscriptionAmount"
                  :placeholder="$t('bonds.enterAmount')"
                  size="large"
                  class="amount-input"
                  @input="handleSubscriptionAmountChange"
                >
                  <template #suffix>
                    <span class="input-suffix">USDT</span>
                  </template>
                </el-input>
                <el-button
                  text
                  @click="setMaxSubscription"
                  class="max-button"
                >
                  {{ $t('common.max') }}
                </el-button>
              </div>
              
              <!-- Quick Amount Buttons -->
              <div class="quick-amounts">
                <el-button
                  v-for="amount in [100, 500, 1000, 5000]"
                  :key="amount"
                  size="small"
                  @click="setSubscriptionAmount(amount)"
                >
                  {{ amount }} USDT
                </el-button>
              </div>
            </div>

            <!-- Bond Terms -->
            <div class="bond-terms">
              <h4 class="terms-title">{{ $t('bonds.bondTerms') }}</h4>
              <div class="terms-grid">
                <div class="term-item">
                  <span class="term-label">{{ $t('bonds.duration') }}</span>
                  <span class="term-value">{{ bondTerms.duration }} {{ $t('bonds.days') }}</span>
                </div>
                <div class="term-item">
                  <span class="term-label">{{ $t('bonds.interestRate') }}</span>
                  <span class="term-value">{{ formatNumber(bondTerms.interestRate) }}%</span>
                </div>
                <div class="term-item">
                  <span class="term-label">{{ $t('bonds.minimumAmount') }}</span>
                  <span class="term-value">{{ formatNumber(bondTerms.minimumAmount) }} USDT</span>
                </div>
                <div class="term-item">
                  <span class="term-label">{{ $t('bonds.maximumAmount') }}</span>
                  <span class="term-value">{{ formatNumber(bondTerms.maximumAmount) }} USDT</span>
                </div>
              </div>
            </div>

            <!-- Subscription Preview -->
            <div v-if="subscriptionPreview" class="preview-section">
              <h4 class="preview-title">{{ $t('bonds.preview') }}</h4>
              <div class="preview-details">
                <div class="preview-row">
                  <span>{{ $t('bonds.principalAmount') }}</span>
                  <span class="preview-value">${{ formatNumber(subscriptionPreview?.principal || '0') }}</span>
                </div>
                <div class="preview-row">
                  <span>{{ $t('bonds.wrmbReceived') }}</span>
                  <span class="preview-value">{{ formatNumber(subscriptionPreview?.wrmbAmount || '0') }} WRMB</span>
                </div>
                <div class="preview-row">
                  <span>{{ $t('bonds.maturityDate') }}</span>
                  <span class="preview-value">{{ formatDate(subscriptionPreview?.maturityDate || 0) }}</span>
                </div>
                <div class="preview-row">
                  <span>{{ $t('bonds.expectedReturn') }}</span>
                  <span class="preview-value highlight">{{ formatNumber(subscriptionPreview?.expectedReturn || '0') }} WRMB</span>
                </div>
              </div>
            </div>

            <el-button
              type="primary"
              size="large"
              :loading="subscriptionInProgress"
              :disabled="!isSubscriptionValid"
              @click="handleSubscription"
              class="action-button"
            >
              {{ $t('bonds.subscribeBond') }}
            </el-button>
          </div>
        </div>
      </div>

      <!-- User Bonds -->
      <div class="user-bonds-section">
        <div class="section-header">
          <h2 class="section-title">
            {{ $t('bonds.yourBonds') }}
          </h2>
          <div class="bonds-filter">
            <el-select v-model="bondsFilter" size="small">
              <el-option :label="$t('bonds.allBonds')" value="all" />
              <el-option :label="$t('bonds.activeBonds')" value="active" />
              <el-option :label="$t('bonds.maturedBonds')" value="matured" />
            </el-select>
          </div>
        </div>
        
        <div class="bonds-list">
          <div v-if="filteredUserBonds.length === 0" class="empty-state">
            <el-icon class="text-4xl text-gray-400 mb-2">
              <Document />
            </el-icon>
            <p class="text-gray-500 dark:text-gray-400">
              {{ $t('bonds.noBonds') }}
            </p>
          </div>
          
          <div
            v-for="bond in filteredUserBonds"
            :key="bond.bondId"
            class="bond-card"
            :class="{ 'matured': bond.isMatured, 'active': bond.isActive }"
          >
            <div class="bond-header">
              <div class="bond-id">
                <span class="id-label">{{ $t('bonds.bondId') }}</span>
                <span class="id-value">#{{ bond.bondId }}</span>
              </div>
              <div class="bond-status">
                <el-tag
                  :type="getBondStatusType(bond)"
                  size="small"
                >
                  {{ getBondStatusText(bond) }}
                </el-tag>
              </div>
            </div>
            
            <div class="bond-details">
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">{{ $t('bonds.principal') }}</span>
                  <span class="detail-value">{{ formatNumber(bond.principal) }} USDT</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">{{ $t('bonds.wrmbAmount') }}</span>
                  <span class="detail-value">{{ formatNumber(bond.wrmbAmount) }} WRMB</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">{{ $t('bonds.interestRate') }}</span>
                  <span class="detail-value">{{ formatNumber(bond.interestRate) }}%</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">{{ $t('bonds.subscribeDate') }}</span>
                  <span class="detail-value">{{ formatDate(bond.subscribeTime) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">{{ $t('bonds.maturityDate') }}</span>
                  <span class="detail-value">{{ formatDate(bond.maturityTime) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">{{ $t('bonds.currentValue') }}</span>
                  <span class="detail-value highlight">{{ formatNumber(calculateCurrentValue(bond)) }} USDT</span>
                </div>
              </div>
            </div>
            
            <div class="bond-actions">
              <div class="progress-info">
                <div class="progress-bar">
                  <div 
                    class="progress-fill"
                    :style="{ width: `${getBondProgress(bond)}%` }"
                  ></div>
                </div>
                <span class="progress-text">
                  {{ getBondProgress(bond) }}% {{ $t('bonds.completed') }}
                </span>
              </div>
              
              <el-button
                v-if="bond.isMatured"
                type="primary"
                size="small"
                @click="handleRedeem(bond)"
                :loading="redeemInProgress[bond.bondId]"
              >
                {{ $t('bonds.redeem') }}
              </el-button>
              
              <el-button
                v-else
                size="small"
                disabled
              >
                {{ getRemainingTime(bond.maturityTime) }}
              </el-button>
            </div>
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
      :gas-info="gasInfo"
      :transaction-hash="transactionHash"
      :error-message="transactionError"
      @close="handleTransactionModalClose"
      @retry="handleTransactionRetry"
    /></div>
  </PullToRefresh>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import {
  Refresh,
  Wallet,
  Document,
  TrendCharts,
  DataAnalysis
} from '@element-plus/icons-vue'

import PullToRefresh from '@/components/common/PullToRefresh.vue'
import TransactionModal from '@/components/common/TransactionModal.vue'
import { useWalletStore } from '@/stores/wallet'
import { formatNumber, formatDate } from '@/utils/format'
import { debounce } from '@/utils/debounce'
import { contractService } from '@/services/contracts'
import { parseUnits, formatUnits } from 'ethers'
import { usePullToRefresh } from '@/composables/usePullToRefresh'

interface BondInfo {
  bondId: number
  principal: string
  wrmbAmount: string
  subscribeTime: number
  maturityTime: number
  interestRate: string
  isActive: boolean
  isMatured: boolean
}

interface BondPreview {
  principal: string
  wrmbAmount: string
  maturityDate: number
  expectedReturn: string
}

interface GasInfo {
  gasPrice: string
  gasLimit: string
  estimatedFee: string
  maxFee: string
}

const { t } = useI18n()
const walletStore = useWalletStore()

const loading = ref(false)
const subscriptionAmount = ref('')
const subscriptionPreview = ref<BondPreview | null>(null)
const subscriptionInProgress = ref(false)
const bondsFilter = ref('all')
const redeemInProgress = ref<Record<number, boolean>>({})
const needsApproval = ref(false)
const approvalInProgress = ref(false)

// Contract data
const usdtBalance = ref('0')
const poolStats = ref({
  totalSize: 0,
  activeBonds: 0,
  interestRate: 0,
  availableCapacity: 0
})

const bondTerms = ref({
  duration: 0,
  interestRate: 0,
  minimumAmount: 0,
  maximumAmount: 0
})

const userBonds = ref<BondInfo[]>([])
const usdtAllowance = ref('0')

// Transaction Modal
const showTransactionModal = ref(false)
const transactionModalTitle = ref('')
const currentTransactionStep = ref(0)
const transactionStatus = ref<'pending' | 'loading' | 'success' | 'error'>('pending')
const transactionHash = ref('')
const transactionError = ref('')
const gasInfo = ref<GasInfo | undefined>(undefined)

const transactionSteps = ref([
  { label: t('transaction.approve'), description: t('transaction.approveDescription') },
  { label: t('transaction.confirm'), description: t('transaction.confirmDescription') },
  { label: t('transaction.complete'), description: t('transaction.completeDescription') }
])

const transactionDetails = computed(() => {
  const details = []
  
  if (subscriptionAmount.value && subscriptionPreview.value) {
    details.push(
      { label: t('bonds.subscriptionAmount'), value: `$${subscriptionAmount.value}`, highlight: true },
      { label: t('bonds.wrmbReceived'), value: `${subscriptionPreview.value?.wrmbAmount || '0'} WRMB` },
      { label: t('bonds.expectedReturn'), value: `$${subscriptionPreview.value?.expectedReturn || '0'} WRMB` }
    )
  }
  
  return details
})

const filteredUserBonds = computed(() => {
  switch (bondsFilter.value) {
    case 'active':
      return userBonds.value.filter(bond => bond.isActive)
    case 'matured':
      return userBonds.value.filter(bond => bond.isMatured)
    default:
      return userBonds.value
  }
})

const isSubscriptionValid = computed(() => {
  const amount = parseFloat(subscriptionAmount.value)
  return amount >= bondTerms.value.minimumAmount && 
         amount <= bondTerms.value.maximumAmount && 
         amount <= parseFloat(usdtBalance.value) &&
         walletStore.isConnected
})

// Contract interaction functions
const fetchUSDTBalance = async () => {
  try {
    if (!walletStore.isConnected || !walletStore.address) return
    
    const usdtContract = contractService.getUSDTContract()
    if (!usdtContract) return
    
    const balance = await usdtContract.balanceOf(walletStore.address)
    usdtBalance.value = formatUnits(balance, 6) // USDT has 6 decimals
  } catch (error) {
    console.error('Failed to fetch USDT balance:', error)
  }
}

const fetchUSDTAllowance = async () => {
  try {
    if (!walletStore.isConnected || !walletStore.address) return
    
    const usdtContract = contractService.getUSDTContract()
    const addresses = contractService.getAddresses()
    if (!usdtContract || !addresses.BOND_POOL) return
    
    const allowance = await usdtContract.allowance(walletStore.address, addresses.BOND_POOL)
    usdtAllowance.value = formatUnits(allowance, 6)
  } catch (error) {
    console.error('Failed to fetch USDT allowance:', error)
  }
}

const fetchPoolStats = async () => {
  try {
    const bondPoolContract = contractService.getBondPoolContract()
    if (!bondPoolContract) return
    
    const [totalSize, activeBonds, availableCapacity] = await bondPoolContract.getPoolStats()
    const config = await bondPoolContract.poolConfig()
    
    poolStats.value = {
      totalSize: parseFloat(formatUnits(totalSize, 6)),
      activeBonds: parseFloat(activeBonds),
      interestRate: parseFloat(formatUnits(config.interestRate, 2)), // Assuming 18 decimals for percentage
      availableCapacity: parseFloat(formatUnits(availableCapacity, 6))
    }
  } catch (error) {
    console.error('Failed to fetch pool stats:', error)
  }
}

const fetchBondTerms = async () => {
  try {
    const bondPoolContract = contractService.getBondPoolContract()
    if (!bondPoolContract) return
    
    const config = await bondPoolContract.poolConfig()

    bondTerms.value = {
      duration: parseFloat(config.bondDuration) / (24 * 60 * 60), // Convert seconds to days
      interestRate: parseFloat(formatUnits(config.interestRate, 2)),
      minimumAmount: parseFloat(formatUnits(config.minSubscription, 6)),
      maximumAmount: parseFloat(formatUnits(config.maxSubscription, 6))
    }
  } catch (error) {
    console.error('Failed to fetch bond terms:', error)
  }
}

const fetchUserBonds = async () => {
  try {
    if (!walletStore.isConnected || !walletStore.address) return
    
    const bondPoolContract = contractService.getBondPoolContract()
    if (!bondPoolContract) return
    
    const [bondIds, bondsData] = await bondPoolContract.getUserBonds(walletStore.address)
    
    const bonds: BondInfo[] = []
    for (let i = 0; i < bondIds.length; i++) {
      const bondId = Number(bondIds[i])
      const bondData = bondsData[i]
      
      const now = Date.now() / 1000 // Convert to seconds
      const isMatured = now >= Number(bondData.maturityTime)
      
      bonds.push({
        bondId,
        principal: formatUnits(bondData.principal, 6),
        wrmbAmount: formatUnits(bondData.wrmbAmount, 18),
        subscribeTime: Number(bondData.subscribeTime) * 1000, // Convert to milliseconds
        maturityTime: Number(bondData.maturityTime) * 1000,
        interestRate: formatUnits(bondData.interestRate, 2),
        isActive: bondData.isActive && !isMatured,
        isMatured
      })
    }
    
    userBonds.value = bonds
  } catch (error) {
    console.error('Failed to fetch user bonds:', error)
  }
}

const checkApprovalNeeded = async (amount: string) => {
  try {
    const amountBN = parseUnits(amount, 6)
    const allowanceBN = parseUnits(usdtAllowance.value, 6)
    needsApproval.value = allowanceBN < amountBN
  } catch (error) {
    console.error('Failed to check approval:', error)
    needsApproval.value = true
  }
}

// Generate subscription preview
const generateSubscriptionPreview = async (amount: string): Promise<BondPreview | null> => {
  const principal = parseFloat(amount)
  if (!principal || principal <= 0) return null
  
  try {
    const bondPoolContract = contractService.getBondPoolContract()
    if (!bondPoolContract) {
      // Fallback to calculation if contract not available
      const wrmbRate = 7.2 // 1 USDT = 0.96 WRMB
      const wrmbAmount = principal * wrmbRate
      const maturityDate = Date.now() + bondTerms.value.duration * 24 * 60 * 60 * 1000
      const expectedReturn = principal * (1 + bondTerms.value.interestRate / 100 * bondTerms.value.duration / 365)
      
      return {
        principal: principal.toFixed(2),
        wrmbAmount: wrmbAmount.toFixed(2),
        maturityDate,
        expectedReturn: expectedReturn.toFixed(2)
      }
    }
    
    const amountBN = parseUnits(amount, 6)
    const [wrmbAmount, maturityTime, expectedReturn] = await bondPoolContract.previewSubscription(amountBN)
    
    return {
      principal: principal.toFixed(2),
      wrmbAmount: formatUnits(wrmbAmount, 18),
      maturityDate: Number(maturityTime) * 1000, // Convert to milliseconds
      expectedReturn: formatUnits(expectedReturn, 18)
    }
  } catch (error) {
    console.error('Failed to generate subscription preview:', error)
    return null
  }
}

// Debounced preview function
const debouncedSubscriptionPreview = debounce(async (amount: string) => {
  subscriptionPreview.value = await generateSubscriptionPreview(amount)
  if (amount && parseFloat(amount) > 0) {
    await checkApprovalNeeded(amount)
  }
}, 500)

const handleSubscriptionAmountChange = (value: string) => {
  debouncedSubscriptionPreview(value)
}

const setMaxSubscription = () => {
  const maxAmount = Math.min(
    parseFloat(usdtBalance.value),
    bondTerms.value.maximumAmount,
    poolStats.value.availableCapacity
  )
  subscriptionAmount.value = maxAmount.toString()
  handleSubscriptionAmountChange(subscriptionAmount.value)
}

const setSubscriptionAmount = (amount: number) => {
  subscriptionAmount.value = amount.toString()
  handleSubscriptionAmountChange(subscriptionAmount.value)
}

const getBondStatusType = (bond: BondInfo) => {
  if (bond.isMatured) return 'success'
  if (bond.isActive) return 'primary'
  return 'info'
}

const getBondStatusText = (bond: BondInfo) => {
  if (bond.isMatured) return t('bonds.matured')
  if (bond.isActive) return t('bonds.active')
  return t('bonds.inactive')
}

const getBondProgress = (bond: BondInfo) => {
  const now = Date.now()
  const total = bond.maturityTime - bond.subscribeTime
  const elapsed = now - bond.subscribeTime
  return Math.min(100, Math.max(0, (elapsed / total) * 100))
}

const calculateCurrentValue = (bond: BondInfo) => {
  const principal = parseFloat(bond.principal)
  const rate = parseFloat(bond.interestRate) / 100
  const progress = getBondProgress(bond) / 100
  const duration = bondTerms.value.duration / 365 // Convert to years
  
  return principal * (1 + rate * duration * progress)
}

const getRemainingTime = (maturityTime: number) => {
  const now = Date.now()
  const remaining = maturityTime - now
  
  if (remaining <= 0) return t('bonds.matured')
  
  const days = Math.ceil(remaining / (24 * 60 * 60 * 1000))
  return `${days} ${t('bonds.daysRemaining')}`
}

const approveUSDT = async () => {
  try {
    approvalInProgress.value = true
    currentTransactionStep.value = 0
    transactionStatus.value = 'loading'
    
    const usdtContract = contractService.getUSDTContract(true)
    const addresses = contractService.getAddresses()
    if (!usdtContract || !addresses.BOND_POOL) {
      throw new Error('Contract not available')
    }
    
    const amountBN = parseUnits(subscriptionAmount.value, 6)
    const tx = await usdtContract.approve(addresses.BOND_POOL, amountBN)
    
    transactionHash.value = tx.hash
    await tx.wait()
    
    await fetchUSDTAllowance()
    needsApproval.value = false
    currentTransactionStep.value = 1
    
    ElMessage.success(t('bonds.approvalSuccess'))
  } catch (error: any) {
    transactionStatus.value = 'error'
    transactionError.value = error.message || t('bonds.approvalFailed')
    throw error
  } finally {
    approvalInProgress.value = false
  }
}

const subscribeBond = async () => {
  try {
    currentTransactionStep.value = 1
    transactionStatus.value = 'loading'
    
    const bondPoolContract = contractService.getBondPoolContract(true)
    if (!bondPoolContract) {
      throw new Error('Bond pool contract not available')
    }
    
    const amountBN = parseUnits(subscriptionAmount.value, 6)
    const tx = await bondPoolContract.subscribeBond(amountBN)
    
    transactionHash.value = tx.hash
    await tx.wait()
    
    currentTransactionStep.value = 2
    transactionStatus.value = 'success'
    
    // Refresh data
    await Promise.all([
      fetchUSDTBalance(),
      fetchUserBonds(),
      fetchPoolStats()
    ])
    
    // Reset form
    subscriptionAmount.value = ''
    subscriptionPreview.value = null
    needsApproval.value = false
    
    ElMessage.success(t('bonds.subscriptionSuccess'))
  } catch (error: any) {
    transactionStatus.value = 'error'
    transactionError.value = error.message || t('bonds.subscriptionFailed')
    throw error
  }
}

const handleSubscription = async () => {
  if (!isSubscriptionValid.value) return
  
  transactionModalTitle.value = t('bonds.subscriptionTransaction')
  showTransactionModal.value = true
  currentTransactionStep.value = 0
  transactionStatus.value = 'pending'
  subscriptionInProgress.value = true
  transactionHash.value = ''
  transactionError.value = ''
  
  try {
    // Check if approval is needed
    if (needsApproval.value) {
      await approveUSDT()
    }
    
    // Subscribe to bond
    await subscribeBond()
    
  } catch (error: any) {
    console.error('Subscription failed:', error)
    if (transactionStatus.value !== 'error') {
      transactionStatus.value = 'error'
      transactionError.value = error.message || t('bonds.subscriptionFailed')
    }
  } finally {
    subscriptionInProgress.value = false
  }
}

const handleRedeem = async (bond: BondInfo) => {
  if (!bond.isMatured) {
    ElMessage.warning(t('bonds.bondNotMatured'))
    return
  }
  
  redeemInProgress.value[bond.bondId] = true
  
  try {
    const bondPoolContract = contractService.getBondPoolContract(true)
    if (!bondPoolContract) {
      throw new Error('Bond pool contract not available')
    }
    
    const tx = await bondPoolContract.matureBond(bond.bondId)
    await tx.wait()
    
    // Refresh data
    await Promise.all([
      fetchUSDTBalance(),
      fetchUserBonds(),
      fetchPoolStats()
    ])
    
    ElMessage.success(t('bonds.redeemSuccess'))
  } catch (error: any) {
    console.error('Redemption failed:', error)
    ElMessage.error(error.message || t('bonds.redeemFailed'))
  } finally {
    redeemInProgress.value[bond.bondId] = false
  }
}

const handleTransactionModalClose = () => {
  showTransactionModal.value = false
  transactionHash.value = ''
  transactionError.value = ''
}

const handleTransactionRetry = () => {
  handleSubscription()
}

const refreshData = async () => {
  loading.value = true
  try {
    await Promise.all([
      fetchPoolStats(),
      fetchBondTerms()
    ])
    
    if (walletStore.isConnected && walletStore.address) {
      await Promise.all([
        fetchUSDTBalance(),
        fetchUSDTAllowance(),
        fetchUserBonds()
      ])
    }
  } catch (error) {
    console.error('Failed to refresh data:', error)
    ElMessage.error(t('common.dataLoadFailed'))
  } finally {
    loading.value = false
  }
}

// Watch for wallet connection changes
watch(
  () => walletStore.isConnected,
  async (isConnected) => {
    if (isConnected) {
      await refreshData()
    } else {
      // Clear user-specific data when disconnected
      usdtBalance.value = '0'
      usdtAllowance.value = '0'
      userBonds.value = []
      subscriptionAmount.value = ''
      subscriptionPreview.value = null
    }
  }
)

watch(
  () => walletStore.address,
  async (newAccount, oldAccount) => {
    if (newAccount && newAccount !== oldAccount) {
      await refreshData()
    }
  }
)

// Pull to refresh functionality
const { isRefreshing, pullDistance, isPulling, canRefresh } = usePullToRefresh({
  onRefresh: refreshData,
  enabled: true
})

onMounted(async () => {
  await refreshData()
})
</script>

<style scoped>
.bonds {
  @apply bg-gray-50 dark:bg-gray-900;
}

.bonds-content {
  @apply max-w-6xl mx-auto px-6 py-8 space-y-8;
}

.section-title {
  @apply text-2xl font-bold text-gray-900 dark:text-white mb-6;
}

.section-header {
  @apply flex items-center justify-between mb-6;
}

.overview-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6;
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
  @apply text-2xl font-bold text-gray-900 dark:text-white;
}

.overview-card.highlight .card-value {
  @apply text-white;
}

.card-subtitle {
  @apply text-sm text-gray-500 dark:text-gray-400 mt-1;
}

.overview-card.highlight .card-subtitle {
  @apply text-primary-100;
}

.subscription-card {
  @apply bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8;
}

.subscription-form {
  @apply max-w-2xl mx-auto;
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

.bond-terms {
  @apply bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6;
}

.terms-title {
  @apply text-lg font-semibold text-gray-900 dark:text-white mb-4;
}

.terms-grid {
  @apply grid grid-cols-2 gap-4;
}

.term-item {
  @apply flex flex-col;
}

.term-label {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.term-value {
  @apply font-medium text-gray-900 dark:text-white mt-1;
}

.preview-section {
  @apply bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6;
}

.preview-title {
  @apply text-lg font-semibold text-gray-900 dark:text-white mb-4;
}

.preview-details {
  @apply space-y-3;
}

.preview-row {
  @apply flex items-center justify-between;
}

.preview-value {
  @apply font-medium text-gray-900 dark:text-white;
}

.preview-value.highlight {
  @apply text-green-600 dark:text-green-400;
}

.action-button {
  @apply w-full;
}

.bonds-filter {
  @apply flex items-center space-x-4;
}

.bonds-list {
  @apply space-y-6;
}

.empty-state {
  @apply flex flex-col items-center justify-center py-12 text-center;
}

.bond-card {
  @apply bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-all duration-200 hover:shadow-md;
}

.bond-card.matured {
  @apply border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20;
}

.bond-card.active {
  @apply border-primary-200 dark:border-primary-700;
}

.bond-header {
  @apply flex items-center justify-between mb-4;
}

.bond-id {
  @apply flex items-center space-x-2;
}

.id-label {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.id-value {
  @apply font-medium text-gray-900 dark:text-white;
}

.detail-grid {
  @apply grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6;
}

.detail-item {
  @apply flex flex-col;
}

.detail-label {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.detail-value {
  @apply font-medium text-gray-900 dark:text-white mt-1;
}

.detail-value.highlight {
  @apply text-green-600 dark:text-green-400;
}

.bond-actions {
  @apply flex items-center justify-between;
}

.progress-info {
  @apply flex-1 mr-4;
}

.progress-bar {
  @apply w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2;
}

.progress-fill {
  @apply h-full bg-primary-500 transition-all duration-300;
}

.progress-text {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

@media (max-width: 768px) {
  .bonds-header {
    @apply px-4 py-6;
  }
  
  .header-content {
    @apply flex-col items-start space-y-4;
  }
  
  .bonds-content {
    @apply px-4 py-6;
  }
  
  .overview-grid {
    @apply grid-cols-1 gap-4;
  }
  
  .subscription-card {
    @apply p-6;
  }
  
  .subscription-form {
    @apply max-w-full;
  }
  
  .terms-grid {
    @apply grid-cols-1 gap-3;
  }
  
  .detail-grid {
    @apply grid-cols-1 gap-3;
  }
  
  .bond-actions {
    @apply flex-col items-stretch space-y-3;
  }
  
  .progress-info {
    @apply mr-0;
  }
}
</style>