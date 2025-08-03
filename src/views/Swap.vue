<template>
    <div class="swap">
        <div class="swap-content">
            <!-- Swap Overview -->
            <div class="swap-overview">
                <h2 class="section-title">
                    {{ $t('swap.title') }}
                </h2>
            </div>

            <!-- Swap Interface -->
            <div class="swap-interface">
                <div class="interface-card">
                    <!-- Settings Icon -->
                    <el-popover placement="bottom-end" :width="300" trigger="click">
                        <template #reference>
                            <div class="settings-icon">
                                <el-icon class="settings-btn">
                                    <Setting />
                                </el-icon>
                            </div>
                        </template>
                        <div class="settings-content">
                            <h4 class="settings-title">{{ $t('swap.settings') }}</h4>
                            <div class="detail-item">
                                <span>{{ $t('swap.slippage') }}</span>
                                <div class="slippage-selector">
                                    <button v-for="value in slippageOptions" :key="value"
                                        :class="{ active: slippage === value }" @click="slippage = value">
                                        {{ value }}%
                                    </button>
                                    <div class="custom-slippage">
                                        <input type="number" v-model="customSlippage" @input="handleCustomSlippage"
                                            placeholder="Custom" />
                                        <span>%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </el-popover>
                    <!-- Token Selection -->
                    <div class="token-selection">
                        <div class="token-input-container">
                            <div class="token-input-header">
                                <span class="input-label">{{ $t('swap.sell') }}</span>
                            </div>
                            <div class="input-section">
                                <div class="input-group">
                                    <div class="amount-input">
                                        <div class="input-with-select">
                                            <el-input type="number" v-model="fromAmount"
                                                :placeholder="formatNumber(fromTokenBalance) + '  ' + $t('available')"
                                                @input="handleFromAmountChange" size="large" />
                                            <TokenSelect v-model="fromToken" :tokens="availableTokens"
                                                placeholder="Select token" />
                                        </div>
                                    </div>
                                </div>
                                <!-- Quick Amount Buttons -->
                                <div class="quick-amounts">
                                    <el-button v-for="percentage in [25, 50, 75]" :key="percentage" size="small"
                                        @click="setDepositPercentage(percentage)">
                                        {{ percentage }}%
                                    </el-button>
                                    <el-button @click="setMaxFromAmount" class="max-button" size="small">
                                        {{ $t('common.max') }}
                                    </el-button>
                                </div>
                            </div>
                        </div>

                        <!-- Swap Direction Button -->
                        <div class="swap-direction">
                            <el-button circle @click="swapTokens" class="swap-direction-btn">
                                <el-icon class="swap-icon" :style="{ transform: `rotate(${swapIconRotation}deg)` }">
                                    <Sort />
                                </el-icon>
                            </el-button>
                        </div>

                        <div class="token-input-container">
                            <div class="token-input-header">
                                <span class="input-label">{{ $t('swap.buy') }}</span>
                            </div>
                            <div class="input-section">
                                <div class="input-group">
                                    <div class="amount-input">
                                        <div class="input-with-select">
                                            <el-input type="number" v-model="toAmount"
                                                :placeholder="formatNumber(toTokenBalance) + '  ' + $t('available')"
                                                @input="handleToAmountChange" size="large" />
                                            <TokenSelect v-model="toToken" :tokens="availableTokens"
                                                placeholder="Select token" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Swap Details -->
                    <div class="swap-details">
                        <h4 class="details-title">{{ $t('swap.details') }}</h4>
                        <div class="details-content">
                            <!-- Uniswap V4 Status -->
                            <div class="detail-row" v-if="walletStore.isConnected">
                                <span>{{ $t('swap.protocolStatus') }}</span>
                                <span class="status-indicator">
                                    <span v-if="isV4Supported" class="status-supported">✓ {{
                                        $t('swap.uniswapV4Available')
                                        }}</span>
                                    <span v-else class="status-unsupported">
                                        ⚠ {{ $t('swap.v4NotSupported') }}
                                        <el-tooltip :content="$t('swap.switchToSupportedNetwork')" placement="top">
                                            <el-icon class="info-icon">
                                                <InfoFilled />
                                            </el-icon>
                                        </el-tooltip>
                                    </span>
                                </span>
                            </div>

                            <!-- Pool Status -->
                            <div class="detail-row"
                                v-if="isV4Supported && fromToken && toToken && fromToken.symbol !== toToken.symbol">
                                <span>{{ $t('swap.poolStatus') }}</span>
                                <span class="status-indicator">
                                    <span v-if="poolExists" class="status-supported">✓ {{ $t('swap.poolAvailable')
                                        }}</span>
                                    <span v-else class="status-warning">
                                        ⚠ {{ $t('swap.poolNotExists') }}
                                        <el-tooltip :content="$t('swap.poolNotExistsTooltip')" placement="top">
                                            <el-icon class="info-icon">
                                                <InfoFilled />
                                            </el-icon>
                                        </el-tooltip>
                                    </span>
                                </span>
                            </div>

                            <!-- Price Impact -->
                            <div class="detail-row" v-if="currentQuote && poolExists">
                                <span>{{ $t('swap.priceImpact') }}</span>
                                <span class="detail-value" :class="{
                                    'price-impact-low': parseFloat(priceImpact) < 1,
                                    'price-impact-medium': parseFloat(priceImpact) >= 1 && parseFloat(priceImpact) < 3,
                                    'price-impact-high': parseFloat(priceImpact) >= 3
                                }">{{ formatNumber(parseFloat(priceImpact)) }}%</span>
                            </div>

                            <div class="detail-row">
                                <span>{{ $t('swap.fee') }}</span>
                                <span class="detail-value fee-value">{{ formatNumber(swapFee) }}%</span>
                            </div>

                            <div class="detail-row exchange-rate">
                                <span>{{ $t('swap.rate') }}</span>
                                <span v-if="isLoadingQuote" class="detail-value loading-text">{{ $t('swap.fetchingRate')
                                    }}</span>
                                <span v-else-if="exchangeRate > 0 && fromToken && toToken"
                                    class="detail-value rate-value">1 {{
                                        fromToken.symbol }} = {{
                                        formatNumber(exchangeRate) }} {{ toToken.symbol }}</span>
                                <span v-else class="detail-value no-rate-text">{{ $t('swap.enterAmountForRate')
                                    }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Action Button -->
                    <div class="action-container">
                        <el-button class="action-button" type="primary" size="large" :disabled="!canSwap"
                            @click="executeSwap">
                            {{ getSwapButtonText() }}
                        </el-button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Transaction Modal -->
        <TransactionModal v-model:visible="showTransactionModal" :title="$t('swap.swapTransaction')"
            :steps="transactionSteps" :current-step="currentTransactionStep" :status="transactionStatus"
            :transaction-details="transactionDetails" :gas-info="gasInfo" :transaction-hash="transactionHash"
            :error-message="transactionError" @close="handleTransactionModalClose" @retry="retryTransaction" />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useWalletStore } from '@/stores/wallet'
