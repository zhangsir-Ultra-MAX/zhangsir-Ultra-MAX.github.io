# 合约对接完成说明

## 概述

已成功完成 WRMB DApp 的 Wrap 功能与智能合约的对接，将原有的模拟数据和功能替换为真实的区块链合约交互。

## 主要更改

### 1. 导入更新
- 添加了 `ethers` 库的 `formatUnits` 和 `parseUnits` 函数
- 导入了 `contractService` 用于合约交互

### 2. 状态管理
- 将模拟余额替换为从合约读取的真实余额
- 添加了 `wrapConfig` 状态来存储合约配置信息

### 3. 余额加载
- `loadBalances()`: 从 sRMB 和 Savings Vault 合约读取用户余额
- `loadWrapConfig()`: 从 Wrap Manager 合约读取配置参数
- 添加了钱包连接状态监听，自动刷新数据

### 4. 预览功能
- `generateWrapPreview()`: 调用合约的 `previewWrap()` 方法
- `generateUnwrapPreview()`: 调用合约的 `previewUnwrap()` 方法
- 支持异步调用，提供真实的交换率和费用信息

### 5. 交易执行
- `handleWrap()`: 执行真实的 wrap 交易
  - 检查并批准 sRMB 代币授权
  - 调用 Wrap Manager 的 `wrap()` 方法
  - 处理交易确认和错误
- `handleUnwrap()`: 执行真实的 unwrap 交易
  - 检查并批准 sWRMB 代币授权
  - 调用 Wrap Manager 的 `unwrap()` 方法
  - 处理交易确认和错误

### 6. 验证逻辑
- 增强了输入验证，包括最小/最大金额限制
- 添加了钱包连接状态检查
- 根据合约配置动态验证交易参数

### 7. UI 更新
- 按钮状态根据钱包连接状态动态更新
- 未连接钱包时显示"连接钱包"文本
- 交易进度通过 TransactionModal 组件显示

## 环境配置

### 必需的环境变量

在 `.env` 文件中配置以下合约地址：

```env
# 主网合约地址
VITE_SAVINGS_VAULT_ADDRESS_ETHEREUM=0x...
VITE_WRAP_MANAGER_ADDRESS_ETHEREUM=0x...
VITE_WRMB_ADDRESS_ETHEREUM=0x...
VITE_SWRMB_ADDRESS_ETHEREUM=0x...
VITE_SRMB_ADDRESS_ETHEREUM=0x...

# 测试网合约地址
VITE_SAVINGS_VAULT_ADDRESS_GOERLI=0x...
VITE_WRAP_MANAGER_ADDRESS_GOERLI=0x...
# ... 其他测试网地址
```

## 合约依赖

### 必需的合约方法

**Wrap Manager 合约:**
- `previewWrap(uint256)` - 预览 wrap 交易
- `previewUnwrap(uint256)` - 预览 unwrap 交易
- `wrap(uint256)` - 执行 wrap 交易
- `unwrap(uint256)` - 执行 unwrap 交易
- `getConfiguration()` - 获取配置参数

**ERC20 代币合约 (sRMB, sWRMB):**
- `balanceOf(address)` - 查询余额
- `allowance(address, address)` - 查询授权额度
- `approve(address, uint256)` - 授权代币

## 使用流程

1. **连接钱包**: 用户必须先连接 Web3 钱包
2. **加载数据**: 自动从合约读取余额和配置
3. **输入金额**: 用户输入要 wrap/unwrap 的金额
4. **预览交易**: 实时显示交换率、费用等信息
5. **执行交易**: 
   - 第一步：授权代币（如需要）
   - 第二步：执行 wrap/unwrap 交易
   - 第三步：等待交易确认
6. **更新余额**: 交易成功后自动刷新余额

## 错误处理

- 网络连接错误
- 合约调用失败
- 交易被拒绝或失败
- 余额不足
- 授权失败

所有错误都会通过 UI 反馈给用户，并记录到控制台用于调试。

## 安全考虑

- 所有交易都需要用户明确确认
- 代币授权仅授权所需金额
- 输入验证防止无效交易
- 滑点保护确保用户获得预期的最小金额

## 测试建议

1. 在测试网上部署合约并配置地址
2. 使用测试网代币进行功能测试
3. 测试各种边界情况（余额不足、网络错误等）
4. 验证交易确认和余额更新