const fs = require('fs');
const path = require('path');

// 读取多语言文件
const enTranslations = JSON.parse(fs.readFileSync('/data/hdl_work/web3/wrmb/wrmb-dapp/src/locales/en.json', 'utf8'));
const zhTranslations = JSON.parse(fs.readFileSync('/data/hdl_work/web3/wrmb/wrmb-dapp/src/locales/zh.json', 'utf8'));

// 从正则搜索结果中提取的所有使用的翻译键
const usedKeys = [
  // Dashboard.vue
  'dashboard.title', 'dashboard.welcome', 'dashboard.connectWallet', 'dashboard.connectDescription',
  'dashboard.portfolio', 'dashboard.totalValue', 'dashboard.savingsLiquidity', 'dashboard.activeBonds',
  'dashboard.invested', 'dashboard.currentAPY', 'dashboard.annualReturn', 'dashboard.quickActions',
  'dashboard.savingsDescription', 'dashboard.wrapDescription', 'dashboard.bondsDescription',
  'dashboard.recentActivity', 'dashboard.viewAll', 'dashboard.noActivity', 'dashboard.bondInvestments',
  'dashboard.recentTransactions', 'dashboard.depositToSavings', 'dashboard.wrapTokens', 'dashboard.buyBonds',
  'dashboard.viewPortfolio', 'dashboard.depositSavings', 'dashboard.depositDescription',
  'dashboard.bondSubscription', 'dashboard.bondDescription',
  
  // NotFound.vue
  'error.pageNotFound', 'error.pageNotFoundDescription', 'error.goHome', 'error.goBack',
  'error.helpfulLinks', 'error.searchSuggestion', 'error.searchPlaceholder',
  
  // App.vue
  'common.appName',
  
  // Mining.vue
  'mining.title', 'mining.overview', 'mining.apy', 'mining.deposit', 'mining.withdraw', 'mining.claim',
  'mining.enterAmount', 'mining.usdtBalance', 'mining.depositedBalance', 'mining.preview',
  'mining.youWillReceive', 'mining.withdrawFee', 'mining.exchangeRate', 'mining.depositSuccess',
  'mining.depositFailed', 'mining.withdrawSuccess', 'mining.withdrawFailed', 'mining.claimSuccess',
  'mining.claimFailed', 'mining.dailyReward', 'mining.yourMined', 'mining.estimatedCINA',
  'mining.remainingDeposited', 'mining.withdrawCINA', 'mining.withdrawFeeWarning',
  
  // Staking.vue
  'staking.title', 'staking.overview', 'staking.yourStaked', 'staking.apy', 'staking.stakeCINA',
  'staking.unstakeCINA', 'staking.claimRewards', 'staking.enterCINAAmount', 'staking.cinaBalance',
  'staking.stakedBalance', 'staking.stakedAmount', 'staking.vault', 'staking.annualizedReturn',
  'staking.preview', 'staking.youWillReceive', 'staking.dailyReward', 'staking.exchangeRate',
  'staking.minStakeWarning', 'staking.earlyUnstakeWarning', 'staking.penalty', 'staking.stakingPeriod',
  'staking.stakeSuccess', 'staking.stakeFailed', 'staking.unstakeSuccess', 'staking.unstakeFailed',
  'staking.claimSuccess', 'staking.claimFailed', 'staking.history', 'staking.lastClaim',
  'staking.stakingTime', 'staking.rewardRate', 'staking.availableRewards',
  
  // Savings.vue
  'savings.title', 'savings.description', 'savings.subtitle', 'savings.vaultOverview',
  'savings.navDescription', 'savings.annualYield', 'savings.depositWRMB', 'savings.withdrawWRMB',
  'savings.enterAmount', 'savings.preview', 'savings.youWillReceive', 'savings.sharePrice',
  'savings.newBalance', 'savings.sWRMBBalance', 'savings.statistics', 'savings.totalSupply',
  'savings.yourShare', 'savings.totalValue', 'savings.yourValue', 'savings.deposit',
  'savings.withdraw', 'savings.yourBalance', 'savings.wrmbBalance', 'savings.totalAssets',
  'savings.currentNAV', 'savings.currentPrice', 'savings.priceDescription', 'savings.exchangeRate',
  'savings.exchangeRateDescription', 'savings.apy', 'savings.sharePercentage', 'savings.assetValue',
  'savings.depositAmount', 'savings.withdrawAmount', 'savings.expectedShares', 'savings.expectedAssets',
  'savings.estimatedShares', 'savings.estimatedAssets', 'savings.minimumDeposit', 'savings.maximumDeposit',
  'savings.depositSuccess', 'savings.withdrawSuccess', 'savings.approvalRequired', 'savings.approveWRMB',
  'savings.depositing', 'savings.withdrawing', 'savings.insufficientBalance', 'savings.invalidAmount',
  'savings.depositTransaction', 'savings.withdrawTransaction', 'savings.depositFailed',
  'savings.withdrawFailed', 'savings.availableToWithdraw', 'savings.sharesRequired',
  'savings.currentExchangeRate', 'savings.externalShares', 'savings.externalSharesDescription',
  'savings.fee',
  
  // Bonds.vue
  'bonds.title', 'bonds.description', 'bonds.subtitle', 'bonds.subscribe', 'bonds.mature',
  'bonds.bondPool', 'bonds.myBonds', 'bonds.poolStats', 'bonds.poolOverview', 'bonds.totalPoolSize',
  'bonds.totalCapacity', 'bonds.activeBonds', 'bonds.totalBonds', 'bonds.currentRate',
  'bonds.annualRate', 'bonds.availableCapacity', 'bonds.remaining', 'bonds.subscribeWithUSDT',
  'bonds.usdtBalance', 'bonds.enterAmount', 'bonds.bondTerms', 'bonds.duration',
  'bonds.minimumAmount', 'bonds.maximumAmount', 'bonds.preview', 'bonds.principalAmount',
  'bonds.wrmbReceived', 'bonds.maturityDate', 'bonds.expectedReturn', 'bonds.subscribeBond',
  'bonds.yourBonds', 'bonds.allBonds', 'bonds.maturedBonds', 'bonds.noBonds',
  'bonds.subscribeDate', 'bonds.currentValue', 'bonds.completed', 'bonds.redeem',
  'bonds.subscriptionAmount', 'bonds.bondDuration', 'bonds.interestRate', 'bonds.expectedReward',
  'bonds.maturityTime', 'bonds.subscriptionOpen', 'bonds.subscriptionClosed', 'bonds.bondId',
  'bonds.principal', 'bonds.wrmbAmount', 'bonds.subscribeTime', 'bonds.status', 'bonds.active',
  'bonds.matured', 'bonds.canMature', 'bonds.timeToMaturity', 'bonds.subscribeSuccess',
  'bonds.matureSuccess', 'bonds.subscribing', 'bonds.maturing', 'bonds.minimumSubscription',
  'bonds.maximumSubscription', 'bonds.userLimit', 'bonds.poolCapacityExceeded',
  'bonds.compoundInterest', 'bonds.days', 'bonds.hours', 'bonds.minutes', 'bonds.inactive',
  'bonds.daysRemaining', 'bonds.subscriptionTransaction', 'bonds.subscriptionFailed',
  'bonds.redeemSuccess', 'bonds.redeemFailed', 'bonds.approvalSuccess', 'bonds.approvalFailed',
  'bonds.bondNotMatured',
  
  // WalletConnect.vue
  'wallet.connectWallet', 'wallet.disconnectWallet', 'wallet.walletConnected',
  'wallet.walletDisconnected', 'wallet.switchNetwork', 'wallet.networkNotSupported',
  'wallet.installMetaMask', 'wallet.connectionFailed', 'wallet.address', 'wallet.network',
  'wallet.ethBalance', 'wallet.connect', 'wallet.disconnect', 'wallet.confirmDisconnect',
  'wallet.disconnected', 'wallet.copyAddress', 'wallet.addressCopied', 'wallet.copyFailed',
  'wallet.viewOnExplorer', 'wallet.wrongNetwork', 'wallet.switchToMainnet',
  'wallet.networkSwitched', 'wallet.networkSwitchFailed', 'wallet.connectionError',
  'wallet.selectNetwork',
  
  // Swap.vue
  'swap.title', 'swap.from', 'swap.to', 'swap.balance', 'swap.enterAmount', 'swap.rate',
  'swap.fee', 'swap.slippage', 'swap.swap', 'swap.insufficientBalance', 'swap.connectWallet',
  'swap.liquidityPools', 'swap.tvl', 'swap.volume24h', 'swap.apr', 'swap.addLiquidity',
  'swap.removeLiquidity', 'swap.maxAmountSet', 'swap.noBalance', 'swap.swapTransaction',
  'swap.protocolStatus', 'swap.poolStatus', 'swap.priceImpact', 'swap.uniswapV4Available',
  'swap.v4NotSupported', 'swap.switchToSupportedNetwork', 'swap.poolAvailable',
  'swap.poolNotExists', 'swap.poolNotExistsTooltip', 'swap.fetchingRate',
  'swap.enterAmountForRate', 'swap.swapping', 'swap.fetchingQuote', 'swap.unsupportedNetwork',
  'swap.mainnet', 'swap.sepoliaTestnet', 'swap.network', 'swap.selectDifferentTokens',
  'swap.poolNotExistsCreateFirst', 'swap.networkNotSupportedError', 'swap.cannotGetQuote',
  'swap.getQuoteFailed', 'swap.networkNotSupportedV4', 'swap.connectWalletFirst',
  'swap.cannotGetQuoteError', 'swap.permit2AuthFailed', 'swap.insufficientFundsError',
  'swap.allowanceError', 'swap.slippageError', 'swap.poolError', 'swap.swapFailedError',
  'swap.steps.checkAllowance', 'swap.steps.checkAllowanceDesc', 'swap.steps.approve',
  'swap.steps.approveDesc', 'swap.steps.swap', 'swap.steps.swapDesc', 'swap.steps.confirm',
  'swap.steps.confirmDesc',
  
  // Portfolio.vue
  'portfolio.title', 'portfolio.subtitle', 'portfolio.export', 'portfolio.overview',
  'portfolio.totalValue', 'portfolio.totalInvested', 'portfolio.principalAmount',
  'portfolio.totalReturns', 'portfolio.totalReturn', 'portfolio.avgAPY',
  'portfolio.weightedAverage', 'portfolio.assetAllocation', 'portfolio.chart',
  'portfolio.table', 'portfolio.asset', 'portfolio.balance', 'portfolio.value',
  'portfolio.allocation', 'portfolio.change24h', 'portfolio.performance',
  'portfolio.highestValue', 'portfolio.lowestValue', 'portfolio.volatility',
  'portfolio.holdings', 'portfolio.allHoldings', 'portfolio.savingsOnly',
  'portfolio.bondsOnly', 'portfolio.wrappedOnly', 'portfolio.avgPrice',
  'portfolio.currentPrice', 'portfolio.pnl', 'portfolio.manageSavings',
  'portfolio.manageBonds', 'portfolio.manageWrap', 'portfolio.transactionHistory',
  'portfolio.allTransactions', 'portfolio.deposits', 'portfolio.withdrawals',
  'portfolio.swaps', 'portfolio.type', 'portfolio.amount', 'portfolio.date',
  'portfolio.txHash', 'portfolio.savingsValue', 'portfolio.bondValue',
  'portfolio.tokenBalances', 'portfolio.transactions', 'portfolio.earnings',
  'portfolio.yield', 'portfolio.lastUpdate', 'portfolio.dataRefreshed',
  'portfolio.refreshFailed', 'portfolio.exportSuccess', 'portfolio.savings',
  'portfolio.bonds', 'portfolio.wrapped', 'portfolio.deposit', 'portfolio.withdraw',
  'portfolio.swap',
  
  // TransactionModal.vue
  'transaction.pending', 'transaction.confirmed', 'transaction.failed', 'transaction.hash',
  'transaction.viewOnExplorer', 'transaction.gasUsed', 'transaction.gasPrice',
  'transaction.blockNumber', 'transaction.timestamp', 'transaction.approve',
  'transaction.approveDescription', 'transaction.confirm', 'transaction.confirmDescription',
  'transaction.complete', 'transaction.completeDescription', 'transaction.details',
  'transaction.gasFee', 'transaction.estimatedFee', 'transaction.gasLimit',
  'transaction.maxFee', 'transaction.confirmInWallet', 'transaction.success',
  'transaction.title', 'transaction.hashCopied', 'transaction.copyFailed',
  
  // Wrap.vue
  'wrap.title', 'wrap.description', 'wrap.subtitle', 'wrap.balanceOverview', 'wrap.balance',
  'wrap.totalBalance', 'wrap.availableToWrap', 'wrap.availableToUnwrap', 'wrap.unwrappableAmount',
  'wrap.maxUnwrappableAmount', 'wrap.from', 'wrap.to', 'wrap.enterAmount', 'wrap.estimatedAmount',
  'wrap.transactionDetails', 'wrap.exchangeRate', 'wrap.fee', 'wrap.minimumReceived',
  'wrap.priceImpact', 'wrap.wrapTokens', 'wrap.unwrapTokens', 'wrap.whatIsWrapping',
  'wrap.wrappingDescription', 'wrap.fees', 'wrap.feesDescription', 'wrap.risks',
  'wrap.risksDescription', 'wrap.wrap', 'wrap.unwrap', 'wrap.wrapSRMB', 'wrap.unwrapSWRMB',
  'wrap.sRMBBalance', 'wrap.sWRMBBalance', 'wrap.wrapAmount', 'wrap.unwrapAmount',
  'wrap.wrapFee', 'wrap.unwrapFee', 'wrap.expectedReceive', 'wrap.expectedWRMB',
  'wrap.minimumWrap', 'wrap.maximumWrap', 'wrap.minimumUnwrap', 'wrap.maximumUnwrap',
  'wrap.wrapSuccess', 'wrap.unwrapSuccess', 'wrap.wrapping', 'wrap.unwrapping',
  'wrap.switchDirection', 'wrap.liquidityAvailable', 'wrap.inputAmount', 'wrap.outputAmount',
  'wrap.wrapTransaction', 'wrap.unwrapTransaction', 'wrap.wrapFailed', 'wrap.unwrapFailed',
  'wrap.insufficientUnwrappableAmount', 'wrap.desiredAmount', 'wrap.requiredBurn',
  'wrap.estimatedBurn', 'wrap.actualReceived', 'wrap.sWRMBRequired', 'wrap.enterDesiredAmount',
  'wrap.totalReserveTransferred', 'wrap.reserveTransferredDescription', 'wrap.invalidAmount',
  'wrap.insufficientBalance', 'wrap.belowMinAmount', 'wrap.aboveMaxAmount',
  'wrap.belowMinUnwrapAmount', 'wrap.aboveMaxUnwrapAmount', 'wrap.waitTimeRemaining',
  'wrap.availableAt', 'wrap.waitingForCooldown',
  
  // AppHeader.vue
  'navigation.dashboard', 'navigation.savings', 'navigation.mining', 'navigation.staking',
  'navigation.wrap', 'navigation.swap', 'navigation.bonds', 'navigation.portfolio',
  'navigation.status', 'common.language',
  
  // Status.vue
  'status.title', 'status.selectNetwork', 'status.refresh', 'status.refreshData',
  'status.tokenContracts', 'status.smartContracts', 'status.precision', 'status.totalSupply',
  'status.myBalance', 'status.address', 'status.notDeployed', 'status.viewOnExplorer',
  'status.copyAddress', 'status.queryBalance', 'status.quickTransfer', 'status.contract',
  'status.queryBalanceModal.title', 'status.queryBalanceModal.walletAddress',
  'status.queryBalanceModal.placeholder', 'status.queryBalanceModal.query',
  'status.queryBalanceModal.querying', 'status.queryBalanceModal.cancel',
  'status.queryBalanceModal.results', 'status.transferModal.title',
  'status.transferModal.receiverAddress', 'status.transferModal.receiverPlaceholder',
  'status.transferModal.transferAmount', 'status.transferModal.amountPlaceholder',
  'status.transferModal.availableBalance', 'status.transferModal.confirmTransfer',
  'status.transferModal.transferring', 'status.transferModal.cancel',
  'status.toast.addressCopied', 'status.toast.transactionSubmitted',
  'status.toast.transferSubmitted', 'status.toast.transferSuccess',
  'status.toast.transferFailed', 'status.toast.queryFailed',
  
  // Common keys
  'common.loading', 'common.connect', 'common.disconnect', 'common.connected',
  'common.approve', 'common.approved', 'common.confirm', 'common.cancel', 'common.submit',
  'common.close', 'common.max', 'common.balance', 'common.amount', 'common.fee',
  'common.total', 'common.available', 'common.insufficient', 'common.success',
  'common.error', 'common.warning', 'common.info', 'common.copy', 'common.copied',
  'common.refresh', 'common.settings', 'common.theme', 'common.light', 'common.dark',
  'common.auto', 'common.retry', 'common.hide', 'common.details', 'common.offline',
  'common.updateAvailable', 'common.dataLoadFailed',
  
  // Error keys
  'errors.networkError', 'errors.contractError', 'errors.userRejected',
  'errors.insufficientFunds', 'errors.slippageTooHigh', 'errors.deadlineExceeded',
  'errors.unknown'
];