import { formatNumber } from '@/utils/format'
import { useI18n } from 'vue-i18n'
import { Sort, InfoFilled, Setting } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { TOKENS } from '@/constants'
import { uniswapV4Service, type SwapParams, type QuoteResult } from '@/services/uniswapV4'
import TransactionModal from '@/components/common/TransactionModal.vue'
import TokenSelect from '@/components/TokenSelect.vue'
import { ethers, parseUnits } from 'ethers'

// Stores and composables
const walletStore = useWalletStore()
const { t } = useI18n()



// Swap icon rotation state
const swapIconRotation = ref(0)

// Define types
interface Token {
    symbol: string;
    name: string;
    address: string;
    decimals: number;
    balance?: number;
}

// Available tokens for Uniswap V4
const availableTokens = computed<Token[]>(() => {
    const chainId = walletStore.chainId || 11155111

    return [
        {
            symbol: TOKENS.WRMB.symbol,
            name: TOKENS.WRMB.name,
            address: TOKENS.WRMB.addresses[chainId as keyof typeof TOKENS.WRMB.addresses] || TOKENS.WRMB.addresses[11155111] || '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
            decimals: TOKENS.WRMB.decimals
        },
        {
            symbol: TOKENS.USDC.symbol,
            name: TOKENS.USDC.name,
            address: TOKENS.USDC.addresses[chainId as keyof typeof TOKENS.USDC.addresses] || TOKENS.USDC.addresses[11155111] || '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
            decimals: TOKENS.USDC.decimals
        },
        {
            symbol: TOKENS.USDT.symbol,
            name: TOKENS.USDT.name,
            address: TOKENS.USDT.addresses[chainId as keyof typeof TOKENS.USDT.addresses] || TOKENS.USDT.addresses[11155111] || '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
            decimals: TOKENS.USDT.decimals
        }
    ]
})

// Token data
const fromToken = ref<Token>()
const toToken = ref<Token>()

// Initialize tokens
watch(availableTokens, (tokens) => {
    if (tokens.length >= 2) {
        if (!fromToken.value || fromToken.value.symbol !== tokens[0].symbol) {
            fromToken.value = tokens[0]
        }
        if (!toToken.value || toToken.value.symbol !== tokens[1].symbol) {
            toToken.value = tokens[1]
        }
    }
}, { immediate: true })

// Watch for same token selection and auto-swap
watch(fromToken, (newFromToken, oldFromToken) => {
    if (newFromToken && toToken.value && newFromToken.symbol === toToken.value.symbol && oldFromToken) {
        toToken.value = oldFromToken
    }
})

watch(toToken, (newToToken, oldToToken) => {
    if (newToToken && fromToken.value && newToToken.symbol === fromToken.value.symbol && oldToToken) {
        fromToken.value = oldToToken
    }
})

