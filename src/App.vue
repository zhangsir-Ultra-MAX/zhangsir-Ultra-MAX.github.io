<template>
  <div id="app" :class="[appStore.theme, { 'sidebar-collapsed': appStore.sidebarCollapsed }]">
    <!-- Loading overlay -->
    <div v-if="appStore.isLoading" class="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <LoadingSpinner size="large" :text="$t('common.loading')" />
    </div>

    <el-config-provider :locale="locale">
      <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <!-- Navigation Header -->
        <AppHeader />
        
        <!-- Main Content -->
        <main class="pt-16">
          <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <!-- Router view with transition -->
            <router-view v-slot="{ Component, route }">
              <transition
                name="page"
                mode="out-in"
                @enter="onPageEnter"
                @leave="onPageLeave"
              >
                <component :is="Component" :key="route.path" />
              </transition>
            </router-view>
          </div>
        </main>
      </div>
    </el-config-provider>

    <!-- Global modals -->
    <TransactionModal
      v-if="showTransactionModal"
      :visible="showTransactionModal"
      :transaction="currentTransaction"
      @close="closeTransactionModal"
    />

    <!-- Notifications -->
    <div class="fixed top-20 right-4 z-40 space-y-2">
      <transition-group name="notification" tag="div">
        <el-alert
          v-for="notification in appStore.notifications"
          :key="notification.id"
          :type="notification.type"
          :title="notification.title"
          :description="notification.message"
          :closable="true"
          @close="appStore.removeNotification(notification.id)"
          class="max-w-sm"
        />
      </transition-group>
    </div>

    <!-- Network status indicator -->
    <div
      v-if="!isOnline"
      class="fixed bottom-4 left-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-40"
    >
      <div class="flex items-center space-x-2">
        <el-icon><Warning /></el-icon>
        <span class="text-sm font-medium">{{ $t('common.offline') }}</span>
      </div>
    </div>

    <!-- Update available notification -->
    <div
      v-if="updateAvailable"
      class="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-40"
    >
      <div class="flex items-center space-x-2">
        <el-icon><InfoFilled /></el-icon>
        <span class="text-sm font-medium">{{ $t('common.updateAvailable') }}</span>
        <button
          @click="refreshApp"
          class="ml-2 text-sm underline hover:no-underline"
        >
          {{ $t('common.refresh') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElConfigProvider } from 'element-plus'
import { Warning, InfoFilled } from '@element-plus/icons-vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import en from 'element-plus/es/locale/lang/en'

// Components
import AppHeader from './components/layout/AppHeader.vue'
import LoadingSpinner from './components/common/LoadingSpinner.vue'
import TransactionModal from './components/common/TransactionModal.vue'

// Stores
import { useAppStore } from './stores/app'
import { useWalletStore } from './stores/wallet'

// Utils
import { logError } from './utils/error'
import { STORAGE_KEYS } from './constants'

const router = useRouter()
const route = useRoute()
const { t, locale: i18nLocale } = useI18n()
const appStore = useAppStore()
const walletStore = useWalletStore()

// Reactive state
const isOnline = ref(navigator.onLine)
const updateAvailable = ref(false)
const showTransactionModal = ref(false)
const currentTransaction = ref(null)

// Computed
const locale = computed(() => {
  return i18nLocale.value === 'zh' ? zhCn : en
})

const pageTitle = computed(() => {
  const routeTitle = route.meta?.title
  if (routeTitle) {
    return `${routeTitle} - ${t('common.appName')}`
  }
  return t('common.appName')
})

// Methods
const onPageEnter = (el: Element) => {
  // Page enter animation logic
  el.classList.add('page-enter-active')
}

const onPageLeave = (el: Element) => {
  // Page leave animation logic
  el.classList.add('page-leave-active')
}

const closeTransactionModal = () => {
  showTransactionModal.value = false
  currentTransaction.value = null
}

const refreshApp = () => {
  window.location.reload()
}

const handleOnline = () => {
  isOnline.value = true
  appStore.addNotification({
    type: 'success',
    title: t('common.connectionRestored'),
    message: t('common.connectionRestoredMessage')
  })
}

const handleOffline = () => {
  isOnline.value = false
  appStore.addNotification({
    type: 'warning',
    title: t('common.connectionLost'),
    message: t('common.connectionLostMessage')
  })
}

const handleVisibilityChange = () => {
  if (!document.hidden && walletStore.isConnected) {
    // Refresh data when app becomes visible
    walletStore.updateBalance()
  }
}

const handleBeforeUnload = (event: BeforeUnloadEvent) => {
  // Warn user if there are pending transactions
  if (walletStore.hasPendingTransactions) {
    event.preventDefault()
    event.returnValue = t('common.pendingTransactionsWarning')
    return event.returnValue
  }
}

const handleError = (error: ErrorEvent) => {
  logError(error.error, {
    type: 'global_error',
    filename: error.filename,
    lineno: error.lineno,
    colno: error.colno
  })
  
  appStore.addNotification({
    type: 'error',
    title: t('error.unexpectedError'),
    message: t('error.unexpectedErrorMessage')
  })
}

const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
  logError(event.reason, {
    type: 'unhandled_rejection'
  })
  
  appStore.addNotification({
    type: 'error',
    title: t('error.unexpectedError'),
    message: t('error.unexpectedErrorMessage')
  })
}

