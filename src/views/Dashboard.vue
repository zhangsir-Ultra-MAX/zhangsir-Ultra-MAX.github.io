<template>
  <div class="dashboard">
    <!-- Header Section -->
    <div class="dashboard-header">
      <div class="header-content">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
            {{ $t('dashboard.title') }}
          </h1>
          <p class="text-gray-600 dark:text-gray-400 mt-2">
            {{ $t('dashboard.subtitle') }}
          </p>
        </div>
        
        <div v-if="walletStore.isConnected" class="header-actions">
          <el-button type="primary" @click="refreshData" :loading="refreshing">
            <el-icon class="mr-2">
              <Refresh />
            </el-icon>
            {{ $t('common.refresh') }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- Wallet Connection Prompt -->
    <div v-if="!walletStore.isConnected" class="connection-prompt">
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
    </div>

    <!-- Dashboard Content -->
    <div v-else class="dashboard-content">
      <!-- Portfolio Overview -->
      <div class="portfolio-section">
        <h2 class="section-title">
          {{ $t('dashboard.portfolio') }}
        </h2>
        
        <div class="stats-grid">
          <!-- Total Value -->
          <!-- <div class="stat-card primary">
            <div class="stat-header">
              <h3 class="stat-title">{{ $t('dashboard.totalValue') }}</h3>
              <el-icon class="stat-icon">
                <TrendCharts />
              </el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">
                ${{ formatNumber(totalPortfolioValue) }}
              </div>
              <div class="stat-change" :class="portfolioChange >= 0 ? 'positive' : 'negative'">
                <el-icon>
                  <ArrowUp v-if="portfolioChange >= 0" />
                  <ArrowDown v-else />
                </el-icon>
                {{ Math.abs(portfolioChange).toFixed(2) }}%
              </div>
            </div>
          </div> -->

          <!-- Savings Balance -->
          <div class="stat-card primary">
            <div class="stat-header">
              <h3 class="stat-title">{{ $t('dashboard.savingsLiquidity') }}</h3>
              <el-icon class="stat-icon">
                <Wallet />
              </el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">
                {{ formatNumber(savingsStore.totalAssets, 6) }} WRMB
              </div>
              <div class="stat-subtitle">
                ≈ ${{ formatNumber(parseFloat(savingsStore.totalAssets) * 0.14) }}
              </div>
            </div>
          </div>

          <!-- Active Bonds -->
          <div class="stat-card">
            <div class="stat-header">
              <h3 class="stat-title">{{ $t('dashboard.activeBonds') }}</h3>
              <el-icon class="stat-icon">
                <Document />
              </el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">
                {{ activeBondsCount }}
              </div>
              <div class="stat-subtitle">
                ${{ formatNumber(totalBondsValue) }} {{ $t('dashboard.invested') }}
              </div>
            </div>
          </div>

          <!-- Current APY -->
          <div class="stat-card">
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
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="actions-section">
        <h2 class="section-title">
          {{ $t('dashboard.quickActions') }}
        </h2>
        
        <div class="actions-grid">
          <router-link to="/savings" class="action-card">
            <div class="action-icon savings">
              <el-icon><Wallet /></el-icon>
            </div>
            <div class="action-content">
              <h3 class="action-title">{{ $t('navigation.savings') }}</h3>
              <p class="action-description">{{ $t('dashboard.savingsDescription') }}</p>
            </div>
            <el-icon class="action-arrow">
              <ArrowRight />
            </el-icon>
          </router-link>

          <router-link to="/wrap" class="action-card">
            <div class="action-icon wrap">
              <el-icon><Switch /></el-icon>
            </div>
            <div class="action-content">
              <h3 class="action-title">{{ $t('navigation.wrap') }}</h3>
              <p class="action-description">{{ $t('dashboard.wrapDescription') }}</p>
            </div>
            <el-icon class="action-arrow">
              <ArrowRight />
            </el-icon>
          </router-link>

          <router-link to="/bonds" class="action-card">
            <div class="action-icon bonds">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="action-content">
              <h3 class="action-title">{{ $t('navigation.bonds') }}</h3>
              <p class="action-description">{{ $t('dashboard.bondsDescription') }}</p>
            </div>
            <el-icon class="action-arrow">
              <ArrowRight />
            </el-icon>
          </router-link>
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
import { ref, computed, onMounted, watch } from 'vue'
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

const { t } = useI18n()
const walletStore = useWalletStore()
const savingsStore = useSavingsStore()

const refreshing = ref(false)

// Mock data for demonstration
const portfolioChange = ref(2.34)
const activeBondsCount = ref(3)
const totalBondsValue = ref(15000)
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

const totalPortfolioValue = computed(() => {
  return parseFloat(savingsStore.userAssetValue) + totalBondsValue.value
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

.actions-grid {
  @apply grid grid-cols-1 md:grid-cols-3 gap-6;
}

.action-card {
  @apply bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-all duration-200 hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600;
  text-decoration: none;
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