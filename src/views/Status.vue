<template>
  <div class="status-page">
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-8">{{ t('status.title') }}</h1>
      
      <!-- Network Selector -->
      <!-- <div class="mb-6">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{{ t('status.selectNetwork') }}</label>
        <select 
          v-model="selectedNetwork" 
          class="block w-full max-w-xs px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option v-for="network in availableNetworks" :key="network.chainId" :value="network.chainId">
            {{ network.name }}
          </option>
        </select>
      </div> -->

      <div class="mb-6">
        <button 
          @click="loadTokenData"
          :disabled="Object.values(tokenData).some(data => data.loading)"
          class="inline-flex items-center px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white text-sm font-medium rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          :title="t('status.refreshData')"
        >
          <svg 
            class="w-4 h-4 mr-2" 
            :class="{ 'animate-spin': Object.values(tokenData).some(data => data.loading) }"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          {{ t('status.refresh') }}
        </button>
      </div>

      <!-- Tokens Section -->
      <div class="mb-8">
        <h2 class="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">{{ t('status.tokenContracts') }}</h2>
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div 
            v-for="(token, key) in TOKENS" 
            :key="key"
            class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700"
          >
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ token.name }}</h3>
              <span class="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-medium rounded">{{ token.symbol }}</span>
            </div>
            <div class="space-y-3">
              <div class="text-sm text-gray-600 dark:text-gray-400">
                <span class="font-medium">{{ t('status.precision') }}:</span> {{ token.decimals }}
              </div>
              
              <!-- Total Supply -->
              <div class="text-sm text-gray-600 dark:text-gray-400">
                <span class="font-medium">{{ t('status.totalSupply') }}:</span>
                <span v-if="tokenData[key]?.loading" class="text-gray-400 dark:text-gray-500">{{ t('common.loading') }}</span>
                <span v-else class="font-mono">{{ parseFloat(tokenData[key]?.totalSupply || '0').toLocaleString() }} {{ token.symbol }}</span>
              </div>
              
              <!-- User Balance -->
              <div class="text-sm text-gray-600 dark:text-gray-400" v-if="walletStore.isConnected">
                <span class="font-medium">{{ t('status.myBalance') }}:</span>
                <span v-if="tokenData[key]?.loading" class="text-gray-400 dark:text-gray-500">{{ t('common.loading') }}</span>
                <span v-else class="font-mono text-blue-600 dark:text-blue-400">{{ parseFloat(tokenData[key]?.userBalance || '0').toLocaleString() }} {{ token.symbol }}</span>
              </div>
              
              <div class="text-sm text-gray-600 dark:text-gray-400">
                <span class="font-medium">{{ t('status.address') }}:</span>
                <div class="mt-1 flex items-center space-x-2">
                  <code class="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs font-mono break-all text-gray-900 dark:text-gray-100">
                    {{ getTokenAddress(token, selectedNetwork) || t('status.notDeployed') }}
                  </code>
                  <div class="flex space-x-1" v-if="getTokenAddress(token, selectedNetwork)">
                    <button 
                      @click="openInExplorer(getTokenAddress(token, selectedNetwork)!)"
                      class="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                      :title="t('status.viewOnExplorer')"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                      </svg>
                    </button>
                    <button 
                      @click="copyToClipboard(getTokenAddress(token, selectedNetwork)!)"
                      class="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                      :title="t('status.copyAddress')"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              
              <!-- Action Buttons -->
              <div class="flex space-x-2 mt-3" v-if="getTokenAddress(token, selectedNetwork)">
                <button 
                  @click="showQueryModal = true"
                  class="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {{ t('status.queryBalance') }}
                </button>
                <button
                  v-if="token.symbol !== 'sRMB'"
                  @click="openTransferModal(key)"
                  :disabled="!walletStore.isConnected"
                  class="flex-1 px-3 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-sm rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {{ t('status.quickTransfer') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Contracts Section -->
      <div>
        <h2 class="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">{{ t('status.smartContracts') }}</h2>
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div 
            v-for="(contract, key) in CONTRACTS" 
            :key="key"
            class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700"
          >
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ formatContractName(key) }}</h3>
              <span class="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm font-medium rounded">{{ t('status.contract') }}</span>
            </div>
            <div class="space-y-2">
              <div class="text-sm text-gray-600 dark:text-gray-400">
                <span class="font-medium">{{ t('status.address') }}:</span>
                <div class="mt-1 flex items-center space-x-2">
                  <code class="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs font-mono break-all text-gray-900 dark:text-gray-100">
                    {{ getContractAddress(contract, selectedNetwork) || t('status.notDeployed') }}
                  </code>
                  <div class="flex space-x-1" v-if="getContractAddress(contract, selectedNetwork)">
                    <button 
                      @click="openInExplorer(getContractAddress(contract, selectedNetwork)!)"
                      class="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                      :title="t('status.viewOnExplorer')"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                      </svg>
                    </button>
                    <button 
                      @click="copyToClipboard(getContractAddress(contract, selectedNetwork)!)"
                      class="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                      :title="t('status.copyAddress')"
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

    <!-- Query Balance Modal -->
    <div v-if="showQueryModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{{ t('status.queryBalanceModal.title') }}</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{{ t('status.queryBalanceModal.walletAddress') }}</label>
            <input 
              v-model="queryAddress"
              type="text"
              :placeholder="t('status.queryBalanceModal.placeholder')"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
          <div class="flex space-x-3">
            <button 
              @click="queryAddressBalance"
              :disabled="!queryAddress || isQuerying"
              class="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isQuerying ? t('status.queryBalanceModal.querying') : t('status.queryBalanceModal.query') }}
            </button>
            <button 
              @click="showQueryModal = false"
              class="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500"
            >
              {{ t('status.queryBalanceModal.cancel') }}
            </button>
          </div>
          
          <!-- Query Results -->
          <div v-if="Object.keys(queryResults).length > 0" class="mt-4 space-y-2">
            <h4 class="font-medium text-gray-900 dark:text-white">{{ t('status.queryBalanceModal.results') }}</h4>
            <div v-for="(balance, tokenKey) in queryResults" :key="tokenKey" class="flex justify-between items-center py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded">
              <span class="font-medium text-gray-900 dark:text-white">{{ TOKENS[tokenKey as keyof typeof TOKENS].symbol }}</span>
              <span class="font-mono text-sm text-gray-700 dark:text-gray-300">{{ parseFloat(balance).toLocaleString() }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Transfer Modal -->
    <div v-if="showTransferModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{{ t('status.transferModal.title') }} - {{ TOKENS[transferData.tokenKey as keyof typeof TOKENS]?.symbol }}</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{{ t('status.transferModal.receiverAddress') }}</label>
            <input 
              v-model="transferData.toAddress"
              type="text"
              :placeholder="t('status.transferModal.receiverPlaceholder')"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{{ t('status.transferModal.transferAmount') }}</label>
            <input 
              v-model="transferData.amount"
              type="number"
              step="0.000001"
              :placeholder="t('status.transferModal.amountPlaceholder')"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
            <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {{ t('status.transferModal.availableBalance') }}: {{ parseFloat(tokenData[transferData.tokenKey]?.userBalance || '0').toLocaleString() }} {{ TOKENS[transferData.tokenKey as keyof typeof TOKENS]?.symbol }}
            </div>
          </div>
          <div class="flex space-x-3">
            <button 
              @click="executeTransfer"
              :disabled="!transferData.toAddress || !transferData.amount || transferData.loading"
              class="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ transferData.loading ? t('status.transferModal.transferring') : t('status.transferModal.confirmTransfer') }}
            </button>
            <button 
              @click="showTransferModal = false"
              :disabled="transferData.loading"
              class="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 disabled:opacity-50"
            >
              {{ t('status.transferModal.cancel') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
    <div v-if="showToast" class="fixed top-4 right-4 bg-green-500 dark:bg-green-600 text-white px-4 py-2 rounded-md shadow-lg z-50 transition-all duration-300">
      {{ toastMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { NETWORKS, TOKENS, CONTRACTS } from '@/constants'
import { useWalletStore } from '@/stores/wallet'
import { contractService } from '@/services/contracts'
import { formatEther, formatUnits, parseUnits } from 'ethers'

const { t } = useI18n()

const walletStore = useWalletStore()
const selectedNetwork = ref(walletStore.chainId || 1) // Default to current wallet network or Ethereum mainnet
const showToast = ref(false)
const toastMessage = ref(t('status.toast.addressCopied'))

// Token data state
const tokenData = ref<Record<string, {
  totalSupply: string
  userBalance: string
  loading: boolean
}>>({})

// Query functionality state
const queryAddress = ref('')
const queryResults = ref<Record<string, string>>({})
const isQuerying = ref(false)
const showQueryModal = ref(false)

// Transfer functionality state
const showTransferModal = ref(false)
const transferData = ref({
  tokenKey: '',
  toAddress: '',
  amount: '',
  loading: false
})

// Watch for wallet network changes
watch(
  () => walletStore.chainId,
  (newChainId) => {
    if (newChainId && newChainId !== selectedNetwork.value) {
      selectedNetwork.value = newChainId
      loadTokenData()
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

const showToastMessage = (message: string) => {
  toastMessage.value = message
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    showToastMessage(t('status.toast.addressCopied'))
  } catch (err) {
    console.error('复制失败:', err)
  }
}

// Load token data (total supply and user balance)
const loadTokenData = async () => {
  if (!walletStore.provider) return
  
  for (const [key, token] of Object.entries(TOKENS)) {
    tokenData.value[key] = {
      totalSupply: '0',
      userBalance: '0',
      loading: true
    }
    
    try {
      const tokenAddress = getTokenAddress(token, selectedNetwork.value)
      if (!tokenAddress) continue
      
      const contract = contractService.getERC20Contract(tokenAddress)
      if (!contract) continue
      
      const [totalSupply, userBalance] = await Promise.all([
        contract.totalSupply(),
        walletStore.address ? contract.balanceOf(walletStore.address) : Promise.resolve(0)
      ])

      tokenData.value[key] = {
        totalSupply: formatUnits(totalSupply, token.decimals),
        userBalance: formatUnits(userBalance, token.decimals),
        loading: false
      }
    } catch (error) {
      console.error(`Failed to load data for ${key}:`, error)
      tokenData.value[key].loading = false
    }
  }
}

// Watch for wallet connection changes
watch(
  () => walletStore.isConnected,
  () => {
    loadTokenData()
  },
  { immediate: true }
)

// Watch for selected network changes
watch(
  selectedNetwork,
  () => {
    loadTokenData()
  }
)

// Query address balance
const queryAddressBalance = async () => {
  if (!queryAddress.value || !walletStore.provider) return
  
  isQuerying.value = true
  queryResults.value = {}
  
  try {
    for (const [key, token] of Object.entries(TOKENS)) {
      const tokenAddress = getTokenAddress(token, selectedNetwork.value)
      if (!tokenAddress) continue
      
      const contract = contractService.getERC20Contract(tokenAddress)
      if (!contract) continue
      
      const balance = await contract.balanceOf(queryAddress.value)
      queryResults.value[key] = formatEther(balance)
    }
  } catch (error) {
    console.error('Failed to query address balance:', error)
    toastMessage.value = t('status.balanceModal.queryFailed')
    showToast.value = true
    setTimeout(() => {
      showToast.value = false
    }, 2000)
  } finally {
    isQuerying.value = false
  }
}

// Open transfer modal
const openTransferModal = (tokenKey: string) => {
  transferData.value = {
    tokenKey,
    toAddress: '',
    amount: '',
    loading: false
  }
  showTransferModal.value = true
}

// Execute transfer
const executeTransfer = async () => {
  if (!transferData.value.toAddress || !transferData.value.amount || !walletStore.signer) {
    return
  }
  
  transferData.value.loading = true
  
  try {
    const token = TOKENS[transferData.value.tokenKey as keyof typeof TOKENS]
    const tokenAddress = getTokenAddress(token, selectedNetwork.value)
    if (!tokenAddress) throw new Error('Token not deployed on this network')
    
    const contract = contractService.getERC20Contract(tokenAddress, true)
    if (!contract) throw new Error('Failed to get contract')
    
    const amount = String(transferData.value.amount);
    const tx = await contract.transfer(transferData.value.toAddress, parseUnits(amount, token.decimals))
    
    toastMessage.value = t('status.toast.transferSubmitted')
    showToast.value = true
    setTimeout(() => {
      showToast.value = false
    }, 3000)
    
    await tx.wait()
    
    toastMessage.value = t('status.toast.transferSuccess')
    showToast.value = true
    setTimeout(() => {
      showToast.value = false
    }, 2000)
    
    showTransferModal.value = false
    loadTokenData() // Refresh balances
  } catch (error: any) {
    console.error('Transfer failed:', error)
    toastMessage.value = `${t('status.toast.transferFailed')}: ${error.message || t('status.toast.unknownError')}`
    showToast.value = true
    setTimeout(() => {
      showToast.value = false
    }, 3000)
  } finally {
    transferData.value.loading = false
  }
}

// Initialize data on mount
onMounted(() => {
  loadTokenData()
})
</script>

<style scoped>
.status-page {
  @apply bg-gray-50 dark:bg-gray-900;
  min-height: 100vh;
  transition: background-color 0.3s ease;
}

.container {
  max-width: 1200px;
}

code {
  word-break: break-all;
  max-width: 200px;
  display: inline-block;
}

/* Dark mode transitions */
* {
  transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease;
}

/* Custom scrollbar for dark mode */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  @apply bg-gray-100 dark:bg-gray-800;
}

::-webkit-scrollbar-thumb {
  @apply bg-gray-300 dark:bg-gray-600 rounded;
}

::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-400 dark:bg-gray-500;
}

@media (max-width: 768px) {
  code {
    max-width: 150px;
  }
}
</style>