import { defineStore } from 'pinia'
import { ref, computed, markRaw } from 'vue'
import { BrowserProvider, JsonRpcSigner, formatEther } from 'ethers'
import { useAppStore } from './app'
import { STORAGE_KEYS } from '../constants'

export const useWalletStore = defineStore('wallet', () => {
  // State
  const isConnected = ref(false)
  const address = ref('')
  const chainId = ref(0)
  const provider = ref<BrowserProvider | null>(null)
  const signer = ref<JsonRpcSigner | null>(null)
  const balance = ref('0')
  const isConnecting = ref(false)
  
  // Supported networks
  const SUPPORTED_NETWORKS = {
    31337: {
      name: 'Local Testnet',
      rpcUrl: 'http://localhost:8545',
      blockExplorer: 'https://local-testnet-explorer'
    },
    1: {
      name: 'Ethereum Mainnet',
      rpcUrl: 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID',
      blockExplorer: 'https://etherscan.io'
    },
    5: {
      name: 'Goerli Testnet',
      rpcUrl: 'https://goerli.infura.io/v3/YOUR_PROJECT_ID',
      blockExplorer: 'https://goerli.etherscan.io'
    },
    11155111: {
      name: 'Sepolia Testnet',
      rpcUrl: 'https://sepolia.infura.io/v3/YOUR_PROJECT_ID',
      blockExplorer: 'https://sepolia.etherscan.io'
    }
  }
  
  // Getters
  const currentNetwork = computed(() => {
    return SUPPORTED_NETWORKS[chainId.value as keyof typeof SUPPORTED_NETWORKS] || null
  })
  
  const shortAddress = computed(() => {
    if (!address.value) return ''
    return `${address.value.slice(0, 6)}...${address.value.slice(-4)}`
  })
  
  const isNetworkSupported = computed(() => {
    return chainId.value in SUPPORTED_NETWORKS
  })
  
  // Actions
  const connectWallet = async () => {
    const appStore = useAppStore()
    
    if (!(window as any).ethereum) {
      appStore.addNotification({
        type: 'error',
        title: 'Wallet Not Found',
        message: 'Please install MetaMask or another Web3 wallet'
      })
      return false
    }
    
    try {
      isConnecting.value = true
      
      // Request account access
      const accounts = await (window as any).ethereum.request({
        method: 'eth_requestAccounts'
      })
      
      if (accounts.length === 0) {
        throw new Error('No accounts found')
      }
      
      // Create provider and signer
      const browserProvider = new BrowserProvider((window as any).ethereum)
      const jsonRpcSigner = await browserProvider.getSigner()
      
      // Parallel execution for faster loading
      const [network, userAddress] = await Promise.all([
        browserProvider.getNetwork(),
        jsonRpcSigner.getAddress()
      ])
      
      // Update critical state first for immediate UI feedback
      provider.value = markRaw(browserProvider)
      signer.value = markRaw(jsonRpcSigner)
      address.value = userAddress
      chainId.value = Number(network.chainId)
      isConnected.value = true
      
      // Save to localStorage immediately
      localStorage.setItem(STORAGE_KEYS.WALLET_CONNECTED, 'true')
      
      // Setup event listeners early
      setupEventListeners()
      
      // Show success notification immediately
      appStore.addNotification({
        type: 'success',
        title: 'Wallet Connected',
        message: `Connected to ${shortAddress.value}`
      })
      
      // Load balance asynchronously without blocking
      // Use a local reference to avoid potential stale provider issues
      const loadBalance = async () => {
        try {
          if (provider.value && address.value) {
            const userBalance = await provider.value.getBalance(address.value)
            balance.value = formatEther(userBalance)
          }
        } catch (error) {
          console.warn('Failed to load balance:', error)
          // Set default balance if loading fails
          balance.value = '0'
        }
      }
      
      // Execute balance loading
      loadBalance()
      
      return true
    } catch (error: any) {
      console.error('Failed to connect wallet:', error)
      appStore.addNotification({
        type: 'error',
        title: 'Connection Failed',
        message: error.message || 'Failed to connect wallet'
      })
      return false
    } finally {
      isConnecting.value = false
    }
  }
  
  const disconnectWallet = () => {
    const appStore = useAppStore()
    
    // Reset state
    isConnected.value = false
    address.value = ''
    chainId.value = 0
    provider.value = null
    signer.value = null
    balance.value = '0'
    
    // Clear localStorage
    localStorage.removeItem('walletConnected')
    
    // Remove event listeners
    if ((window as any).ethereum) {
      const ethereum = (window as any).ethereum
      try {
        if (typeof ethereum.removeAllListeners === 'function') {
          ethereum.removeAllListeners()
        } else if (typeof ethereum.removeListener === 'function') {
          // Fallback for providers that don't support removeAllListeners
          ethereum.removeListener('accountsChanged')
          ethereum.removeListener('chainChanged')
          ethereum.removeListener('disconnect')
        }
      } catch (error) {
        console.warn('Failed to remove event listeners:', error)
      }
    }
    
    appStore.addNotification({
      type: 'info',
      title: 'Wallet Disconnected',
      message: 'Your wallet has been disconnected'
    })
  }
  
  const switchNetwork = async (targetChainId: number) => {
    const appStore = useAppStore()
    
    if (!(window as any).ethereum) {
      appStore.addNotification({
        type: 'error',
        title: 'Wallet Not Found',
        message: 'Please install MetaMask or another Web3 wallet'
      })
      return false
    }
    
    try {
      await (window as any).ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }]
      })
      return true
    } catch (error: any) {
      console.error('Failed to switch network:', error)
      appStore.addNotification({
        type: 'error',
        title: 'Network Switch Failed',
        message: error.message || 'Failed to switch network'
      })
      return false
    }
  }
  
  const updateBalance = async () => {
    if (!provider.value || !address.value) return
    
    try {
      // Create a fresh provider instance to avoid stale reference issues
      const currentProvider = provider.value
      const currentAddress = address.value
      
      if (currentProvider && currentAddress) {
        const userBalance = await currentProvider.getBalance(currentAddress)
        balance.value = formatEther(userBalance)
      }
    } catch (error) {
      console.error('Failed to update balance:', error)
      // Set default balance on error to prevent UI issues
      balance.value = '0'
    }
  }
  
  const setupEventListeners = () => {
    if (!(window as any).ethereum) return
    
    const ethereum = (window as any).ethereum
    
    // Check if the provider supports event listeners
    if (typeof ethereum.on !== 'function') {
      console.warn('Wallet provider does not support event listeners')
      return
    }
    
    try {
      // Account changed
      ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet()
        } else {
          address.value = accounts[0]
          updateBalance()
        }
      })
      
      // Chain changed
      ethereum.on('chainChanged', (newChainId: string) => {
        chainId.value = parseInt(newChainId, 16)
        updateBalance()
      })
      
      // Disconnect
      ethereum.on('disconnect', () => {
        disconnectWallet()
      })
    } catch (error) {
      console.warn('Failed to setup event listeners:', error)
    }
  }
  
  const initializeConnection = async () => {
    const wasConnected = localStorage.getItem(STORAGE_KEYS.WALLET_CONNECTED)
    
    if (wasConnected && (window as any).ethereum) {
      try {
        const accounts = await (window as any).ethereum.request({
          method: 'eth_accounts'
        })
        
        if (accounts.length > 0) {
          await connectWallet()
        }
      } catch (error) {
        console.error('Failed to initialize connection:', error)
      }
    }
  }
  
  return {
    // State
    isConnected,
    address,
    chainId,
    provider,
    signer,
    balance,
    isConnecting,
    
    // Getters
    currentNetwork,
    shortAddress,
    isNetworkSupported,
    
    // Actions
    connectWallet,
    disconnectWallet,
    switchNetwork,
    updateBalance,
    initializeConnection
  }
})