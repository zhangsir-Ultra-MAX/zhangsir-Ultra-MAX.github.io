<template>
  <div class="wallet-connect">
    <!-- Connected State -->
    <div v-if="walletStore.isConnected" class="flex items-center space-x-3">
      <!-- Balance Display -->
      <!-- <div class="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <el-icon class="text-primary-500">
          <Wallet />
        </el-icon>
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
          {{ formatBalance(walletStore.balance) }} ETH
        </span>
      </div> -->

      <!-- Account Dropdown -->
      <el-dropdown @command="handleAccountAction" trigger="click">
        <el-button class="account-button">
          <div class="flex items-center space-x-2">
            <div class="w-8 h-6 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
              <span class="text-white text-xs font-bold">
                ..{{ walletStore.shortAddress.slice(-2) }}
              </span>
            </div>
            <span class="hidden sm:inline text-sm font-medium">
              {{ walletStore.shortAddress }}
            </span>
            <el-icon class="text-gray-400">
              <ArrowDown />
            </el-icon>
          </div>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="copy">
              <el-icon><DocumentCopy /></el-icon>
              {{ $t('wallet.copyAddress') }}
            </el-dropdown-item>
            <el-dropdown-item command="explorer">
              <el-icon><Link /></el-icon>
              {{ $t('wallet.viewOnExplorer') }}
            </el-dropdown-item>
            <el-dropdown-item divided command="disconnect">
              <el-icon><SwitchButton /></el-icon>
              {{ $t('wallet.disconnect') }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <!-- Disconnected State -->
    <el-button
      v-else
      type="primary"
      @click="handleConnect"
      :loading="walletStore.isConnecting"
      class="connect-button"
    >
      <el-icon class="mr-2">
        <Wallet />
      </el-icon>
      {{ $t('wallet.connect') }}
    </el-button>

    <!-- Network Switch Dialog -->
    <el-dialog
      :model-value="showNetworkDialog"
      @update:model-value="showNetworkDialog = $event"
      :title="$t('wallet.switchNetwork')"
      width="400px"
      :before-close="handleNetworkDialogClose"
    >
      <div class="text-center">
        <el-icon class="text-4xl text-warning-500 mb-4">
          <Warning />
        </el-icon>
        <p class="text-gray-600 dark:text-gray-400 mb-6">
          {{ $t('wallet.wrongNetwork') }}
        </p>
        <el-button type="primary" @click="switchToSupportedNetwork" :loading="switchingNetwork">
          {{ $t('wallet.switchToMainnet') }}
        </el-button>
      </div>
    </el-dialog>

    <!-- Connection Error Dialog -->
    <el-dialog
      :model-value="showErrorDialog"
      @update:model-value="showErrorDialog = $event"
      :title="$t('wallet.connectionError')"
      width="400px"
    >
      <div class="text-center">
        <el-icon class="text-4xl text-error-500 mb-4">
          <CircleClose />
        </el-icon>
        <p class="text-gray-600 dark:text-gray-400 mb-6">
          {{ connectionError }}
        </p>
        <div class="flex justify-center space-x-3">
          <el-button @click="showErrorDialog = false">
            {{ $t('common.cancel') }}
          </el-button>
          <el-button type="primary" @click="retryConnection">
            {{ $t('common.retry') }}
          </el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Wallet,
  ArrowDown,
  DocumentCopy,
  Link,
  SwitchButton,
  Warning,
  CircleClose
} from '@element-plus/icons-vue'

import { useWalletStore } from '@/stores/wallet'
import { formatNumber } from '@/utils/format'

const { t } = useI18n()
const walletStore = useWalletStore()

const connecting = ref(false)
const switchingNetwork = ref(false)
const showNetworkDialog = ref(false)
const showErrorDialog = ref(false)
const connectionError = ref('')