watch(() => walletStore.chainId, (newChainId) => {
    if (newChainId) {
        uniswapV4Service.reinitialize()

        const tokens = availableTokens.value
        if (tokens.length >= 2) {
            fromToken.value = tokens[0]
            toToken.value = tokens[1]
        }

        checkUniswapV4Support()
        checkPoolInfo()

        currentQuote.value = null
        fromAmount.value = ''
        toAmount.value = ''
    }
})

// Amounts
const fromAmount = ref('')
const toAmount = ref('')
const fromTokenBalance = ref('0')
const toTokenBalance = ref('0')

// Swap settings
const slippageOptions = [1.0, 5.0]
const slippage = ref(1.0)
const customSlippage = ref('')
const exchangeRate = ref(6.5)
const swapFee = ref(0.3)

// Uniswap V4 state
const isLoadingQuote = ref(false)
const isSwapping = ref(false)
const currentQuote = ref<QuoteResult | null>(null)
const poolExists = ref(false)
const priceImpact = ref('0')
const isV4Supported = ref(false)

// Transaction Modal state
const showTransactionModal = ref(false)
const currentTransactionStep = ref(0)
const transactionStatus = ref<'pending' | 'loading' | 'success' | 'error'>('pending')
const transactionHash = ref('')
const transactionError = ref('')
const gasInfo = ref<{
    gasLimit: string
    gasPrice: string
    estimatedFee: string
    maxFee: string
} | undefined>(undefined)

// Transaction steps
const transactionSteps = computed(() => [
    {
        label: t('swap.steps.checkAllowance'),
        description: t('swap.steps.checkAllowanceDesc')
    },
    {
        label: t('swap.steps.approve'),
        description: t('swap.steps.approveDesc')
    },
    {
        label: t('swap.steps.swap'),
        description: t('swap.steps.swapDesc')
    },
    {
        label: t('swap.steps.confirm'),
        description: t('swap.steps.confirmDesc')
    }
])

// Transaction details
const transactionDetails = computed(() => [
    {
        label: t('swap.sell'),
        value: `${formatNumber(fromAmount.value, 6)} ${fromToken.value?.symbol || ''}`,
        highlight: true
    },
    {
        label: t('swap.buy'),
        value: `${formatNumber(toAmount.value, 6)} ${toToken.value?.symbol || ''}`,
        highlight: true
    },
    {
        label: t('swap.rate'),
        value: exchangeRate.value > 0 && fromToken.value && toToken.value ? `1 ${fromToken.value.symbol} = ${formatNumber(exchangeRate.value)} ${toToken.value.symbol}` : '--'
    },
    {
        label: t('swap.slippage'),
        value: `${slippage.value}%`
    },
    {
        label: t('swap.fee'),
        value: `${formatNumber(swapFee.value)}%`
    }
])

watch([fromToken, toToken], () => {
    currentQuote.value = null
    updateExchangeRate()
    if (fromAmount.value && parseFloat(fromAmount.value) > 0) {
        getUniswapV4Quote()
    }
})

function updateExchangeRate() {
    if (currentQuote.value && fromAmount.value && parseFloat(fromAmount.value) > 0) {
        const fromAmountNum = parseFloat(fromAmount.value)
        const toAmountNum = parseFloat(currentQuote.value.amountOut)
        exchangeRate.value = toAmountNum / fromAmountNum
    } else if (fromToken.value?.symbol === toToken.value?.symbol) {
        exchangeRate.value = 1
    } else {
        exchangeRate.value = 0
    }
}


const canSwap = computed(() => {
    return walletStore.isConnected &&
        isV4Supported.value &&
        poolExists.value &&
        fromAmount.value &&
        parseFloat(fromAmount.value) > 0 &&
        parseFloat(fromAmount.value) <= parseFloat(fromTokenBalance.value) &&
        !isSwapping.value &&
        fromToken.value?.symbol !== toToken.value?.symbol
})

function handleFromAmountChange() {
    if (fromAmount.value && parseFloat(fromAmount.value) > 0) {
        getUniswapV4Quote()
    } else {
        toAmount.value = ''
        currentQuote.value = null
        updateExchangeRate()
    }
}

function handleToAmountChange() {
    if (toAmount.value && parseFloat(toAmount.value) > 0) {
        // 反向计算需要重新获取报价
        getReverseUniswapV4Quote()
    } else {
        fromAmount.value = ''
        currentQuote.value = null
        updateExchangeRate()
    }
}

const setDepositPercentage = (percentage: number) => {
    if (parseFloat(fromTokenBalance.value) > 0) {
        fromAmount.value = (parseFloat(fromTokenBalance.value) * percentage / 100).toString()
        handleFromAmountChange()
    }
}

function setMaxFromAmount() {
    if (parseFloat(fromTokenBalance.value) > 0) {
        fromAmount.value = fromTokenBalance.value
        handleFromAmountChange()
        ElMessage.success(t('swap.maxAmountSet'))
    } else {
        ElMessage.warning(t('swap.noBalance'))
    }
}

