<template>
  <div class="dashboard">
    <!-- Wallet Connection Prompt -->
    <!-- <div v-if="!walletStore.isConnected" class="connection-prompt">
      <div class="prompt-card">
        <el-icon class="text-6xl text-primary-500 mb-4">
          <Wallet />
        </el-icon>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {{ $t('dashboard.connectWallet') }}
        </h2>
        <p class="text-gray-600 dark:text-gray-400 mb-6 max-w-md text-center">
          {{ $t('dashboard.connectDescription') }}
        </p>
        <WalletConnect />
      </div>
    </div> -->

    <!-- Dashboard Content -->
    <div class="dashboard-content">
      <!-- Portfolio Overview -->
      <div class="portfolio-section">
        <h2 class="section-title">
          {{ $t('dashboard.portfolio') }}
        </h2>
        
        <div class="stats-grid">
          <!-- Total Value -->
          <router-link to="/wrap" class="stat-card primary">
            <div class="stat-header">
              <h3 class="stat-title">{{ $t('dashboard.totalValue') }}</h3>
              <el-icon class="stat-icon">
                <TrendCharts />
              </el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">
                {{ formatNumber(totalSRMBValue) }}
              </div>
              <div class="stat-change" :class="portfolioChange >= 0 ? 'positive' : 'negative'">
                <el-icon>
                  <ArrowUp v-if="portfolioChange >= 0" />
                  <ArrowDown v-else />
                </el-icon>
                {{ Math.abs(portfolioChange).toFixed(2) }}%
              </div>
            </div>
          </router-link>

          <!-- Savings Balance -->
          <router-link to="/savings" class="stat-card">
            <div class="stat-header">
              <h3 class="stat-title">WRMB {{ $t('dashboard.savingsLiquidity') }}</h3>
              <el-icon class="stat-icon">
                <Wallet />
              </el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">
                {{ formatNumber(savingsStore.totalAssets) }}
              </div>
              <div class="stat-subtitle">
                ≈ ${{ formatNumber(parseFloat(savingsStore.totalAssets) * 0.14) }}
              </div>
            </div>
          </router-link>

          <!-- Current APY -->
          <router-link to="/savings" class="stat-card">
            <div class="stat-header">
              <h3 class="stat-title">{{ $t('dashboard.currentAPY') }}</h3>
              <el-icon class="stat-icon">
                <DataAnalysis />
              </el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">
                {{ formatNumber(savingsStore.dynamicAPY) }}%
              </div>
              <div class="stat-subtitle">
                {{ $t('dashboard.annualReturn') }}
                <span class="text-sm text-green-600 dark:text-green-400">+{{ formatNumber(savingsStore.dynamicWRMB) }} WRMB</span>
              </div>
            </div>
          </router-link>
        </div>
      </div>

      <!-- Asset Allocation -->
      <div class="allocation-section">
        <div class="section-header">
          <h2 class="section-title">
            {{ $t('portfolio.assetAllocation') }}
          </h2>
          <div class="view-toggle">
            <el-radio-group v-model="allocationView" size="small">
              <el-radio-button label="chart">{{ $t('portfolio.chart') }}</el-radio-button>
              <el-radio-button label="table">{{ $t('portfolio.table') }}</el-radio-button>
            </el-radio-group>
          </div>
        </div>
        
        <div class="allocation-content">
          <div v-if="allocationView === 'chart'" class="chart-container">
            <div class="chart-wrapper">
              <!-- Pie Chart Placeholder -->
              <div class="pie-chart">
                <svg viewBox="0 0 200 200" class="w-full h-full">
                  <circle
                    v-for="(segment, index) in chartSegments"
                    :key="index"
                    cx="100"
                    cy="100"
                    r="80"
                    fill="none"
                    :stroke="segment.color"
                    stroke-width="20"
                    :stroke-dasharray="`${segment.length} ${314 - segment.length}`"
                    :stroke-dashoffset="segment.offset"
                    class="transition-all duration-500"
                  />
                </svg>
                <div class="chart-center">
                  <div class="center-value">${{ formatNumber(portfolioStats.totalValue) }}</div>
                  <div class="center-label">{{ $t('portfolio.totalValue') }}</div>
                </div>
              </div>
            </div>
            
            <div class="chart-legend">
              <div
                v-for="asset in assetAllocation"
                :key="asset.symbol"
                class="legend-item"
              >
                <div class="legend-color" :style="{ backgroundColor: asset.color }"></div>
                <div class="legend-info">
                  <div class="legend-name">{{ asset.name }}</div>
                  <div class="legend-details">
                    <span class="legend-value">${{ formatNumber(asset.value) }}</span>
                    <span class="legend-percentage">({{ formatNumber(asset.percentage) }}%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div v-else class="allocation-table">
            <el-table :data="assetAllocation" style="width: 100%">
              <el-table-column prop="name" :label="$t('portfolio.asset')" min-width="120">
                <template #default="{ row }">
                  <div class="asset-cell">
                    <div class="asset-color" :style="{ backgroundColor: row.color }"></div>
                    <div class="asset-info">
                      <div class="asset-name">{{ row.name }}</div>
                      <div class="asset-symbol">{{ row.symbol }}</div>
                    </div>
                  </div>
                </template>
              </el-table-column>
              
              <el-table-column prop="balance" :label="$t('portfolio.balance')" min-width="120">
                <template #default="{ row }">
                  {{ formatNumber(row.balance) }} {{ row.symbol }}
                </template>
              </el-table-column>
              
              <el-table-column prop="value" :label="$t('portfolio.value')" min-width="120">
                <template #default="{ row }">
                  ${{ formatNumber(row.value) }}
                </template>
              </el-table-column>
              
              <el-table-column prop="percentage" :label="$t('portfolio.allocation')" min-width="100">
                <template #default="{ row }">
                  <div class="percentage-cell">
                    <div class="percentage-bar">
                      <div 
                        class="percentage-fill"
                        :style="{ width: `${row.percentage}%`, backgroundColor: row.color }"
                      ></div>
                    </div>
                    <span class="percentage-text">{{ formatNumber(row.percentage) }}%</span>
                  </div>
                </template>
              </el-table-column>
              
              <el-table-column prop="change24h" :label="$t('portfolio.change24h')" min-width="100">
                <template #default="{ row }">
                  <div class="change-cell" :class="{ positive: row.change24h >= 0, negative: row.change24h < 0 }">
                    <el-icon>
                      <component :is="row.change24h >= 0 ? 'ArrowUp' : 'ArrowDown'" />
                    </el-icon>
                    {{ formatNumber(Math.abs(row.change24h)) }}%
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="activity-section">
        <div class="section-header">
          <h2 class="section-title">
            {{ $t('dashboard.recentActivity') }}
          </h2>
          <router-link to="/portfolio" class="view-all-link">
            {{ $t('dashboard.viewAll') }}
            <el-icon class="ml-1">
              <ArrowRight />
            </el-icon>
          </router-link>
        </div>
        
        <div class="activity-list">
          <div v-if="recentActivities.length === 0" class="empty-state">
            <el-icon class="text-4xl text-gray-400 mb-2">
              <Document />
            </el-icon>
            <p class="text-gray-500 dark:text-gray-400">
              {{ $t('dashboard.noActivity') }}
            </p>
          </div>
          
          <div
            v-for="activity in recentActivities.slice(0, 5)"
            :key="activity.id"
            class="activity-item"
          >
            <div class="activity-icon" :class="activity.type">
              <el-icon>
                <component :is="getActivityIcon(activity.type)" />
              </el-icon>
            </div>
            <div class="activity-content">
              <div class="activity-title">{{ activity.title }}</div>
              <div class="activity-description">{{ activity.description }}</div>
            </div>
            <div class="activity-meta">
              <div class="activity-amount" :class="activity.type">
                {{ activity.amount }}
              </div>
              <div class="activity-time">
                {{ formatTimeAgo(activity.timestamp) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Wallet,
  TrendCharts,
  Document,
  DataAnalysis,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  Switch,
  Refresh
} from '@element-plus/icons-vue'

import WalletConnect from '@/components/common/WalletConnect.vue'
import { useWalletStore } from '@/stores/wallet'
import { useSavingsStore } from '@/stores/savings'
import { formatNumber, formatTimeAgo } from '@/utils/format'
import { contractService } from '@/services/contracts'
import { formatUnits } from 'ethers'

interface AssetAllocation {
  name: string
  symbol: string
  balance: number
  value: number
  percentage: number
  color: string
  change24h: number
}

const { t } = useI18n()
const walletStore = useWalletStore()
const savingsStore = useSavingsStore()

const refreshing = ref(false)
const allocationView = ref('chart')

// Mock data for demonstration
const portfolioChange = ref(2.34)
const totalSRMBValue = ref('')

const portfolioStats = ref({
  totalValue: 25750.50,
  totalInvested: 24000.00,
  totalReturns: 1750.50,
  returnPercentage: 7.29,
  totalChange: 2.45,
  avgAPY: 8.2
})

const assetAllocation = ref<AssetAllocation[]>([
  {
    name: 'Savings Vault',
    symbol: 'sWRMB',
    balance: 12500,
    value: 15000,
    percentage: 58.3,
    color: '#6366f1',
    change24h: 1.2
  },
  {
    name: 'Bond Pool',
    symbol: 'WRMB',
    balance: 8000,
    value: 8500,
    percentage: 33.0,
    color: '#10b981',
    change24h: 0.8
  },
  {
    name: 'Wrapped Tokens',
    symbol: 'sWRMB',
    balance: 2000,
    value: 2250.50,
    percentage: 8.7,
    color: '#f59e0b',
    change24h: -0.5
  }
])

const recentActivities = ref([
  {
    id: 1,
    type: 'deposit',
    title: t('dashboard.depositSavings'),
    description: t('dashboard.depositDescription'),
    amount: '+1,000 WRMB',
    timestamp: Date.now() - 3600000
  },
  {
    id: 2,
    type: 'bond',
    title: t('dashboard.bondSubscription'),
    description: t('dashboard.bondDescription'),
    amount: '+500 USDT',
    timestamp: Date.now() - 7200000
  },
  {
    id: 3,
    type: 'wrap',
    title: t('dashboard.wrapTokens'),
    description: t('dashboard.wrapDescription'),
    amount: '200 sRMB → sWRMB',
    timestamp: Date.now() - 86400000
  }
])

const chartSegments = computed(() => {
  let offset = 0
  return assetAllocation.value.map(asset => {
    const length = (asset.percentage / 100) * 314 // 2π * 50 (radius)
    const segment = {
      length,
      offset: -offset,
      color: asset.color
    }
    offset += length
    return segment
  })
})

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'deposit':
    case 'withdraw':
      return Wallet
    case 'bond':
      return TrendCharts
    case 'wrap':
    case 'unwrap':
      return Switch
    default:
      return Document
  }
}