// Lifecycle
onMounted(async () => {
  try {
    // Initialize app
    await appStore.initializeApp()
    
    // Try to reconnect wallet if previously connected
    if (localStorage.getItem(STORAGE_KEYS.WALLET_CONNECTED) === 'true') {
      await walletStore.initializeConnection()
    }
    
    // Set up event listeners
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Check for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        updateAvailable.value = true
      })
    }
    
  } catch (error) {
    logError(error, { context: 'app_initialization' })
    appStore.addNotification({
      type: 'error',
      title: t('error.initializationFailed'),
      message: t('error.initializationFailedMessage')
    })
  }
})

onUnmounted(() => {
  // Clean up event listeners
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
  window.removeEventListener('beforeunload', handleBeforeUnload)
  window.removeEventListener('error', handleError)
  window.removeEventListener('unhandledrejection', handleUnhandledRejection)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})

// Watch for route changes to update page title
watch(pageTitle, (newTitle) => {
  document.title = newTitle
}, { immediate: true })

// Watch for theme changes
watch(
  () => appStore.theme,
  (newTheme) => {
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  },
  { immediate: true }
)

// Watch for language changes
watch(
  () => appStore.language,
  (newLanguage) => {
    document.documentElement.lang = newLanguage
  },
  { immediate: true }
)

// Global transaction modal handling
watch(
  () => walletStore.currentTransaction,
  (transaction) => {
    if (transaction) {
      currentTransaction.value = transaction
      showTransactionModal.value = true
    }
  }
)
</script>

<style scoped>
/* Page transitions */
.page-enter-active,
.page-leave-active {
  transition: all 0.3s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.page-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* Notification transitions */
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.notification-move {
  transition: transform 0.3s ease;
}

/* App layout */
#app {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Dark mode styles */
.dark {
  color-scheme: dark;
}

/* Responsive design */
@media (max-width: 768px) {
  .page-enter-from,
  .page-leave-to {
    transform: translateY(20px);
  }
}

/* Loading overlay */
.loading-overlay {
  backdrop-filter: blur(4px);
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.5);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.7);
}

.dark ::-webkit-scrollbar-thumb {
  background: rgba(75, 85, 99, 0.5);
}

.dark ::-webkit-scrollbar-thumb:hover {
  background: rgba(75, 85, 99, 0.7);
}

/* Focus styles */
.focus-visible {
  outline: 2px solid #6366f1;
  outline-offset: 2px;
}

/* Animation utilities */
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Print styles */
@media print {
  .no-print {
    display: none !important;
  }
}
</style>