function handleCustomSlippage() {
    if (customSlippage.value) {
        slippage.value = parseFloat(customSlippage.value)
    }
}

function swapTokens() {
    const temp = fromToken.value
    fromToken.value = toToken.value
    toToken.value = temp

    const tempAmount = fromAmount.value
    fromAmount.value = toAmount.value
    toAmount.value = tempAmount

    const tempBalance = fromTokenBalance.value
    fromTokenBalance.value = toTokenBalance.value
    toTokenBalance.value = tempBalance

    exchangeRate.value = 1 / exchangeRate.value

    // Rotate icon by 180 degrees each time
    swapIconRotation.value += 180
}

function getSwapButtonText() {
    if (!walletStore.isConnected) {
        return t('common.connected')
    }

    if (isSwapping.value) {
        return t('swap.swapping')
    }

    if (isLoadingQuote.value) {
        return t('swap.fetchingQuote')
    }

    if (!isV4Supported.value) {
        const supportedNetworks = uniswapV4Service.getSupportedNetworks()
        const networkNames = supportedNetworks.map(id => {
            if (id === 1) return t('swap.mainnet')
            if (id === 11155111) return t('swap.sepoliaTestnet')
            return t('swap.network', { id })
        }).join('、')
        return t('swap.unsupportedNetwork', { networks: networkNames })
    }

    if (!fromAmount.value || parseFloat(fromAmount.value) <= 0) {
        return t('swap.enterAmount')
    }

    if (parseFloat(fromAmount.value) > parseFloat(fromTokenBalance.value)) {
        return t('swap.insufficientBalance')
    }

    return t('swap.swap')
}

function executeSwap() {
    if (!canSwap.value) return

    resetTransactionState()

    showTransactionModal.value = true
    transactionStatus.value = 'loading'
    currentTransactionStep.value = 0

    if (isV4Supported.value && poolExists.value) {
        executeUniswapV4Swap()
    } else {
        transactionStatus.value = 'error'
        transactionError.value = t('swap.networkNotSupportedError')
    }
}

async function getUniswapV4Quote() {
    if (!fromAmount.value || !fromToken.value || !toToken.value || fromToken.value.symbol === toToken.value.symbol) {
        currentQuote.value = null
        toAmount.value = ''
        return
    }

    if (!isV4Supported.value) {
        return
    }

    isLoadingQuote.value = true

    try {
        const swapParams: SwapParams = {
            tokenIn: fromToken.value!.address,
            tokenOut: toToken.value!.address,
            amountIn: fromAmount.value,
            slippage: slippage.value
        }

        const quote = await uniswapV4Service.getQuote(swapParams)

        if (quote) {
            currentQuote.value = quote
            toAmount.value = quote.amountOut
            priceImpact.value = quote.priceImpact
            swapFee.value = parseFloat(quote.fee)
            poolExists.value = true
            updateExchangeRate()
        } else {
            currentQuote.value = null
            toAmount.value = ''
            poolExists.value = false
            updateExchangeRate()

            // ElMessage.warning(t('swap.cannotGetQuote', { fromToken: fromToken.value?.symbol, toToken: toToken.value?.symbol }))
        }
    } catch (error) {
        currentQuote.value = null
        toAmount.value = ''
        poolExists.value = false
        updateExchangeRate()

        ElMessage.error(t('swap.getQuoteFailed', { error: (error as Error).message }))
    } finally {
        isLoadingQuote.value = false
    }
}

async function getReverseUniswapV4Quote() {
    if (!toAmount.value || !fromToken.value || !toToken.value || fromToken.value.symbol === toToken.value.symbol) {
        currentQuote.value = null
        fromAmount.value = ''
        return
    }

    if (!isV4Supported.value) {
        return
    }

    isLoadingQuote.value = true

    try {
        // 反向报价：交换tokenIn和tokenOut，使用toAmount作为amountIn
        const swapParams: SwapParams = {
            tokenIn: toToken.value!.address,
            tokenOut: fromToken.value!.address,
            amountIn: toAmount.value,
            slippage: slippage.value
        }

        const quote = await uniswapV4Service.getQuote(swapParams)

        if (quote) {
            // 反向报价的结果需要设置到fromAmount
            fromAmount.value = quote.amountOut
            // 保存反向报价结果，但需要注意这是反向的
            currentQuote.value = quote
            priceImpact.value = quote.priceImpact
            swapFee.value = parseFloat(quote.fee)
            poolExists.value = true
            updateExchangeRate()
        } else {
            currentQuote.value = null
            fromAmount.value = ''
            poolExists.value = false
            updateExchangeRate()
        }
    } catch (error) {
        currentQuote.value = null
        fromAmount.value = ''
        poolExists.value = false
        updateExchangeRate()

        ElMessage.error(t('swap.getReverseQuoteFailed', { error: (error as Error).message }))
    } finally {
        isLoadingQuote.value = false
    }
}


