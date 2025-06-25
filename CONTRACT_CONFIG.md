# Contract Configuration Guide

本文档说明如何在 WRMB DApp 中配置合约地址环境变量。

## 环境变量格式

环境变量采用以下命名约定：
```
VITE_{NETWORK}_{CONTRACT}_ADDRESS
```

### 支持的网络
- `MAINNET` - 以太坊主网 (Chain ID: 1)
- `GOERLI` - Goerli 测试网 (Chain ID: 5)
- `SEPOLIA` - Sepolia 测试网 (Chain ID: 11155111)
- `LOCALHOST` - 本地测试网 (Chain ID: 31337)

### 支持的合约
- `WRMB` - WRMB 代币合约
- `WRMB_MINTER` - WRMB 铸币合约
- `SAVINGS_VAULT` - 储蓄金库合约
- `WRAP_MANAGER` - 包装管理合约
- `ACTIVE_LIQUIDITY_AMO` - 主动流动性 AMO 合约
- `WRMB_BOND_POOL` - WRMB 债券池合约
- `BOND_LIQUIDITY_AMO` - 债券流动性 AMO 合约
- `ORACLE_STUB` - 预言机存根合约
- `SRMB` - sRMB 代币合约
- `USDT` - USDT 代币合约

## 配置步骤

1. **复制环境变量模板**
   ```bash
   cp .env.example .env
   ```

2. **编辑 .env 文件**
   将零地址 `0x0000000000000000000000000000000000000000` 替换为实际的合约地址。

3. **验证配置**
   确保所有必需的合约地址都已正确配置。

## 环境变量示例

```bash
# Mainnet Contract Addresses (Chain ID: 1)
VITE_MAINNET_WRMB_ADDRESS=0x1234567890123456789012345678901234567890
VITE_MAINNET_WRMB_MINTER_ADDRESS=0x2345678901234567890123456789012345678901
VITE_MAINNET_SAVINGS_VAULT_ADDRESS=0x3456789012345678901234567890123456789012

# Sepolia Testnet Contract Addresses (Chain ID: 11155111)
VITE_SEPOLIA_WRMB_ADDRESS=0x554bF3657d1741100dAcb4D3834BC6B81abf9F0a
VITE_SEPOLIA_SAVINGS_VAULT_ADDRESS=0x618A3Aa7E89fA6cA6c3566fffCEF13A8A11A6E0E
```

## 代码中的使用

在 `src/constants/index.ts` 中，合约地址通过以下方式访问：

```typescript
// Token 配置
export const TOKENS = {
  WRMB: {
    addresses: {
      [NETWORKS.ETHEREUM.chainId]: import.meta.env.VITE_MAINNET_WRMB_ADDRESS || '',
      [NETWORKS.SEPOLIA.chainId]: import.meta.env.VITE_SEPOLIA_WRMB_ADDRESS || '',
      [NETWORKS.LOCAL.chainId]: import.meta.env.VITE_LOCALHOST_WRMB_ADDRESS || ''
    }
  }
}

// 合约配置
export const CONTRACTS = {
  WRMB: {
    [NETWORKS.ETHEREUM.chainId]: import.meta.env.VITE_MAINNET_WRMB_ADDRESS || '',
    [NETWORKS.SEPOLIA.chainId]: import.meta.env.VITE_SEPOLIA_WRMB_ADDRESS || '',
    [NETWORKS.LOCAL.chainId]: import.meta.env.VITE_LOCALHOST_WRMB_ADDRESS || ''
  }
}
```

## 安全注意事项

1. **不要提交 .env 文件**
   - `.env` 文件已添加到 `.gitignore` 中
   - 仅提交 `.env.example` 模板文件

2. **使用环境变量**
   - 生产环境中通过 CI/CD 系统设置环境变量
   - 避免在代码中硬编码合约地址

3. **验证地址格式**
   - 确保所有地址都是有效的以太坊地址格式
   - 使用 `0x` 前缀和 40 位十六进制字符

## 故障排除

### 常见问题

1. **合约地址为空**
   - 检查 `.env` 文件是否存在
   - 确认环境变量名称拼写正确
   - 验证地址格式是否正确

2. **网络不匹配**
   - 确认使用了正确的网络前缀（MAINNET/SEPOLIA/LOCALHOST）
   - 检查链 ID 是否与网络配置匹配

3. **构建错误**
   - 重启开发服务器以加载新的环境变量
   - 清除构建缓存并重新构建

### 调试命令

```bash
# 检查环境变量是否正确加载
echo $VITE_MAINNET_WRMB_ADDRESS

# 重启开发服务器
npm run dev

# 清除缓存并重新构建
npm run build
```

## 更新日志

- **v1.0.0** - 初始版本，支持基本合约地址配置
- **v1.1.0** - 重构环境变量命名约定，统一使用 MAINNET/SEPOLIA/LOCALHOST 格式
- **v1.1.1** - 添加更多合约类型支持，包括 AMO 和预言机合约

## 相关文档

- [部署指南](../contract-v1/DEPLOYMENT.md)
- [环境变量更新工具](../contract-v1/ENV_UPDATE.md)
- [合约集成文档](./CONTRACT_INTEGRATION.md)