const refreshData = async () => {
  refreshing.value = true
  try {
    await Promise.all([
      savingsStore.fetchVaultData(),
      savingsStore.fetchUserBalances()
    ])

    const wrapManager = contractService.getWrapManagerContract()
    if (!wrapManager) return null
    const sRMBTVL = await wrapManager.getSRMBLiquidity();
    totalSRMBValue.value = formatUnits(sRMBTVL.toString(), 18).toString()
  } catch (error) {
    console.error('Failed to refresh data:', error)
  } finally {
    refreshing.value = false
  }
}

onMounted(async () => {
  if (walletStore.isConnected) {
    await refreshData()
  }
})

// Watch for wallet connection changes
watch(
  () => walletStore.isConnected,
  async (connected) => {
    if (connected) {
      await refreshData()
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
</script>

<style scoped>
.dashboard {
  @apply bg-gray-50 dark:bg-gray-900;
}

.dashboard-header {
  @apply bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-8;
}

.header-content {
  @apply max-w-7xl mx-auto flex items-center justify-between;
}

.header-actions {
  @apply flex items-center space-x-4;
}

.connection-prompt {
  @apply flex items-center justify-center min-h-96 px-6;
}

.prompt-card {
  @apply bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center max-w-md;
}

.dashboard-content {
  @apply max-w-7xl mx-auto px-6 py-8 space-y-8;
}

.section-title {
  @apply text-2xl font-bold text-gray-900 dark:text-white mb-6;
}

.section-header {
  @apply flex items-center justify-between mb-6;
}

.view-all-link {
  @apply flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors;
}

.stats-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6;
}

.stat-card {
  @apply bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-all duration-200 hover:shadow-md;
}

.stat-card.primary {
  @apply bg-gradient-to-br from-primary-500 to-primary-600 text-white border-primary-500;
}

.stat-header {
  @apply flex items-center justify-between mb-4;
}

.stat-title {
  @apply text-sm font-medium text-gray-600 dark:text-gray-400;
}

.stat-card.primary .stat-title {
  @apply text-primary-100;
}

.stat-icon {
  @apply text-xl text-gray-400;
}

.stat-card.primary .stat-icon {
  @apply text-primary-200;
}

.stat-value {
  @apply text-2xl font-bold text-gray-900 dark:text-white;
}

.stat-card.primary .stat-value {
  @apply text-white;
}

.stat-subtitle {
  @apply text-sm text-gray-500 dark:text-gray-400 mt-1;
}

.stat-card.primary .stat-subtitle {
  @apply text-primary-100;
}

.stat-change {
  @apply flex items-center text-sm font-medium mt-2;
}

.stat-change.positive {
  @apply text-green-600 dark:text-green-400;
}

.stat-change.negative {
  @apply text-red-600 dark:text-red-400;
}

.stat-card.primary .stat-change {
  @apply text-primary-100;
}

.allocation-section {
  @apply space-y-6;
}

.view-toggle {
  @apply flex items-center;
}

.allocation-content {
  @apply bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-2;
}

.chart-container {
  @apply flex flex-col lg:flex-row items-center space-y-8 lg:space-y-0 lg:space-x-12;
}

.chart-wrapper {
  @apply flex-shrink-0;
}

.pie-chart {
  @apply relative w-64 h-64;
}

.chart-center {
  @apply absolute inset-0 flex flex-col items-center justify-center;
}

.center-value {
  @apply text-2xl font-bold text-gray-900 dark:text-white;
}

.center-label {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.chart-legend {
  @apply flex-1 space-y-4;
}

.legend-item {
  @apply flex items-center space-x-4;
}

.legend-color {
  @apply w-4 h-4 rounded-full;
}

.legend-info {
  @apply flex-1;
}

.legend-name {
  @apply font-medium text-gray-900 dark:text-white;
}

.legend-details {
  @apply text-sm text-gray-600 dark:text-gray-400 mt-1;
}

.legend-value {
  @apply font-medium;
}

.legend-percentage {
  @apply ml-2;
}

.allocation-table {
  @apply overflow-auto rounded-lg shadow-sm;
}

.allocation-table :deep(.el-table) {
  @apply bg-white dark:bg-gray-800 border-0 rounded-lg;
}

.allocation-table :deep(.el-table__header) {
  @apply bg-white dark:bg-gray-700;
}

.allocation-table :deep(.el-table__body) {
  @apply bg-white dark:bg-gray-800;
}

.allocation-table :deep(.el-table__cell) {
  @apply border-b border-gray-100 dark:border-gray-600 px-3 py-4 text-sm;
}

.allocation-table :deep(.el-table__header .el-table__cell) {
  @apply bg-white dark:bg-gray-700 border-b border-gray-600 text-gray-500 dark:text-gray-400 font-semibold text-xs uppercase tracking-wider p-3;
}

.allocation-table :deep(.el-table__header-wrapper) {
  @apply bg-white dark:bg-gray-700 rounded-t-lg;
}

.allocation-table :deep(.el-table__header th) {
  @apply bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400;
}

.allocation-table :deep(.el-table__row) {
  @apply transition-colors duration-200 ease-in-out;
}

.allocation-table :deep(.el-table__row:hover) {
  @apply bg-gray-50 dark:bg-gray-700;
}

.allocation-table :deep(.el-table__row:last-child .el-table__cell) {
  @apply border-b-0;
}

.asset-cell {
  @apply flex items-center space-x-3;
}

.asset-color {
  @apply w-4 h-4 rounded-full shadow-md;
}

.asset-info {
  @apply flex flex-col;
}

.asset-name {
  @apply font-semibold text-gray-900 dark:text-white text-sm leading-snug;
}

.asset-symbol {
  @apply text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5;
}

.percentage-cell {
  @apply flex items-center space-x-3;
}

.percentage-bar {
  @apply w-20 h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner;
}

.percentage-fill {
  @apply h-full transition-all duration-500 ease-out rounded-full;
}

.percentage-text {
  @apply text-sm font-semibold text-gray-700 dark:text-gray-300 min-w-11 text-right;
}

.change-cell {
  @apply flex items-center space-x-1.5 font-semibold text-xs;
}

.change-cell.positive {
  @apply text-green-600 dark:text-green-400;
}

.change-cell.negative {
  @apply text-red-600 dark:text-red-400;
}

.change-cell .el-icon {
  @apply text-sm font-bold;
}

.actions-grid {
  @apply grid grid-cols-1 md:grid-cols-3 gap-6;
}

.action-card {
  @apply bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-all duration-200 hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600 no-underline;
}

.action-icon {
  @apply w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl mb-4;
}

.action-icon.savings {
  @apply bg-gradient-to-br from-blue-500 to-blue-600;
}

.action-icon.wrap {
  @apply bg-gradient-to-br from-purple-500 to-purple-600;
}

.action-icon.bonds {
  @apply bg-gradient-to-br from-green-500 to-green-600;
}

.action-title {
  @apply text-lg font-semibold text-gray-900 dark:text-white mb-2;
}

.action-description {
  @apply text-gray-600 dark:text-gray-400 text-sm;
}

.action-arrow {
  @apply text-gray-400 group-hover:text-primary-500 transition-colors mt-4;
}

.activity-list {
  @apply bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700;
}

.empty-state {
  @apply flex flex-col items-center justify-center py-12 text-center;
}

.activity-item {
  @apply flex items-center p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors;
}

.activity-icon {
  @apply w-10 h-10 rounded-lg flex items-center justify-center text-white mr-4;
}

.activity-icon.deposit {
  @apply bg-green-500;
}

.activity-icon.withdraw {
  @apply bg-red-500;
}

.activity-icon.bond {
  @apply bg-blue-500;
}

.activity-icon.wrap,
.activity-icon.unwrap {
  @apply bg-purple-500;
}

.activity-content {
  @apply flex-1;
}

.activity-title {
  @apply font-medium text-gray-900 dark:text-white;
}

.activity-description {
  @apply text-sm text-gray-600 dark:text-gray-400 mt-1;
}

.activity-meta {
  @apply text-right;
}

.activity-amount {
  @apply font-medium;
}

.activity-amount.deposit {
  @apply text-green-600 dark:text-green-400;
}

.activity-amount.withdraw {
  @apply text-red-600 dark:text-red-400;
}

.activity-amount.bond,
.activity-amount.wrap,
.activity-amount.unwrap {
  @apply text-gray-900 dark:text-white;
}

.activity-time {
  @apply text-xs text-gray-500 dark:text-gray-400 mt-1;
}

@media (max-width: 768px) {
  .dashboard-header {
    @apply px-4 py-6;
  }
  
  .header-content {
    @apply flex-col items-start space-y-4;
  }
  
  .dashboard-content {
    @apply px-4 py-6;
  }
  
  .stats-grid {
    @apply grid-cols-1 gap-4;
  }
  
  .actions-grid {
    @apply grid-cols-1 gap-4;
  }
  
  .activity-item {
    @apply p-4;
  }
}
</style>