// Format balance display
const formatBalance = (balance: string) => {
  const num = parseFloat(balance)
  if (num === 0) return '0.00'
  if (num < 0.001) return '<0.001'
  return formatNumber(num, 4)
}

// Handle wallet connection
const handleConnect = async () => {
  try {
    await walletStore.connectWallet()
    ElMessage.success(t('wallet.walletConnected'))
  } catch (error: any) {
    console.error('Wallet connection failed:', error)
    connectionError.value = error.message || t('wallet.connectionFailed')
    showErrorDialog.value = true
  }
}

// Handle account dropdown actions
const handleAccountAction = async (command: string) => {
  switch (command) {
    case 'copy':
      try {
        await navigator.clipboard.writeText(walletStore.address)
        ElMessage.success(t('wallet.addressCopied'))
      } catch (error) {
        console.error('Failed to copy address:', error)
        ElMessage.error(t('wallet.copyFailed'))
      }
      break
    
    case 'explorer':
      const explorerUrl = walletStore.currentNetwork?.blockExplorer
      if (explorerUrl) {
        window.open(`${explorerUrl}/address/${walletStore.address}`, '_blank')
      }
      break
    
    case 'disconnect':
      try {
        await ElMessageBox.confirm(
          t('wallet.confirmDisconnect'),
          t('wallet.disconnect'),
          {
            confirmButtonText: t('common.confirm'),
            cancelButtonText: t('common.cancel'),
            type: 'warning'
          }
        )
        await walletStore.disconnectWallet()
        ElMessage.success(t('wallet.disconnected'))
      } catch (error) {
        // User cancelled
      }
      break
  }
}

// Handle network switching
const switchToSupportedNetwork = async () => {
  switchingNetwork.value = true
  try {
    await walletStore.switchNetwork(walletStore.chainId)
    showNetworkDialog.value = false
    ElMessage.success(t('wallet.networkSwitched'))
  } catch (error: any) {
    console.error('Network switch failed:', error)
    ElMessage.error(error.message || t('wallet.networkSwitchFailed'))
  } finally {
    switchingNetwork.value = false
  }
}

// Handle network dialog close
const handleNetworkDialogClose = () => {
  showNetworkDialog.value = false
}

// Retry connection
const retryConnection = () => {
  showErrorDialog.value = false
  handleConnect()
}

// Watch for network changes
watch(
  () => walletStore.isConnected && !walletStore.isNetworkSupported,
  (shouldShowDialog) => {
    if (shouldShowDialog) {
      showNetworkDialog.value = true
    }
  },
  { immediate: true }
)

// Auto-refresh balance
let balanceInterval: NodeJS.Timeout | null = null

watch(
  () => walletStore.isConnected,
  (connected) => {
    if (connected) {
      // Refresh balance every 30 seconds
      balanceInterval = setInterval(() => {
        walletStore.updateBalance()
      }, 30000)
    } else {
      if (balanceInterval) {
        clearInterval(balanceInterval)
        balanceInterval = null
      }
    }
  },
  { immediate: true }
)

// Cleanup on unmount
onUnmounted(() => {
  if (balanceInterval) {
    clearInterval(balanceInterval)
  }
})
</script>

<style scoped>
.wallet-connect {
  @apply flex items-center;
}

.connect-button {
  @apply px-6 py-2 rounded-lg font-medium transition-all duration-200;
  @apply hover:shadow-lg hover:scale-105;
}

.account-button {
  @apply px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600;
  @apply rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors;
}

.account-button:hover {
  @apply border-primary-300 dark:border-primary-600;
}

:deep(.el-dropdown-menu__item) {
  @apply flex items-center space-x-2;
}

:deep(.el-dropdown-menu__item .el-icon) {
  @apply text-gray-500;
}

:deep(.el-dialog__body) {
  @apply pt-0;
}

@media (max-width: 640px) {
  .connect-button {
    @apply px-4 py-2 text-sm;
  }
  
  .account-button {
    @apply px-2 py-1.5;
  }
}
</style>