async function executeUniswapV4Swap() {
    if (!currentQuote.value || isSwapping.value) return

    isSwapping.value = true

    try {
        const swapParams: SwapParams = {
            tokenIn: fromToken.value!.address,
            tokenOut: toToken.value!.address,
            amountIn: fromAmount.value,
            slippage: slippage.value
        }

        if (!uniswapV4Service.isNetworkSupported(walletStore.chainId)) {
            transactionStatus.value = 'error'
            transactionError.value = t('swap.networkNotSupportedV4')
            return
        }

        await uniswapV4Service.reinitialize()

        const userAddress = walletStore.address
        if (!userAddress) {
            transactionStatus.value = 'error'
            transactionError.value = t('swap.connectWalletFirst')
            return
        }

        const quote = await uniswapV4Service.getQuote(swapParams)
        if (!quote) {
            transactionStatus.value = 'error'
            transactionError.value = t('swap.cannotGetQuoteError')
            return
        }

        currentTransactionStep.value = 0
        transactionStatus.value = 'loading'

        const addresses = uniswapV4Service.getContractAddresses(walletStore.chainId)
        const PERMIT2_ADDRESS = addresses.PERMIT2

        const permit2Allowance = await uniswapV4Service.checkAllowance(
            swapParams.tokenIn,
            PERMIT2_ADDRESS,
            userAddress
        )

        const tokenInContract = uniswapV4Service.getTokenContract(swapParams.tokenIn, true)
        const tokenInDecimals = await tokenInContract.decimals()
        const amountIn = parseUnits(swapParams.amountIn, tokenInDecimals)

        if (BigInt(permit2Allowance) < BigInt(amountIn)) {
            currentTransactionStep.value = 1
            transactionStatus.value = 'pending'

            const approveSuccess = await uniswapV4Service.approveToken(
                swapParams.tokenIn,
                PERMIT2_ADDRESS,
                ethers.MaxUint256.toString()
            )

            if (!approveSuccess) {
                transactionStatus.value = 'error'
                transactionError.value = t('swap.permit2AuthFailed')
                return
            }
        }
        const permit2Contract = new ethers.Contract(
            PERMIT2_ADDRESS,
            [
                'function allowance(address owner, address token, address spender) external view returns (uint160 amount, uint48 expiration, uint48 nonce)'
            ],
            uniswapV4Service.provider
        )

        const permit2AllowanceData = await permit2Contract.allowance(
            userAddress,
            swapParams.tokenIn,
            addresses.UNIVERSAL_ROUTER
        )

        if (BigInt(permit2AllowanceData.amount) < BigInt(amountIn)) {
            currentTransactionStep.value = 1
            transactionStatus.value = 'pending'

            const deadline = Math.floor(Date.now() / 1000) + (30 * 24 * 3600)
            const permit2ContractWithSigner = new ethers.Contract(
                PERMIT2_ADDRESS,
                [
                    'function approve(address token, address spender, uint160 amount, uint48 expiration) external'
                ],
                uniswapV4Service.signer
            )

            const permit2ApproveTx = await permit2ContractWithSigner.approve(
                swapParams.tokenIn,
                addresses.UNIVERSAL_ROUTER,
                "1461501637330902918203684832716283019655932542975",
                deadline
            )
            await permit2ApproveTx.wait()
        }

        currentTransactionStep.value = 2
        transactionStatus.value = 'loading'


        const tokenOutContract = uniswapV4Service.getTokenContract(swapParams.tokenOut)
        const tokenOutDecimals = await tokenOutContract.decimals()
        const amountOutBigInt = parseUnits(quote.amountOut, tokenOutDecimals)
        const slippageMultiplier = BigInt(Math.floor((100 - swapParams.slippage) * 100))
        const minAmountOut = amountOutBigInt * slippageMultiplier / BigInt(10000)

        const poolKey = {
            currency0: swapParams.tokenIn < swapParams.tokenOut ? swapParams.tokenIn : swapParams.tokenOut,
            currency1: swapParams.tokenIn < swapParams.tokenOut ? swapParams.tokenOut : swapParams.tokenIn,
            fee: 500,
            tickSpacing: 10,
            hooks: ethers.ZeroAddress
        }

        if (poolKey.currency0 == '0x45Dd667b7C97F7c7B9135dA7f8674dF7d6662737' || poolKey.currency1 == '0x45Dd667b7C97F7c7B9135dA7f8674dF7d6662737') {
            poolKey.hooks = '0x7d08875f51879bedD9a01d71a804f012e1304fC0'
        }

        const zeroForOne = poolKey.currency0 === swapParams.tokenIn
        const deadline = Math.floor(Date.now() / 1000) + 3600


        const Actions = {
            SWAP_EXACT_IN_SINGLE: 0x06,
            SETTLE_ALL: 0x0c,
            TAKE_ALL: 0x0f
        }

        const CommandType = {
            V4_SWAP: 0x10
        }

        const POOL_KEY_STRUCT = '(address currency0,address currency1,uint24 fee,int24 tickSpacing,address hooks)'
        const SWAP_EXACT_IN_SINGLE_STRUCT = '(' + POOL_KEY_STRUCT + ' poolKey,bool zeroForOne,uint128 amountIn,uint128 amountOutMinimum,bytes hookData)'

        let v4Actions = '0x'
        const v4Params: string[] = []

        const swapParamsForTx = {
            poolKey: poolKey,
            zeroForOne: zeroForOne,
            amountIn: amountIn,
            amountOutMinimum: minAmountOut,
            hookData: '0x'
        }

        const swapEncodedParam = ethers.AbiCoder.defaultAbiCoder().encode(
            [SWAP_EXACT_IN_SINGLE_STRUCT],
            [swapParamsForTx]
        )
        v4Params.push(swapEncodedParam)
        v4Actions = v4Actions + Actions.SWAP_EXACT_IN_SINGLE.toString(16).padStart(2, '0')

        const settleEncodedParam = ethers.AbiCoder.defaultAbiCoder().encode(
            ['address', 'uint256'],
            [swapParams.tokenIn, amountIn]
        )
        v4Params.push(settleEncodedParam)
        v4Actions = v4Actions + Actions.SETTLE_ALL.toString(16).padStart(2, '0')

        const takeEncodedParam = ethers.AbiCoder.defaultAbiCoder().encode(
            ['address', 'uint256'],
            [swapParams.tokenOut, minAmountOut]
        )
        v4Params.push(takeEncodedParam)
        v4Actions = v4Actions + Actions.TAKE_ALL.toString(16).padStart(2, '0')

        const encodedV4Actions = ethers.AbiCoder.defaultAbiCoder().encode(
            ['bytes', 'bytes[]'],
            [v4Actions, v4Params]
        )

        let commands = '0x'
        const inputs: string[] = []

        inputs.push(encodedV4Actions)
        commands = commands + CommandType.V4_SWAP.toString(16).padStart(2, '0')


        const txOptions: any = {
            value: swapParams.tokenIn === ethers.ZeroAddress ? amountIn : 0
        }


        const swapRouterContract = uniswapV4Service.swapRouterContract
        const tx = await swapRouterContract!.execute(
            commands,
            inputs,
            deadline,
            txOptions
        )

        currentTransactionStep.value = 3
        transactionStatus.value = 'loading'

        const receipt = await tx.wait()
        transactionHash.value = receipt.hash

        transactionStatus.value = 'success'
        setTimeout(() => {
            fromAmount.value = ''
            toAmount.value = ''
            currentQuote.value = null
            priceImpact.value = '0'
            swapFee.value = 0.3
        }, 2000)

        await updateTokenBalances()

        await checkPoolInfo()
    } catch (error) {
        const errorMessage = (error as Error).message

        transactionStatus.value = 'error'

        if (errorMessage.includes('insufficient funds')) {
            transactionError.value = t('swap.insufficientFundsError')
        } else if (errorMessage.includes('allowance')) {
            transactionError.value = t('swap.allowanceError')
        } else if (errorMessage.includes('slippage')) {
            transactionError.value = t('swap.slippageError')
        } else if (errorMessage.includes('pool')) {
            transactionError.value = t('swap.poolError')
        } else {
            transactionError.value = t('swap.swapFailedError', { error: errorMessage })
        }
    } finally {
        isSwapping.value = false
    }
}

