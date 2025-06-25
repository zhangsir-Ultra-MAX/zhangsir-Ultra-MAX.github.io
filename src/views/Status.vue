<template>
  <div class="status-page">
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">合约状态</h1>
      
      <!-- Network Selector -->
      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-700 mb-2">选择网络</label>
        <select 
          v-model="selectedNetwork" 
          class="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option v-for="network in availableNetworks" :key="network.chainId" :value="network.chainId">
            {{ network.name }}
          </option>
        </select>
      </div>

      <!-- Tokens Section -->
      <div class="mb-8">
        <h2 class="text-2xl font-semibold text-gray-800 mb-4">代币合约</h2>
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div 
            v-for="(token, key) in TOKENS" 
            :key="key"
            class="bg-white rounded-lg shadow-md p-6 border border-gray-200"
          >
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-lg font-semibold text-gray-900">{{ token.name }}</h3>
              <span class="px-2 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded">{{ token.symbol }}</span>
            </div>
            <div class="space-y-2">
              <div class="text-sm text-gray-600">
                <span class="font-medium">精度:</span> {{ token.decimals }}
              </div>
              <div class="text-sm text-gray-600">
                <span class="font-medium">地址:</span>
                <div class="mt-1 flex items-center space-x-2">
                  <code class="bg-gray-100 px-2 py-1 rounded text-xs font-mono break-all">
                    {{ getTokenAddress(token, selectedNetwork) || '未部署' }}
                  </code>
                  <div class="flex space-x-1" v-if="getTokenAddress(token, selectedNetwork)">
                    <button 
                      @click="openInExplorer(getTokenAddress(token, selectedNetwork)!)"
                      class="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                      title="在区块链浏览器中查看"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                      </svg>
                    </button>
                    <button 
                      @click="copyToClipboard(getTokenAddress(token, selectedNetwork)!)"
                      class="p-1 text-gray-600 hover:text-gray-800 transition-colors"
                      title="复制地址"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Contracts Section -->
      <div>
        <h2 class="text-2xl font-semibold text-gray-800 mb-4">智能合约</h2>
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div 
            v-for="(contract, key) in CONTRACTS" 
            :key="key"
            class="bg-white rounded-lg shadow-md p-6 border border-gray-200"
          >
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-lg font-semibold text-gray-900">{{ formatContractName(key) }}</h3>
              <span class="px-2 py-1 bg-green-100 text-green-800 text-sm font-medium rounded">合约</span>
            </div>
            <div class="space-y-2">
              <div class="text-sm text-gray-600">
                <span class="font-medium">地址:</span>
                <div class="mt-1 flex items-center space-x-2">
                  <code class="bg-gray-100 px-2 py-1 rounded text-xs font-mono break-all">
                    {{ getContractAddress(contract, selectedNetwork) || '未部署' }}
                  </code>
                  <div class="flex space-x-1" v-if="getContractAddress(contract, selectedNetwork)">
                    <button 
                      @click="openInExplorer(getContractAddress(contract, selectedNetwork)!)"
                      class="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                      title="在区块链浏览器中查看"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                      </svg>
                    </button>
                    <button 
                      @click="copyToClipboard(getContractAddress(contract, selectedNetwork)!)"
                      class="p-1 text-gray-600 hover:text-gray-800 transition-colors"
                      title="复制地址"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
    <div 
      v-if="showToast"
      class="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg transition-opacity duration-300"
      :class="{ 'opacity-0': !showToast }"
    >
      地址已复制到剪贴板
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { NETWORKS, TOKENS, CONTRACTS } from '@/constants'
import { useWalletStore } from '@/stores/wallet'

const walletStore = useWalletStore()
const selectedNetwork = ref(walletStore.chainId || 1) // Default to current wallet network or Ethereum mainnet
const showToast = ref(false)

// Watch for wallet network changes
watch(
  () => walletStore.chainId,
  (newChainId) => {
    if (newChainId && newChainId !== selectedNetwork.value) {
      selectedNetwork.value = newChainId
    }
  },
  { immediate: true }
)

const availableNetworks = computed(() => {
  return Object.values(NETWORKS).filter(network => network.chainId !== undefined)
})

const currentNetwork = computed(() => {
  return Object.values(NETWORKS).find(network => network.chainId === selectedNetwork.value)
})

const getTokenAddress = (token: any, chainId: number): string | null => {
  return token.addresses[chainId] || null
}

const getContractAddress = (contract: any, chainId: number): string | null => {
  return contract[chainId] || null
}

const formatContractName = (key: string): string => {
  return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const openInExplorer = (address: string) => {
  const network = currentNetwork.value
  if (network?.blockExplorer) {
    const url = `${network.blockExplorer}/address/${address}`
    window.open(url, '_blank')
  }
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    showToast.value = true
    setTimeout(() => {
      showToast.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy text: ', err)
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    try {
      document.execCommand('copy')
      showToast.value = true
      setTimeout(() => {
        showToast.value = false
      }, 2000)
    } catch (fallbackErr) {
      console.error('Fallback copy failed: ', fallbackErr)
    }
    document.body.removeChild(textArea)
  }
}
</script>

<style scoped>
.status-page {
  min-height: 100vh;
  background-color: #f9fafb;
}

.container {
  max-width: 1200px;
}

code {
  word-break: break-all;
  max-width: 200px;
  display: inline-block;
}

@media (max-width: 768px) {
  code {
    max-width: 150px;
  }
}
</style>