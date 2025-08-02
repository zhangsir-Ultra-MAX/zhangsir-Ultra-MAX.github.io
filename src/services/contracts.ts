import { Contract, Interface } from 'ethers'
import { useWalletStore } from '../stores/wallet'
import { CONTRACTS, TOKENS } from '../constants'

// Get contract addresses based on current chain ID
const getContractAddresses = (chainId: number) => {
  return {
    SAVINGS_VAULT: CONTRACTS.SAVINGS_VAULT[chainId as keyof typeof CONTRACTS.SAVINGS_VAULT] || '',
    WRAP_MANAGER: CONTRACTS.WRAP_MANAGER[chainId as keyof typeof CONTRACTS.WRAP_MANAGER] || '',
    BOND_POOL: CONTRACTS.BOND_POOL[chainId as keyof typeof CONTRACTS.BOND_POOL] || '',
    STAKING_VAULT: CONTRACTS.STAKING_VAULT[chainId as keyof typeof CONTRACTS.STAKING_VAULT] || '',
    WRMB: TOKENS.WRMB.addresses[chainId as keyof typeof TOKENS.WRMB.addresses] || '',
    SRMB: TOKENS.sRMB.addresses[chainId as keyof typeof TOKENS.sRMB.addresses] || '',
    CINA: TOKENS.CINA.addresses[chainId as keyof typeof TOKENS.CINA.addresses] || '',
    USDT: TOKENS.USDT.addresses[chainId as keyof typeof TOKENS.USDT.addresses] || ''
  }
}

// Contract ABIs - simplified versions for the main functions
const SAVINGS_VAULT_ABI = [
  'function totalAssets() view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address, address) view returns (uint256)',
  'function approve(address, uint256) returns (bool)',
  'function getNAV_sWRMB() view returns (uint256)',
  'function totalMMFSupply() view returns (uint256)',
  'function previewDeposit(uint256) view returns (uint256)',
  'function previewRedeem(uint256) view returns (uint256)',
  'function previewMint(uint256) view returns (uint256)',
  'function previewWithdraw(uint256) view returns (uint256)',
  'function getIncrementAmount() view returns (uint256)',
  'function getUserIncrementAmount(address) view returns (uint256)',
  'function previewWithdrawOfFee(uint256) view returns (uint256, uint256, uint256)',
  'function maxWithdraw(address) view returns (uint256)',
  'function getCurrentYearNAVSummary() view returns (uint256 totalIncrease, uint256 averageIncrease, uint256 maxIncrease, uint256 minIncrease, uint256 recordCount, uint256 firstIncrease, uint256 lastIncrease)',
  'function deposit(uint256, address) returns (uint256)',
  'function redeem(uint256, address, address) returns (uint256)',
  'function withdraw(uint256, address, address) returns (uint256)',
  'function asset() view returns (address)',
  'event Deposit(address indexed caller, address indexed owner, uint256 assets, uint256 shares)',
  'event Withdraw(address indexed caller, address indexed receiver, address indexed owner, uint256 assets, uint256 shares)',
  'event WRMBMintedOnIncrease(uint256 amount, uint256 oldNAV, uint256 newNAV)'
]

const WRAP_MANAGER_ABI = [
  'function wrap(uint256) returns (uint256, uint256)',
  'function unwrap(uint256 sRMBAmount) returns (uint256 sWRMBBurned, uint256 sRMBReceived)',
  'function previewWrap(address, uint256) view returns (uint256, uint256, uint256, uint256, uint256)',
  'function previewUnwrap(address, uint256) view returns (uint256, uint256, uint256, uint256, uint256)',
  'function getConfiguration() view returns (address, address, address, uint256, uint256, uint256, uint256, uint256, uint256)',
  'function minWrapAmount() view returns (uint256)',
  'function maxWrapAmount() view returns (uint256)',
  'function minUnwrapAmount() view returns (uint256)',
  'function maxUnwrapAmount() view returns (uint256)',
  'function wrapFee() view returns (uint256)',
  'function unwrapFee() view returns (uint256)',
  'function getSRMBLiquidity() view returns (uint256)',
  'function wrapAndUnwrapInterval() view returns (uint256)',
  'function totalReserveTransferred() view returns (uint256)',
  'function getUserUnwrappableAmount(address) view returns (uint256)',
  'function getUserWrapStats(address) view returns (uint256, uint256, uint256)',
  'function userWrappedAmount(address) view returns (uint256)',
  'function userUnwrappedAmount(address) view returns (uint256)',
  'event Wrapped(address indexed user, uint256 sRMBAmount, uint256 sWRMBReceived, uint256 wrmBMinted, uint256 fee)',
  'event Unwrapped(address indexed user, uint256 sWRMBAmount, uint256 sRMBReceived, uint256 wrmBBurned, uint256 fee)'
]