async function checkUniswapV4Support() {
    if (!walletStore.isConnected || !walletStore.chainId) {
        isV4Supported.value = false
        return
    }

    isV4Supported.value = uniswapV4Service.isNetworkSupported(walletStore.chainId)
}

async function checkPoolInfo() {
    if (!fromToken.value || !toToken.value || fromToken.value.symbol === toToken.value.symbol) {
        poolExists.value = false
        return
    }

    if (!walletStore.isConnected || !walletStore.chainId) {
        poolExists.value = false
        return
    }

    if (!isV4Supported.value) {
        poolExists.value = false
        return
    }

    try {
        const poolInfo = await uniswapV4Service.getPoolInfo(
            fromToken.value.address,
            toToken.value.address,
            500
        )

        poolExists.value = poolInfo !== null
    } catch (error) {
        poolExists.value = false
    }
}

watch([fromToken, toToken], async () => {
    if (walletStore.isConnected) {
        await updateTokenBalances()
        await checkPoolInfo()
        if (fromAmount.value) {
            await getUniswapV4Quote()
        }
    }
})

watch(() => walletStore.isConnected, async (connected) => {
    if (connected) {
        await uniswapV4Service.reinitialize()
        await checkUniswapV4Support()
        await updateTokenBalances()
        await checkPoolInfo()
    } else {
        isV4Supported.value = false
        poolExists.value = false
        currentQuote.value = null
    }
})

