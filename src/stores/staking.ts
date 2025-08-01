import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { formatUnits, parseUnits } from 'ethers'
import { useWalletStore } from './wallet'
import { useAppStore } from './app'
import { contractService } from '../services/contracts'



export const useStakingStore = defineStore('staking', () => {
  // State
  const totalStaked = ref('0') // Total CINA staked in vault
  const cinaBalance = ref('0') // User's CINA balance
  const stakedAmount = ref('0') // User's staked CINA amount
  const pendingRewards = ref('0') // User's pending rewards
  const currentAPY = ref('0') // Current staking APY
  const stakingRewardRate = ref('0') // Reward rate per second
  const rewardRatePerSecond = ref('0') // Reward rate per second
  const stakeExchangeRate = ref('1.0') // CINA to stCINA exchange rate
  const minStakeAmount = ref('0.01') // Minimum stake amount
  const minStakingPeriod = ref(86400) // Minimum staking period in seconds (1 day)
  const earlyUnstakePenalty = ref('0.05') // 5% penalty for early unstake
  const stakingDuration = ref(0) // User's current staking duration
  const lastClaimTime = ref(0) // Last claim timestamp
  const isLoading = ref(false)
  const lastUpdateTime = ref(0)


  // Form state
  const stakeInProgress = ref(false)
  const unstakeInProgress = ref(false)
  const claimInProgress = ref(false)

  // Getters
  const cinaBalanceFormatted = computed(() => {
    return parseFloat(cinaBalance.value).toFixed(6)
  })

  const stakedAmountFormatted = computed(() => {
    return parseFloat(stakedAmount.value).toFixed(6)
  })

  const totalStakedFormatted = computed(() => {
    return parseFloat(totalStaked.value).toFixed(2)
  })

  const pendingRewardsFormatted = computed(() => {
    return parseFloat(pendingRewards.value).toFixed(6)
  })

  // Actions
  const fetchStakingData = async () => {
    const walletStore = useWalletStore()
    const appStore = useAppStore()

    if (!walletStore.isConnected) return

    try {
      isLoading.value = true

      // Get staking contract
      const stakingContract = contractService.getStakingVaultContract()
      if (!stakingContract) {
        console.warn('Staking contract not available, using mock data')
        // Fallback to mock data
        totalStaked.value = '1250000.5678'
        currentAPY.value = '12.5'
        stakingRewardRate.value = '0.000000385'
        rewardRatePerSecond.value = '0.000000385'
        stakeExchangeRate.value = '1.025'
        minStakeAmount.value = '1.0'
        minStakingPeriod.value = 86400
        earlyUnstakePenalty.value = '0.05'
        
        if (walletStore.address) {
          await fetchUserStakingData()
        }
        return
      }

      // Fetch contract data using correct method calls
      const [
        stakingStatsResult,
        minStakeAmountResult,
        earlyUnstakePenaltyResult
      ] = await Promise.all([
        stakingContract.getStakingStats().catch(() => ['0', '0', '0']),
        stakingContract.minStakeAmount().catch(() => '1000000000000000000'), // 1 CINA
        stakingContract.earlyUnstakePenalty().catch(() => '50000000000000000') // 5%
      ])

      // Destructure staking stats
      const [totalStakedAmount, rewardPoolBalance, currentRewardRate] = stakingStatsResult

      // Convert from wei to readable format
      totalStaked.value = formatUnits(totalStakedAmount, 18)
      rewardRatePerSecond.value = formatUnits(currentRewardRate, 18)
      stakingRewardRate.value = formatUnits(currentRewardRate, 18)
      
      // Calculate APY from reward rate
      // APY = (rewardRatePerSecond * 365 * 24 * 3600 / totalStaked) * 100
      const secondsPerYear = 365 * 24 * 3600
      const yearlyRewards = parseFloat(formatUnits(currentRewardRate, 18)) * secondsPerYear
      const totalStakedFloat = parseFloat(formatUnits(totalStakedAmount, 18))
      if (totalStakedFloat > 0) {
        currentAPY.value = ((yearlyRewards / totalStakedFloat) * 100).toString()
      } else {
        currentAPY.value = '0'
      }
      
      // ERC4626 standard doesn't have fixed exchange rate, use 1:1
      stakeExchangeRate.value = '1.0'
      
      minStakeAmount.value = formatUnits(minStakeAmountResult, 18)
      earlyUnstakePenalty.value = formatUnits(earlyUnstakePenaltyResult, 18)
      
      // No minimum staking period in the contract
      minStakingPeriod.value = 0

      // Fetch user-specific data if connected
      if (walletStore.address) {
        await fetchUserStakingData()
      }

      lastUpdateTime.value = Date.now()
    } catch (error: any) {
      console.error('Failed to fetch staking data:', error)
      // appStore.addNotification({
      //   type: 'error',
      //   title: 'Data Fetch Failed',
      //   message: error.message || 'Failed to fetch staking data'
      // })
    } finally {
      isLoading.value = false
    }
  }

  const fetchUserStakingData = async () => {
    const walletStore = useWalletStore()
    if (!walletStore.address) return

    try {
      // Get contracts
      const stakingContract = contractService.getStakingVaultContract()
      const cinaContract = contractService.getCINAContract()
      
      if (!stakingContract || !cinaContract) {
        console.warn('Contracts not available, using mock user data')
        // Fallback to mock data
        cinaBalance.value = '500.123456'
        stakedAmount.value = '250.789012'
        pendingRewards.value = '12.345678'
        stakingDuration.value = Date.now() - (2 * 24 * 60 * 60 * 1000)
        lastClaimTime.value = Date.now() - (12 * 60 * 60 * 1000)
        

        return
      }

      // Fetch user data from contracts
      const [
        cinaBalanceResult,
        userStakingInfoResult,
        pendingRewardsResult
      ] = await Promise.all([
        cinaContract.balanceOf(walletStore.address).catch(() => '0'),
        stakingContract.getUserStakingInfo(walletStore.address).catch(() => ['0', '0', '0', '0', '0']),
        stakingContract.pendingRewards(walletStore.address).catch(() => '0')
      ])

      // Destructure user staking info
      const [userStakedAmount, stakingTime, userLastClaimTime, accumulatedRewards, pendingReward] = userStakingInfoResult

      // Convert from wei to readable format
      cinaBalance.value = formatUnits(cinaBalanceResult, 18)
      stakedAmount.value = formatUnits(userStakedAmount, 18)
      pendingRewards.value = formatUnits(pendingRewardsResult, 18)
      
      // Calculate staking duration (current time - staking time)
      const currentTime = Math.floor(Date.now() / 1000)
      const stakingTimeNumber = Number(stakingTime)
      if (stakingTimeNumber > 0) {
        stakingDuration.value = (currentTime - stakingTimeNumber) * 1000 // Convert to milliseconds
      } else {
        stakingDuration.value = 0
      }
      
      lastClaimTime.value = Number(userLastClaimTime) * 1000 // Convert to milliseconds


    } catch (error) {
      console.error('Failed to fetch user staking data:', error)
    }
  }

  const stakeCINA = async (amount: number) => {
    const walletStore = useWalletStore()
    const appStore = useAppStore()

    if (!walletStore.isConnected || !walletStore.signer) {
      throw new Error('Wallet not connected')
    }

    try {
      stakeInProgress.value = true

      // Get contracts
      const stakingContract = contractService.getStakingVaultContract(true) // with signer
      const cinaContract = contractService.getCINAContract(true) // with signer
      
      if (!stakingContract || !cinaContract) {
        throw new Error('Contracts not available')
      }

      const amountWei = parseUnits(amount.toString(), 18)
      
      // Check allowance
      const allowance = await cinaContract.allowance(walletStore.address, await stakingContract.getAddress())
      if (allowance < amountWei) {
        // Approve tokens first
        const approveTx = await cinaContract.approve(await stakingContract.getAddress(), amountWei)
        await approveTx.wait()
      }

      // Execute staking transaction using ERC4626 deposit method
      const depositTx = await stakingContract.deposit(amountWei, walletStore.address)
      await depositTx.wait()

      // Update local state
      const currentCinaBalance = parseFloat(cinaBalance.value)
      const currentStakedAmount = parseFloat(stakedAmount.value)
      
      cinaBalance.value = (currentCinaBalance - amount).toString()
      stakedAmount.value = (currentStakedAmount + amount).toString()
      totalStaked.value = (parseFloat(totalStaked.value) + amount).toString()



      // Update staking duration
      stakingDuration.value = Date.now()

    } catch (error: any) {
      console.error('Staking failed:', error)
      throw error
    } finally {
      stakeInProgress.value = false
    }
  }

  const unstakeCINA = async (amount: number) => {
    const walletStore = useWalletStore()
    const appStore = useAppStore()

    if (!walletStore.isConnected || !walletStore.signer) {
      throw new Error('Wallet not connected')
    }

    try {
      unstakeInProgress.value = true

      // Get staking contract
      const stakingContract = contractService.getStakingVaultContract(true) // with signer
      
      if (!stakingContract) {
        throw new Error('Staking contract not available')
      }

      const amountWei = parseUnits(amount.toString(), 18)
      
      // Execute unstaking transaction using ERC4626 withdraw method
      const withdrawTx = await stakingContract.withdraw(amountWei, walletStore.address, walletStore.address)
      await withdrawTx.wait()

      // No penalty calculation since contract doesn't have minimum staking period
      const actualAmount = amount

      // Update user balances
      const currentCinaBalance = parseFloat(cinaBalance.value)
      const currentStakedAmount = parseFloat(stakedAmount.value)
      
      cinaBalance.value = (currentCinaBalance + actualAmount).toString()
      stakedAmount.value = (currentStakedAmount - amount).toString()
      totalStaked.value = (parseFloat(totalStaked.value) - amount).toString()



    } catch (error: any) {
      console.error('Unstaking failed:', error)
      throw error
    } finally {
      unstakeInProgress.value = false
    }
  }

  const claimRewards = async () => {
    const walletStore = useWalletStore()
    const appStore = useAppStore()

    if (!walletStore.isConnected || !walletStore.signer) {
      throw new Error('Wallet not connected')
    }

    try {
      claimInProgress.value = true

      // Get staking contract
      const stakingContract = contractService.getStakingVaultContract(true) // with signer
      
      if (!stakingContract) {
        throw new Error('Staking contract not available')
      }

      // Execute claim transaction
      const claimTx = await stakingContract.claimRewards()
      await claimTx.wait()

      const rewardAmount = parseFloat(pendingRewards.value)
      
      // Update local state
      const currentCinaBalance = parseFloat(cinaBalance.value)
      cinaBalance.value = (currentCinaBalance + rewardAmount).toString()
      pendingRewards.value = '0'
      lastClaimTime.value = Date.now()



    } catch (error: any) {
      console.error('Claim failed:', error)
      throw error
    } finally {
      claimInProgress.value = false
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
        fetchStakingData()
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
    totalStaked,
    cinaBalance,
    stakedAmount,
    pendingRewards,
    currentAPY,
    stakingRewardRate,
    rewardRatePerSecond,
    stakeExchangeRate,
    minStakeAmount,
    minStakingPeriod,
    earlyUnstakePenalty,
    stakingDuration,
    lastClaimTime,
    isLoading,

    stakeInProgress,
    unstakeInProgress,
    claimInProgress,

    // Getters
    cinaBalanceFormatted,
    stakedAmountFormatted,
    totalStakedFormatted,
    pendingRewardsFormatted,

    // Actions
    fetchStakingData,
    fetchUserStakingData,
    stakeCINA,
    unstakeCINA,
    claimRewards,
    startAutoRefresh,
    stopAutoRefresh,

    // Computed getters for reactive access
    get loading() { return isLoading.value }
  }
})