const BOND_POOL_ABI = [
  'function subscribeBond(uint256)',
  'function matureBond(uint256)',
  'function getUserBonds(address) view returns (uint256[], tuple(uint256 principal, uint256 wrmbAmount, uint256 subscribeTime, uint256 maturityTime, uint256 interestRate, bool isActive, bool isMatured)[])',
  'function previewSubscription(uint256) view returns (uint256, uint256, uint256)',
  'function getPoolStats() view returns (uint256, uint256, uint256)',
  'function calculateCompoundInterest(uint256, uint256, uint256, uint256) pure returns (uint256)',
  'function poolConfig() view returns (tuple(uint256 minSubscription, uint256 maxSubscription, uint256 bondDuration, uint256 interestRate, uint256 maxPoolSize, bool subscriptionOpen))',
  'function bonds(uint256) view returns (tuple(uint256 principal, uint256 wrmbAmount, uint256 subscribeTime, uint256 maturityTime, uint256 interestRate, bool isActive, bool isMatured))',
  'function userTotalPrincipal(address) view returns (uint256)',
  'event BondSubscribed(address indexed user, uint256 indexed bondId, uint256 usdtAmount, uint256 wrmbAmount, uint256 maturityTime)',
  'event BondMatured(address indexed user, uint256 indexed bondId, uint256 principalAmount, uint256 interestAmount, uint256 totalAmount)'
]

const STAKING_VAULT_ABI = [
  // ERC4626 标准方法
  'function totalAssets() view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function deposit(uint256 assets, address receiver) returns (uint256 shares)',
  'function withdraw(uint256 assets, address receiver, address owner) returns (uint256 shares)',
  'function mint(uint256 shares, address receiver) returns (uint256 assets)',
  'function redeem(uint256 shares, address receiver, address owner) returns (uint256 assets)',
  'function previewDeposit(uint256 assets) view returns (uint256)',
  'function previewWithdraw(uint256 assets) view returns (uint256)',
  'function previewMint(uint256 shares) view returns (uint256)',
  'function previewRedeem(uint256 shares) view returns (uint256)',
  
  // 质押相关查询方法
  'function totalStaked() view returns (uint256)',
  'function rewardPool() view returns (uint256)',
  'function minStakeAmount() view returns (uint256)',
  'function earlyUnstakePenalty() view returns (uint256)',
  'function rewardRatePerSecond() view returns (uint256)',
  'function pendingRewards(address user) view returns (uint256)',
  
  // 用户信息查询
  'function stakingInfo(address) view returns (uint256 stakedAmount, uint256 stakingTime, uint256 lastClaimTime, uint256 accumulatedRewards, uint256 baseRewardRate)',
  'function getUserStakingInfo(address user) view returns (uint256 stakedAmount, uint256 stakingTime, uint256 lastClaimTime, uint256 accumulatedRewards, uint256 pendingReward)',
  'function getStakingStats() view returns (uint256 totalStakedAmount, uint256 rewardPoolBalance, uint256 currentRewardRate)',
  
  // 奖励领取
  'function claimRewards()',
  
  // 紧急提取
  'function emergencyWithdraw()',
  
  // 事件
  'event Staked(address indexed user, uint256 amount, uint256 shares)',
  'event Unstaked(address indexed user, uint256 amount, uint256 shares, uint256 penalty)',
  'event RewardClaimed(address indexed user, uint256 amount)',
  'event EmergencyWithdraw(address indexed user, uint256 amount)'
]

const FARM_VAULT_ABI = [
  'function totalCINAMined() view returns (uint256)',
  'function totalUSDTDeposited() view returns (uint256)',
  'function usdtBalance(address) view returns (uint256)',
  'function depositedAmount(address) view returns (uint256)',
  'function pendingCINA(address) view returns (uint256)',
  'function farmAPY() view returns (uint256)',
  'function farmRate() view returns (uint256)',
  'function exchangeRate() view returns (uint256)',
  'function minDepositAmount() view returns (uint256)',
  'function depositFee() view returns (uint256)',
  'function withdrawalFee() view returns (uint256)',
  'function depositUSDT(uint256) returns (bool)',
  'function claimCINA() returns (uint256)',
  'event USDTDeposited(address indexed user, uint256 amount)',
  'event CINAClaimed(address indexed user, uint256 amount)'
]

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address, address) view returns (uint256)',
  'function approve(address, uint256) returns (bool)',
  'function transfer(address, uint256) returns (bool)',
  'function transferFrom(address, address, uint256) returns (bool)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'function totalSupply() view returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)'
]