watch(() => walletStore.chainId, async (newChainId) => {
    if (newChainId && walletStore.isConnected) {
        await uniswapV4Service.reinitialize()
        await checkUniswapV4Support()
        availableTokens.value.forEach(token => {
            if (token.symbol === 'WRMB') {
                token.address = TOKENS.WRMB.addresses[newChainId as keyof typeof TOKENS.WRMB.addresses] || token.address
            } else if (token.symbol === 'USDC') {
                token.address = TOKENS.USDC.addresses[newChainId as keyof typeof TOKENS.USDC.addresses] || token.address
            }
        })
        await checkPoolInfo()
    }
})

async function updateTokenBalances() {
    if (!walletStore.isConnected || !walletStore.address) {
        fromTokenBalance.value = '0'
        toTokenBalance.value = '0'
        return
    }

    try {
        const [fromBalance, toBalance] = await Promise.all([
            uniswapV4Service.getTokenBalance(fromToken.value!.address, walletStore.address),
            uniswapV4Service.getTokenBalance(toToken.value!.address, walletStore.address)
        ])

        fromTokenBalance.value = fromBalance
        toTokenBalance.value = toBalance
    } catch (error) {
        fromTokenBalance.value = '1000'
        toTokenBalance.value = '500'
    }
}


function resetTransactionState() {
    currentTransactionStep.value = 0
    transactionStatus.value = 'pending'
    transactionHash.value = ''
    transactionError.value = ''
    gasInfo.value = undefined
}

function handleTransactionModalClose() {
    showTransactionModal.value = false
    resetTransactionState()
}

function retryTransaction() {
    resetTransactionState()
    executeSwap()
}

onMounted(async () => {
    await checkUniswapV4Support()
    await updateTokenBalances()
    updateExchangeRate()
    await checkPoolInfo()
})
</script>

<style scoped>
.swap {
    @apply bg-gray-50 dark:bg-gray-900;
}

.swap-content {
    @apply max-w-4xl mx-auto px-6 py-8 space-y-8;
}

.section-title {
    @apply text-2xl font-bold text-gray-900 dark:text-white mb-6;
}

.swap-interface {
    @apply mb-8;
}

.interface-card {
    @apply bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-all duration-200 hover:shadow-md relative;
}

.settings-icon {
    @apply absolute top-4 right-4 cursor-pointer;
}

.settings-btn {
    @apply w-5 h-5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-200;
}

.settings-content {
    @apply space-y-4;
}

.settings-title {
    @apply text-sm font-semibold text-gray-900 dark:text-white mb-3 border-b border-gray-200 dark:border-gray-600 pb-2;
}

.token-selection {
    @apply flex flex-col;
}

.token-input-container {
    @apply w-full;
}

.token-input-header {
    @apply flex justify-between mb-2 text-sm text-gray-600 dark:text-gray-400;
}

.input-label {
    @apply text-sm font-medium text-gray-700 dark:text-gray-300;
}

.input-section {
    @apply space-y-4 mb-6;
}

.input-group {
    @apply flex flex-col space-y-3;
}

.amount-input {
    @apply flex-1;
}

.token-selector {
    @apply flex items-center gap-2 p-2 cursor-pointer;
}

.quick-amounts {
    @apply flex space-x-2;
}

.max-button {
    @apply text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300;
}

.input-with-select {
    @apply flex w-full;
}

.input-with-select .el-input {
    @apply flex-1;
}

.token-select {
    @apply ml-2 w-32;
}



.swap-direction {
    @apply flex justify-center;
}

.swap-direction-btn {
    @apply bg-primary-50 dark:bg-primary-900 border-primary-200 dark:border-primary-700 hover:bg-primary-100 dark:hover:bg-primary-800;
}

.swap-icon {
    @apply text-primary-600 dark:text-primary-400 transition-transform duration-200;
}

.swap-details {
    @apply bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mt-6;
}

.details-title {
    @apply text-sm font-medium text-gray-700 dark:text-gray-300 mb-3;
}

.details-content {
    @apply space-y-2;
}

.detail-row {
    @apply flex items-center justify-between text-sm;
}

.detail-row span:first-child:not(.status-supported):not(.status-unsupported):not(.status-warning):not(.network-mainnet) {
    @apply text-gray-600 dark:text-gray-400;
}

.detail-row.exchange-rate {
    @apply border-t border-gray-200 dark:border-gray-600 pt-2 mt-2;
}

.detail-value {
    @apply font-medium text-gray-900 dark:text-white;
}

.fee-value {
    @apply text-yellow-600 dark:text-yellow-400 font-medium;
}

.rate-value {
    @apply text-primary-600 dark:text-primary-400 font-semibold;
}

.no-rate-text {
    @apply text-gray-500 dark:text-gray-400;
}

/* Status indicators */
.status-indicator {
    @apply flex items-center gap-1;
}

.status-supported {
    @apply text-green-600 dark:text-green-400 font-medium;
}

.status-unsupported {
    @apply text-red-600 dark:text-red-400 font-medium flex items-center gap-1;
}

.status-warning {
    @apply text-yellow-600 dark:text-yellow-400 font-medium flex items-center gap-1;
}

