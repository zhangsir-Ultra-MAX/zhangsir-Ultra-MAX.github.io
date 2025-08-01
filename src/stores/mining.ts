import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { formatUnits, parseUnits } from 'ethers'
import { useWalletStore } from './wallet'
import { useAppStore } from './app'
import BigNumber from 'bignumber.js'

export const useMiningStore = defineStore('mining', () => {
  // State
  const totalCINAMined = ref('0') // Total CINA mined from AMO
  const totalUSDTDeposited = ref('0') // Total USDT deposited in AMO
  const usdtBalance = ref('0') // User's USDT balance
  const depositedAmount = ref('0') // User's deposited USDT amount
  const pendingCINA = ref('0') // User's pending CINA rewards
  const miningAPY = ref('0') // Current mining APY
  const miningRate = ref('0') // CINA mining rate per USDT per second
  const exchangeRate = ref('1.0') // USDT to CINA exchange rate
  const minDepositAmount = ref('10.0') // Minimum deposit amount
  const depositFee = ref('0.001') // Deposit fee (0.1%)
  const withdrawalFee = ref('0.002') // Withdrawal fee (0.2%)
  const lastClaimTime = ref(0) // Last claim timestamp
  const depositTime = ref(0) // User's deposit timestamp
  const isLoading = ref(false)
  const lastUpdateTime = ref(0)


  // Form state
  const depositInProgress = ref(false)
  const claimInProgress = ref(false)
  const withdrawInProgress = ref(false)

  // Getters
  const usdtBalanceFormatted = computed(() => {
    return new BigNumber(formatUnits(usdtBalance.value, 6)).toFixed(2) // USDT has 6 decimals
  })

  const depositedAmountFormatted = computed(() => {
    return new BigNumber(formatUnits(depositedAmount.value, 6)).toFixed(2)
  })

  const totalCINAMinedFormatted = computed(() => {
    return new BigNumber(totalCINAMined.value).toFixed(2)
  })

  const totalUSDTDepositedFormatted = computed(() => {
    return new BigNumber(totalUSDTDeposited.value).toFixed(2)
  })

  const pendingCINAFormatted = computed(() => {
    return new BigNumber(pendingCINA.value).toFixed(6)
  })

  // Actions
  const fetchMiningData = async () => {
    const walletStore = useWalletStore()
    const appStore = useAppStore()

    if (!walletStore.isConnected) return

    try {
      isLoading.value = true

      // Mock contract calls - in real implementation, these would be actual AMO contract calls
      // const amoContract = await contractService.getAMOContract()
      // if (!amoContract) throw new Error('AMO contract not available')

      // Mock data for demonstration
      await new Promise(resolve => setTimeout(resolve, 500)) // Simulate network delay

      // Simulate fetching mining data
      totalCINAMined.value = '2500000.1234'
      totalUSDTDeposited.value = '1800000.56'
      miningAPY.value = '15.8'
      miningRate.value = '0.000000547' // Approximate rate for 15.8% APY
      exchangeRate.value = '1.389' // 1 USDT = 1.389 CINA
      minDepositAmount.value = '10.0'
      depositFee.value = '0.001' // 0.1%
      withdrawalFee.value = '0.002' // 0.2%

      // Fetch user-specific data if connected
      if (walletStore.address) {
        await fetchUserMiningData()
      }
    } catch (error: any) {
      console.error('Failed to fetch mining data:', error)
      // appStore.addNotification({
      //   type: 'error',
      //   title: 'Data Fetch Failed',
      //   message: error.message || 'Failed to fetch mining data'
      // })
    } finally {
      isLoading.value = false
    }
  }

  const fetchUserMiningData = async () => {
    const walletStore = useWalletStore()
    if (!walletStore.address) return

    try {
      // Mock user mining data - in real implementation, these would be actual contract calls
      usdtBalance.value = parseUnits('1500.25', 6).toString() // USDT has 6 decimals
      depositedAmount.value = parseUnits('800.00', 6).toString()
      pendingCINA.value = '45.678901'
      depositTime.value = Date.now() - (3 * 24 * 60 * 60 * 1000) // 3 days ago
      lastClaimTime.value = Date.now() - (6 * 60 * 60 * 1000) // 6 hours ago


    } catch (error) {
      console.error('Failed to fetch user mining data:', error)
    }
  }

  const depositUSDT = async (amount: number) => {
    const walletStore = useWalletStore()
    const appStore = useAppStore()

    if (!walletStore.isConnected || !walletStore.signer) {
      throw new Error('Wallet not connected')
    }

    try {
      depositInProgress.value = true

      // Mock deposit transaction - in real implementation, this would be an actual AMO contract call
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate transaction time

      // Calculate fee
      const fee = amount * parseFloat(depositFee.value)
      const netAmount = amount - fee

      // Update user balances
      const currentUsdtBalance = parseFloat(formatUnits(usdtBalance.value, 6))
      const currentDepositedAmount = parseFloat(formatUnits(depositedAmount.value, 6))
      
      usdtBalance.value = parseUnits((currentUsdtBalance - amount).toString(), 6).toString()
      depositedAmount.value = parseUnits((currentDepositedAmount + netAmount).toString(), 6).toString()
      totalUSDTDeposited.value = (parseFloat(totalUSDTDeposited.value) + netAmount).toString()



      // Update deposit time if first deposit
      if (currentDepositedAmount === 0) {
        depositTime.value = Date.now()
      }

    } catch (error: any) {
      console.error('Deposit failed:', error)
      throw error
    } finally {
      depositInProgress.value = false
    }
  }

  const claimCINA = async () => {
    const walletStore = useWalletStore()
    const appStore = useAppStore()

    if (!walletStore.isConnected || !walletStore.signer) {
      throw new Error('Wallet not connected')
    }

    try {
      claimInProgress.value = true

      // Mock claim transaction
      await new Promise(resolve => setTimeout(resolve, 1500))

      const claimAmount = parseFloat(pendingCINA.value)
      
      // Update balances
      pendingCINA.value = '0'
      lastClaimTime.value = Date.now()
      totalCINAMined.value = (parseFloat(totalCINAMined.value) + claimAmount).toString()



    } catch (error: any) {
      console.error('Claim failed:', error)
      throw error
    } finally {
      claimInProgress.value = false
    }
  }

  const withdrawUSDT = async (amount: number) => {
    const walletStore = useWalletStore()
    const appStore = useAppStore()

    if (!walletStore.isConnected || !walletStore.signer) {
      throw new Error('Wallet not connected')
    }

    if (amount <= 0) {
      throw new Error('Invalid withdrawal amount')
    }

    const currentDeposited = parseFloat(depositedAmount.value)
    if (amount > currentDeposited) {
      throw new Error('Insufficient deposited amount')
    }

    try {
      withdrawInProgress.value = true

      // Mock withdrawal transaction
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Calculate withdrawal fee
      const fee = amount * parseFloat(withdrawalFee.value)
      const netAmount = amount - fee

      // Update balances
      depositedAmount.value = (currentDeposited - amount).toString()
      usdtBalance.value = (parseFloat(usdtBalance.value) + netAmount).toString()

      // Refresh data
      await fetchUserMiningData()

    } catch (error: any) {
      console.error('Withdrawal failed:', error)
      throw error
    } finally {
      withdrawInProgress.value = false
    }
  }

  const previewDeposit = async (amount: string) => {
    if (!amount || amount === '0') return { netAmount: '0', fee: '0', expectedCINA: '0' }

    try {
      const depositAmount = parseFloat(amount)
      const fee = depositAmount * parseFloat(depositFee.value)
      const netAmount = depositAmount - fee
      const expectedCINA = netAmount * parseFloat(exchangeRate.value)

      return {
        netAmount: netAmount.toFixed(2),
        fee: fee.toFixed(4),
        expectedCINA: expectedCINA.toFixed(6)
      }
    } catch (error) {
      console.error('Failed to preview deposit:', error)
      return { netAmount: '0', fee: '0', expectedCINA: '0' }
    }
  }

  // Auto-refresh data
  let refreshInterval: NodeJS.Timeout | null = null

  const startAutoRefresh = () => {
    if (refreshInterval) {
      clearInterval(refreshInterval)
    }

    refreshInterval = setInterval(() => {
      if (Date.now() - lastUpdateTime.value > 15000) { // 15 seconds
        fetchMiningData()
      }
    }, 15000)
  }

  const stopAutoRefresh = () => {
    if (refreshInterval) {
      clearInterval(refreshInterval)
      refreshInterval = null
    }
  }

  return {
    // State
    totalCINAMined,
    totalUSDTDeposited,
    usdtBalance,
    depositedAmount,
    pendingCINA,
    miningAPY,
    miningRate,
    exchangeRate,
    minDepositAmount,
    depositFee,
    withdrawalFee,
    lastClaimTime,
    depositTime,
    isLoading,

    depositInProgress,
    claimInProgress,
    withdrawInProgress,

    // Getters
    usdtBalanceFormatted,
    depositedAmountFormatted,
    totalCINAMinedFormatted,
    totalUSDTDepositedFormatted,
    pendingCINAFormatted,

    // Actions
    fetchMiningData,
    fetchUserMiningData,
    depositUSDT,
    claimCINA,
    withdrawUSDT,
    previewDeposit,
    startAutoRefresh,
    stopAutoRefresh,

    // Computed getters for reactive access
    get loading() { return isLoading.value }
  }
})