<template>
  <header class="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
    <div class="container mx-auto px-4">
      <div class="flex items-center justify-between h-16">
        <!-- Logo and Brand -->
        <div class="flex items-center space-x-4">
          <router-link to="/" class="flex items-center space-x-2">
            <div class="w-10 h-10 from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
              <img v-if="appStore.isDark" src="../../assets/logo-dark.png" alt="Logo" class="w-10 h-10">
              <img v-else src="../../assets/logo.png" alt="Logo" class="w-10 h-10">
            </div>
          </router-link>
        </div>

        <!-- Desktop Navigation -->
        <nav class="hidden md:flex items-center space-x-8">
          <router-link
            v-for="item in navigationItems"
            :key="item.name"
            :to="item.path"
            class="nav-link"
            :class="{
              'text-primary-600 dark:text-primary-400': $route.path === item.path,
              'text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400': $route.path !== item.path
            }"
          >
            <el-icon class="mr-1">
              <component :is="item.icon" />
            </el-icon>
            {{ $t(`navigation.${item.name}`) }}
          </router-link>
        </nav>

        <!-- Right Side Actions -->
        <div class="flex items-center space-x-4">
          <!-- Network Status -->
          <div v-if="walletStore.isConnected" class="hidden sm:flex items-center space-x-2">
            <div class="flex items-center space-x-1 px-2 py-1 rounded-full text-xs"
                 :class="walletStore.isNetworkSupported ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'">
              <div class="w-2 h-2 rounded-full"
                   :class="walletStore.isNetworkSupported ? 'bg-green-500' : 'bg-red-500'"></div>
              <span>{{ walletStore.currentNetwork?.name || 'Unknown' }}</span>
            </div>
          </div>

          <!-- Theme Toggle -->
          <el-button
            circle
            @click="appStore.toggleTheme()"
            class="!border-gray-300 dark:!border-gray-600"
          >
            <el-icon>
              <Sunny v-if="appStore.isDark" />
              <Moon v-else />
            </el-icon>
          </el-button>

          <!-- Language Toggle -->
          <el-dropdown @command="handleLanguageChange">
            <el-button circle class="!border-gray-300 dark:!border-gray-600">
              {{ currentLanguage === 'en' ? 'En' : 'Zh' }}
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="en" :class="{ 'is-active': currentLanguage === 'en' }">
                  English
                </el-dropdown-item>
                <el-dropdown-item command="zh" :class="{ 'is-active': currentLanguage === 'zh' }">
                  中文
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <!-- Wallet Connection -->
          <WalletConnect />

          <!-- Mobile Menu Toggle -->
           <div class="md:hidden">
             <el-button
               class="!border-gray-300 dark:!border-gray-600"
               @click="mobileMenuOpen = !mobileMenuOpen"
             >
               <el-icon>
                 <Menu />
               </el-icon>
             </el-button>
           </div>
        </div>
      </div>

      <!-- Mobile Navigation -->
      <div v-show="mobileMenuOpen" class="md:hidden border-t border-gray-200 dark:border-gray-700 py-4">
        <nav class="flex flex-col space-y-2">
          <router-link
            v-for="item in navigationItems"
            :key="item.name"
            :to="item.path"
            class="flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors"
            :class="{
              'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-200': $route.path === item.path,
              'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700': $route.path !== item.path
            }"
            @click="mobileMenuOpen = false"
          >
            <el-icon class="mr-2">
              <component :is="item.icon" />
            </el-icon>
            {{ $t(`navigation.${item.name}`) }}
          </router-link>
        </nav>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import {
  Menu,
  Moon,
  Sunny,
  DataBoard,
  Wallet,
  Switch,
  TrendCharts,
  Document,
  Link
} from '@element-plus/icons-vue'

import WalletConnect from '@/components/common/WalletConnect.vue'
import { useAppStore } from '@/stores/app'
import { useWalletStore } from '@/stores/wallet'

const { locale } = useI18n()
const appStore = useAppStore()
const walletStore = useWalletStore()
const route = useRoute()

const mobileMenuOpen = ref(false)

const currentLanguage = computed(() => locale.value)

const navigationItems = [
  {
    name: 'dashboard',
    path: '/',
    icon: DataBoard
  },
  {
    name: 'savings',
    path: '/savings',
    icon: Wallet
  },
  {
    name: 'wrap',
    path: '/wrap',
    icon: Switch
  },
  {
    name: 'bonds',
    path: '/bonds',
    icon: Document
  },
  {
    name: 'portfolio',
    path: '/portfolio',
    icon: TrendCharts
  },
  {
    name: 'status',
    path: '/status',
    icon: Link
  }
]

const handleLanguageChange = (command: string) => {
  locale.value = command
  appStore.setLanguage(command)
}

// Close mobile menu when route changes
watch(() => route.path, () => {
  mobileMenuOpen.value = false
})
</script>

<style scoped>
.nav-link {
  @apply flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200;
}

.container {
  max-width: 1200px;
}

@media (max-width: 640px) {
  .container {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}

.is-active {
  @apply bg-primary-50 text-primary-700;
}

.dark .is-active {
  @apply bg-primary-900 text-primary-200;
}
</style>