class ContractService {
  private contracts: Map<string, Contract> = new Map()
  
  private getContract(address: string, abi: string[], withSigner = false): Contract | null {
    const walletStore = useWalletStore()
    
    if (!walletStore.provider) {
      console.warn('Provider not available')
      return null
    }
    
    if (!address || address === '') {
      console.warn('Contract address not available for current network')
      return null
    }
    
    const key = `${address}_${walletStore.chainId}_${withSigner ? 'signer' : 'provider'}_${abi.length}`
    
    if (this.contracts.has(key)) {
      return this.contracts.get(key)!
    }
    
    try {
      const providerOrSigner = withSigner ? walletStore.signer : walletStore.provider
      if (!providerOrSigner) {
        console.warn('Provider or signer not available')
        return null
      }
      
      const contract = new Contract(address, abi, providerOrSigner)
      this.contracts.set(key, contract)
      return contract
    } catch (error) {
      console.error('Failed to create contract:', error)
      return null
    }
  }
  
  // Savings Vault Contract
  getSavingsVaultContract(withSigner = false): Contract | null {
    const walletStore = useWalletStore()
    const addresses = getContractAddresses(walletStore.chainId)
    return this.getContract(addresses.SAVINGS_VAULT, SAVINGS_VAULT_ABI, withSigner)
  }
  
  // Wrap Manager Contract
  getWrapManagerContract(withSigner = false): Contract | null {
    const walletStore = useWalletStore()
    const addresses = getContractAddresses(walletStore.chainId)
    return this.getContract(addresses.WRAP_MANAGER, WRAP_MANAGER_ABI, withSigner)
  }
  
  // Bond Pool Contract
  getBondPoolContract(withSigner = false): Contract | null {
    const walletStore = useWalletStore()
    const addresses = getContractAddresses(walletStore.chainId)
    return this.getContract(addresses.BOND_POOL, BOND_POOL_ABI, withSigner)
  }
  
  // Token Contracts
  getWRMBContract(withSigner = false): Contract | null {
    const walletStore = useWalletStore()
    const addresses = getContractAddresses(walletStore.chainId)
    return this.getContract(addresses.WRMB, ERC20_ABI, withSigner)
  }
  
  getSRMBContract(withSigner = false): Contract | null {
    const walletStore = useWalletStore()
    const addresses = getContractAddresses(walletStore.chainId)
    return this.getContract(addresses.SRMB, ERC20_ABI, withSigner)
  }
  
  getUSDTContract(withSigner = false): Contract | null {
    const walletStore = useWalletStore()
    const addresses = getContractAddresses(walletStore.chainId)
    return this.getContract(addresses.USDT, ERC20_ABI, withSigner)
  }
  
  getCINAContract(withSigner = false): Contract | null {
    const walletStore = useWalletStore()
    const addresses = getContractAddresses(walletStore.chainId)
    return this.getContract(addresses.CINA, ERC20_ABI, withSigner)
  }
  
  // Staking Vault Contract
  getStakingVaultContract(withSigner = false): Contract | null {
    const walletStore = useWalletStore()
    const addresses = getContractAddresses(walletStore.chainId)
    return this.getContract(addresses.STAKING_VAULT, STAKING_VAULT_ABI, withSigner)
  }
  
  // Generic ERC20 contract
  getERC20Contract(address: string, withSigner = false): Contract | null {
    return this.getContract(address, ERC20_ABI, withSigner)
  }
  
  // Clear cached contracts (useful when switching accounts/networks)
  clearCache(): void {
    this.contracts.clear()
  }
  
  // Get contract addresses for current network
  getAddresses() {
    const walletStore = useWalletStore()
    return getContractAddresses(walletStore.chainId)
  }
  
  // Get contract addresses for specific chain ID
  getAddressesForChain(chainId: number) {
    return getContractAddresses(chainId)
  }
  
  // Utility function to check if address is valid
  isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address)
  }
  
  // Get contract interface for event parsing
  getSavingsVaultInterface(): Interface {
    return new Interface(SAVINGS_VAULT_ABI)
  }
  
  getWrapManagerInterface(): Interface {
    return new Interface(WRAP_MANAGER_ABI)
  }
  
  getBondPoolInterface(): Interface {
    return new Interface(BOND_POOL_ABI)
  }
  
  getERC20Interface(): Interface {
    return new Interface(ERC20_ABI)
  }
  
  getStakingVaultInterface(): Interface {
    return new Interface(STAKING_VAULT_ABI)
  }
  
  getFarmVaultInterface(): Interface {
    return new Interface(FARM_VAULT_ABI)
  }
}

export const contractService = new ContractService()
export { getContractAddresses }