.network-mainnet {
    @apply text-green-600 dark:text-green-400 font-medium;
}

.network-testnet {
    @apply text-yellow-600 dark:text-yellow-400 font-medium;
}

.network-unknown {
    @apply text-red-600 dark:text-red-400 font-medium;
}

.info-icon {
    @apply w-4 h-4 cursor-help;
}

.loading-text {
    @apply text-blue-500 dark:text-blue-400 animate-pulse;
}

.no-rate-text {
    @apply text-gray-500 dark:text-gray-400;
}

/* Price impact colors */
.price-impact-low {
    @apply text-green-600 dark:text-green-400;
}

.price-impact-medium {
    @apply text-yellow-600 dark:text-yellow-400;
}

.price-impact-high {
    @apply text-red-600 dark:text-red-400 font-semibold;
}

.slippage-selector {
    @apply flex gap-2;
}

.slippage-selector button {
    @apply py-1 px-2 rounded bg-gray-50 dark:bg-gray-700 border border-transparent cursor-pointer text-xs;
}

.detail-item {
    @apply flex items-center justify-between;
}

.slippage-selector button.active {
    @apply bg-primary-50 dark:bg-primary-900 border-primary-500 text-primary-600 dark:text-primary-400;
}

.custom-slippage {
    @apply flex items-center bg-gray-50 dark:bg-gray-700 rounded px-2;
}

.custom-slippage input {
    @apply w-12 bg-transparent border-none py-1 text-xs outline-none;
}

.action-container {
    @apply mt-6;
}

.action-button {
    @apply w-full;
}

.swap-button:hover {
    @apply bg-primary-600;
}

.swap-button:disabled {
    @apply bg-gray-300 dark:bg-gray-600 cursor-not-allowed;
}

/* Liquidity Pools Section */
.liquidity-section {
    @apply bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6;
}

.pools-grid {
    @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6;
}

.pool-card {
    @apply bg-gray-50 dark:bg-gray-700 rounded-xl p-6 shadow-sm;
}

.pool-header {
    @apply flex justify-between items-center mb-4;
}

.pool-tokens {
    @apply flex items-center;
}

.token-icon-overlap {
    @apply -ml-2;
}

.pool-fee {
    @apply bg-gray-100 dark:bg-gray-600 py-1 px-2 rounded text-xs;
}

.pool-stats {
    @apply grid grid-cols-3 gap-2 mb-6;
}

.stat-item {
    @apply flex flex-col;
}

.stat-label {
    @apply text-xs text-gray-600 dark:text-gray-400;
}

.stat-value {
    @apply font-semibold text-sm text-gray-900 dark:text-white;
}

.pool-actions {
    @apply flex gap-3;
}

.action-btn {
    @apply flex-1 py-3 rounded-lg font-semibold text-sm cursor-pointer text-center bg-primary-500 text-white border-none;
}

.action-btn.outline {
    @apply bg-transparent border border-primary-500 text-primary-600 dark:text-primary-400;
}

/* Status indicators */
.status-indicator {
    @apply flex items-center;
}

.status-supported {
    @apply text-green-600 dark:text-green-400 font-medium;
}

.status-unsupported {
    @apply text-red-600 dark:text-red-400 font-medium;
}

.status-warning {
    @apply text-yellow-600 dark:text-yellow-400 font-medium;
}

.loading-text {
    @apply text-blue-600 dark:text-blue-400 animate-pulse;
}

/* Price impact colors */
.price-impact-low {
    @apply text-green-600 dark:text-green-400;
}

.price-impact-medium {
    @apply text-yellow-600 dark:text-yellow-400;
}

.price-impact-high {
    @apply text-red-600 dark:text-red-400 font-semibold;
}

/* Uniswap V4 specific styles */
.v4-badge {
    @apply inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200;
}

.pool-status {
    @apply flex items-center gap-2;
}

.pool-status-dot {
    @apply w-2 h-2 rounded-full;
}

.pool-status-dot.active {
    @apply bg-green-500;
}

.pool-status-dot.inactive {
    @apply bg-red-500;
}

.pool-status-dot.warning {
    @apply bg-yellow-500;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .swap-content {
        @apply px-4 py-6;
    }

    .status-indicator {
        @apply text-sm;
    }

    .detail-item {
        @apply text-sm;
    }

    .pools-grid {
        @apply grid-cols-1;
    }

    .pool-stats {
        @apply grid-cols-2;
    }
}

:deep(.el-tabs__header) {
    @apply mb-0;
}

:deep(.el-tabs__nav-wrap::after) {
    @apply bg-gray-200 dark:bg-gray-700;
}

:deep(.el-tabs__active-bar) {
    @apply bg-primary-500;
}

:deep(.el-tabs__item) {
    @apply text-gray-600 dark:text-gray-400;
}

:deep(.el-tabs__item.is-active) {
    @apply text-primary-600 dark:text-primary-400;
}
</style>