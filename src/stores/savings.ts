import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { formatUnits, parseUnits } from 'ethers'
import { useWalletStore } from './wallet'
import { useAppStore } from './app'
import { contractService } from '@/services/contracts'
import BigNumber from 'bignumber.js'

export const useSavingsStore = defineStore('savings', () => {
  // State
  const userBalance = ref('0') // sWRMB balance
  const wrmbBalance = ref('0') // WRMB balance
  const totalAssets = ref('0') // Total assets in vault
  const currentNAV = ref('1.0') // Current NAV
  const currentPrice = ref('0.14') // Current WRMB price in USD
  const totalSupply = ref('0') // Total sWRMB supply
  const contractExternalShares = ref('0') // External shares held by contract
  const apy = ref('0') // Annual percentage yield
  const userAssetValue = ref('0') // User's asset value in maxWithdraw 
  const isLoading = ref(false)
  const lastUpdateTime = ref(0)
  const historicalNAV = ref<Array<{ timestamp: number, nav: number }>>([]) // Historical NAV data for APY calculation

  // Form state
  const depositAmount = ref('')
  const withdrawAmount = ref('')
  const isDepositing = ref(false)
  const isWithdrawing = ref(false)

  // Getters
  const userBalanceFormatted = computed(() => {
    return new BigNumber(formatUnits(userBalance.value, 18)).toFixed(6)
  })

  const wrmbBalanceFormatted = computed(() => {
    return new BigNumber(formatUnits(wrmbBalance.value, 18)).toFixed(6)
  })

  const totalAssetsFormatted = computed(() => {
    return new BigNumber(totalAssets.value).toFixed(2)
  })

  const userSharePercentage = computed(() => {
    if (totalSupply.value === '0' || userBalance.value === '0') return '0'
    return new BigNumber(userBalance.value)
      .dividedBy(totalSupply.value)
      .multipliedBy(100)
      .toFixed(4)
  })

  const currentAPY = computed(() => {
    if (totalSupply.value === '0' || apy.value === '0') return '0'
    return new BigNumber(apy.value)
      .multipliedBy(totalSupply.value)
      .dividedBy(contractExternalShares.value)
      .toFixed(4)
  })

  // Actions
  const fetchVaultData = async () => {
    const walletStore = useWalletStore()
    const appStore = useAppStore()

    if (!walletStore.isConnected) return

    try {
      isLoading.value = true

      const contract = await contractService.getSavingsVaultContract()
      if (!contract) throw new Error('Contract not available')

      // Fetch vault data
      const [vaultTotalAssets, vaultTotalSupply, nav, maxWithdraw, externalShares] = await Promise.all([
        contract.totalAssets(),
        contract.totalSupply(),
        contract.getNAV_sWRMB(),
        contract.maxWithdraw(walletStore.address),
        contract.contractExternalShares()
      ])

      totalAssets.value = formatUnits(vaultTotalAssets.toString(), 18)
      totalSupply.value = formatUnits(vaultTotalSupply.toString(), 18)
      userAssetValue.value = formatUnits(maxWithdraw.toString(), 18)
      contractExternalShares.value = formatUnits(externalShares.toString(), 18)

      const navValue = formatUnits(nav, 18)
      currentNAV.value = navValue

      // Record historical NAV for APY calculation
      const now = Date.now()
      historicalNAV.value.push({
        timestamp: now,
        nav: parseFloat(navValue)
      })

      // Keep only last 30 days of data
      const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000)
      historicalNAV.value = historicalNAV.value.filter(entry => entry.timestamp > thirtyDaysAgo)

      // Fetch WRMB price (placeholder - in real implementation, this would come from an oracle or API)
      await fetchWRMBPrice()

      // Calculate APY based on historical data
      await calculateAPY()

      // Fetch user balances if connected
      if (walletStore.address) {
        await fetchUserBalances()
      }

      lastUpdateTime.value = now
    } catch (error: any) {
      console.error('Failed to fetch vault data:', error)
      appStore.addNotification({
        type: 'error',
        title: 'Data Fetch Failed',
        message: error.message || 'Failed to fetch vault data'
      })
    } finally {
      isLoading.value = false
    }
  }

  const fetchUserBalances = async () => {
    const walletStore = useWalletStore()
    if (!walletStore.address) return

    try {
      const [savingsContract, wrmbContract] = await Promise.all([
        contractService.getSavingsVaultContract(),
        contractService.getWRMBContract()
      ])

      if (!savingsContract || !wrmbContract) return

      const [sWRMBBalance, wrmbUserBalance] = await Promise.all([
        savingsContract.balanceOf(walletStore.address),
        wrmbContract.balanceOf(walletStore.address)
      ])

      userBalance.value = formatUnits(sWRMBBalance, 18)
      wrmbBalance.value = formatUnits(wrmbUserBalance, 18)
    } catch (error) {
      console.error('Failed to fetch user balances:', error)
    }
  }

  const previewDeposit = async (amount: string) => {
    if (!amount || amount === '0') return { shares: '0', fee: '0' }

    try {
      const contract = await contractService.getSavingsVaultContract()
      if (!contract) throw new Error('Contract not available')

      const amountWei = parseUnits(amount, 18)
      const shares = await contract.previewDeposit(amountWei)

      return {
        shares: formatUnits(shares, 18),
        fee: '0' // No fee for deposits in this implementation
      }
    } catch (error) {
      console.error('Failed to preview deposit:', error)
      return { shares: '0', fee: '0' }
    }
  }

  const previewWithdraw = async (amount: string) => {
    if (!amount || amount === '0') return { shares: '0', fee: '0' }

    try {
      const contract = await contractService.getSavingsVaultContract()
      if (!contract) throw new Error('Contract not available')

      const assetsWei = parseUnits(amount, 18)
      const shares = await contract.previewWithdraw(assetsWei)

      return {
        shares: formatUnits(shares, 18),
        fee: '0' // No fee for withdrawals in this implementation
      }
    } catch (error) {
      console.error('Failed to preview withdraw:', error)
      return { shares: '0', fee: '0' }
    }
  }

  const fetchWRMBPrice = async () => {
    try {
      // In a real implementation, this would fetch from an oracle or price API
      // For now, we'll use a mock price with some variation
      const basePrice = 0.14
      const variation = (Math.random() - 0.5) * 0.02 // ±1% variation
      currentPrice.value = (basePrice + variation).toFixed(4)
    } catch (error) {
      console.error('Failed to fetch WRMB price:', error)
      // Fallback to default price
      currentPrice.value = '0.14'
    }
  }

  const calculateAPY = async () => {
    try {
      // 首先尝试通过合约事件计算APY
      const contract = await contractService.getSavingsVaultContract()
      if (contract) {
        try {
          await calculateAPYFromEvents(contract)
          return // 如果事件计算成功，直接返回
        } catch (error) {
          console.warn('Event-based APY calculation failed, falling back to historical data:', error)
        }
      }
      
      // 回退到基于历史NAV数据的计算
      if (historicalNAV.value.length < 2) {
        // Not enough data for calculation, use a default APY
        apy.value = '8.50'
        return
      }

      // Calculate APY based on NAV growth over time
      const sortedData = [...historicalNAV.value].sort((a, b) => a.timestamp - b.timestamp)
      const oldest = sortedData[0]
      const newest = sortedData[sortedData.length - 1]

      const timeDiffDays = (newest.timestamp - oldest.timestamp) / (1000 * 60 * 60 * 24)

      if (timeDiffDays > 0 && oldest.nav > 0) {
        // Calculate annualized return
        const totalReturn = (newest.nav - oldest.nav) / oldest.nav
        const annualizedReturn = Math.pow(1 + totalReturn, 365 / timeDiffDays) - 1
        apy.value = Math.max(0, annualizedReturn * 100).toFixed(2)
      } else {
        // Fallback to estimated APY
        apy.value = '8.50'
      }
    } catch (error) {
      console.error('Failed to calculate APY:', error)
      apy.value = '8.50'
    }
  }

  // 通过事件计算APY
  const calculateAPYFromEvents = async (contract: any) => {
    try {
      const walletStore = useWalletStore()
      
      // 检查provider是否可用
      if (!walletStore.provider) {
        console.warn('Provider not available for APY calculation')
        apy.value = '8.50' // 使用默认值
        return
      }
      
      // 使用wallet store的provider而不是contract.provider
      const currentBlock = await walletStore.provider.getBlockNumber()
      const blocksPerDay = 7200 // 以太坊约12秒一个块
      const blocks30Days = blocksPerDay * 30

      // 获取NAV更新事件
      const filter = contract.filters.WRMBMintedOnIncrease()
      const events = await contract.queryFilter(
        filter,
        Math.max(0, currentBlock - blocks30Days),
        currentBlock
      )

      if (events.length === 0) {
        apy.value = '0.00'
        return
      }

      // 按时间排序事件
      const sortedEvents = events.sort((a: any, b: any) => a.blockNumber - b.blockNumber)
      const oldestEvent = sortedEvents[0]
      const newestEvent = sortedEvents[sortedEvents.length - 1]

      // 获取时间戳
      const [oldestBlock, newestBlock] = await Promise.all([
        walletStore.provider.getBlock(oldestEvent.blockNumber),
        walletStore.provider.getBlock(newestEvent.blockNumber)
      ])

      // 检查区块是否存在，并计算时间差
      const timeDiffDays = newestBlock && oldestBlock ? 
        parseInt(((newestBlock.timestamp - oldestBlock.timestamp) / (24 * 60 * 60)).toString()) : 
        0

      if (timeDiffDays > 0) {
        const oldNAV = parseFloat(formatUnits(oldestEvent.args.oldNAV, 18))
        const newNAV = parseFloat(formatUnits(newestEvent.args.newNAV, 18))

        if (oldNAV > 0 && newNAV > oldNAV) {
          const totalReturn = (newNAV - oldNAV) / oldNAV
          const annualizedReturn = Math.pow(1 + totalReturn, 365 / timeDiffDays) - 1
          apy.value = Math.max(0, annualizedReturn * 100).toFixed(2)
          return
        }
      }

      // 如果无法计算，使用当前NAV与基准NAV的比较
      const currentNAV = parseFloat(formatUnits(await contract.getNAV_sWRMB(), 18))
      const baseNAV = 1.0

      if (currentNAV > baseNAV) {
        // 假设这是年化收益（简化计算）
        apy.value = ((currentNAV - baseNAV) * 100).toFixed(2)
      } else {
        apy.value = '0.00'
      }

    } catch (error) {
      console.error('Failed to calculate APY from events:', error)
      apy.value = '0.00'
    }
  }

  // Auto-refresh data
  let refreshInterval: NodeJS.Timeout | null = null

  const startAutoRefresh = () => {
    if (refreshInterval) {
      clearInterval(refreshInterval)
    }

    refreshInterval = setInterval(() => {
      if (Date.now() - lastUpdateTime.value > 30000) { // 30 seconds
        fetchVaultData()
      }
    }, 30000)
  }

  const stopAutoRefresh = () => {
    if (refreshInterval) {
      clearInterval(refreshInterval)
      refreshInterval = null
    }
  }

  return {
    // State
    userBalance,
    wrmbBalance,
    totalAssets,
    currentNAV,
    currentPrice,
    totalSupply,
    contractExternalShares,
    apy,
    currentAPY,
    isLoading,
    depositAmount,
    withdrawAmount,
    isDepositing,
    isWithdrawing,
    historicalNAV,

    // Getters
    userBalanceFormatted,
    wrmbBalanceFormatted,
    totalAssetsFormatted,
    userSharePercentage,
    userAssetValue,

    // Actions
    fetchVaultData,
    fetchUserBalances,
    fetchWRMBPrice,
    previewDeposit,
    previewWithdraw,
    calculateAPY,
    startAutoRefresh,
    stopAutoRefresh,

    // Computed getters for reactive access
    get depositInProgress() { return isDepositing.value },
    get withdrawInProgress() { return isWithdrawing.value },
    get loading() { return isLoading.value }
  }
})