// 递归函数来获取所有嵌套的键
function getAllKeys(obj, prefix = '') {
  let keys = [];
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      keys = keys.concat(getAllKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

// 获取所有定义的键
const allEnKeys = getAllKeys(enTranslations);
const allZhKeys = getAllKeys(zhTranslations);

// 找出未使用的键
const unusedEnKeys = allEnKeys.filter(key => !usedKeys.includes(key));
const unusedZhKeys = allZhKeys.filter(key => !usedKeys.includes(key));

// 找出只在一个语言文件中存在的键
const onlyInEn = allEnKeys.filter(key => !allZhKeys.includes(key));
const onlyInZh = allZhKeys.filter(key => !allEnKeys.includes(key));

console.log('=== 未使用的英文翻译键 ===');
console.log(unusedEnKeys.join('\n'));
console.log(`\n总计: ${unusedEnKeys.length} 个未使用的英文键\n`);

console.log('=== 未使用的中文翻译键 ===');
console.log(unusedZhKeys.join('\n'));
console.log(`\n总计: ${unusedZhKeys.length} 个未使用的中文键\n`);

console.log('=== 只在英文文件中存在的键 ===');
console.log(onlyInEn.join('\n'));
console.log(`\n总计: ${onlyInEn.length} 个键\n`);

console.log('=== 只在中文文件中存在的键 ===');
console.log(onlyInZh.join('\n'));
console.log(`\n总计: ${onlyInZh.length} 个键\n`);

console.log('=== 统计信息 ===');
console.log(`英文文件总键数: ${allEnKeys.length}`);
console.log(`中文文件总键数: ${allZhKeys.length}`);
console.log(`实际使用的键数: ${usedKeys.length}`);
console.log(`未使用的英文键数: ${unusedEnKeys.length}`);
console.log(`未使用的中文键数: ${unusedZhKeys.length}`);