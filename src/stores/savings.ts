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
  const totalSupply = ref('0') // Total sWRMB supply
  const apy = ref('0') // Annual percentage yield
  const isLoading = ref(false)
  const lastUpdateTime = ref(0)
  
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
  
  const userAssetValue = computed(() => {
    if (userBalance.value === '0' || currentNAV.value === '0') return '0'
    return new BigNumber(userBalance.value)
      .multipliedBy(currentNAV.value)
      .toFixed(6)
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
      const [vaultTotalAssets, vaultTotalSupply, nav] = await Promise.all([
        contract.totalAssets(),
        contract.totalSupply(),
        contract.getNAV_sWRMB()
      ])
      
      totalAssets.value = formatUnits(vaultTotalAssets.toString(), 18)
      totalSupply.value = formatUnits(vaultTotalSupply.toString(), 18)
      currentNAV.value = formatUnits(nav, 18)
      
      // Fetch user balances if connected
      if (walletStore.address) {
        await fetchUserBalances()
      }
      
      lastUpdateTime.value = Date.now()
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
    if (!amount || amount === '0') return { assets: '0', fee: '0' }
    
    try {
      const contract = await contractService.getSavingsVaultContract()
      if (!contract) throw new Error('Contract not available')
      
      const sharesWei = parseUnits(amount, 18)
      const assets = await contract.previewRedeem(sharesWei)
      
      return {
        assets: formatUnits(assets, 18),
        fee: '0' // No fee for withdrawals in this implementation
      }
    } catch (error) {
      console.error('Failed to preview withdraw:', error)
      return { assets: '0', fee: '0' }
    }
  }
  
  const deposit = async (amount: string) => {
    const walletStore = useWalletStore()
    const appStore = useAppStore()
    
    if (!walletStore.signer || !amount || amount === '0') {
      throw new Error('Invalid parameters')
    }
    
    try {
      isDepositing.value = true
      
      const [savingsContract, wrmbContract] = await Promise.all([
        contractService.getSavingsVaultContract(true),
        contractService.getWRMBContract(true)
      ])
      
      if (!savingsContract || !wrmbContract) {
        throw new Error('Contracts not available')
      }
      
      const amountWei = parseUnits(amount, 18)
      
      // Check allowance
      const allowance = await wrmbContract.allowance(
        walletStore.address,
        await savingsContract.getAddress()
      )
      
      // Approve if needed
      if (allowance < amountWei) {
        appStore.addNotification({
          type: 'info',
          title: 'Approval Required',
          message: 'Please approve WRMB spending'
        })
        
        const approveTx = await wrmbContract.approve(
          await savingsContract.getAddress(),
          amountWei
        )
        await approveTx.wait()
        
        appStore.addNotification({
          type: 'success',
          title: 'Approval Successful',
          message: 'WRMB spending approved'
        })
      }
      
      // Deposit
      const depositTx = await savingsContract.deposit(
        amountWei,
        walletStore.address
      )
      
      appStore.addNotification({
        type: 'info',
        title: 'Transaction Submitted',
        message: 'Deposit transaction submitted'
      })
      
      const receipt = await depositTx.wait()
      
      appStore.addNotification({
        type: 'success',
        title: 'Deposit Successful',
        message: `Deposited ${amount} WRMB successfully`
      })
      
      // Refresh data
      await fetchVaultData()
      
      return receipt
    } catch (error: any) {
      console.error('Deposit failed:', error)
      appStore.addNotification({
        type: 'error',
        title: 'Deposit Failed',
        message: error.message || 'Failed to deposit WRMB'
      })
      throw error
    } finally {
      isDepositing.value = false
    }
  }
  
  const withdraw = async (amount: string) => {
    const walletStore = useWalletStore()
    const appStore = useAppStore()
    
    if (!walletStore.signer || !amount || amount === '0') {
      throw new Error('Invalid parameters')
    }
    
    try {
      isWithdrawing.value = true
      
      const contract = await contractService.getSavingsVaultContract(true)
      if (!contract) throw new Error('Contract not available')
      
      const sharesWei = parseUnits(amount, 18)
      
      const withdrawTx = await contract.redeem(
        sharesWei,
        walletStore.address,
        walletStore.address
      )
      
      appStore.addNotification({
        type: 'info',
        title: 'Transaction Submitted',
        message: 'Withdrawal transaction submitted'
      })
      
      const receipt = await withdrawTx.wait()
      
      appStore.addNotification({
        type: 'success',
        title: 'Withdrawal Successful',
        message: `Withdrew ${amount} sWRMB successfully`
      })
      
      // Refresh data
      await fetchVaultData()
      
      return receipt
    } catch (error: any) {
      console.error('Withdrawal failed:', error)
      appStore.addNotification({
        type: 'error',
        title: 'Withdrawal Failed',
        message: error.message || 'Failed to withdraw sWRMB'
      })
      throw error
    } finally {
      isWithdrawing.value = false
    }
  }
  
  const calculateAPY = () => {
    // This would typically be calculated based on historical data
    // For now, we'll use a placeholder calculation
    const navNumber = new BigNumber(currentNAV.value)
    if (navNumber.isGreaterThan(1)) {
      // Simplified APY calculation - in reality this would be more complex
      apy.value = navNumber.minus(1).multipliedBy(100).toFixed(2)
    } else {
      apy.value = '0'
    }
  }
  
  // Auto-refresh data
  const startAutoRefresh = () => {
    const interval = setInterval(() => {
      if (Date.now() - lastUpdateTime.value > 30000) { // 30 seconds
        fetchVaultData()
      }
    }, 30000)
    
    return () => clearInterval(interval)
  }
  
  return {
    // State
    userBalance,
    wrmbBalance,
    totalAssets,
    currentNAV,
    totalSupply,
    apy,
    isLoading,
    depositAmount,
    withdrawAmount,
    isDepositing,
    isWithdrawing,
    
    // Getters
    userBalanceFormatted,
    wrmbBalanceFormatted,
    totalAssetsFormatted,
    userSharePercentage,
    userAssetValue,
    
    // Actions
    fetchVaultData,
    fetchUserBalances,
    previewDeposit,
    previewWithdraw,
    deposit,
    withdraw,
    calculateAPY,
    startAutoRefresh
  }
})