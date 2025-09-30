# 订单API参数格式更新文档

## 📋 更新概述

根据要求，已将trading页面中买涨买跌功能的API参数格式从旧格式更新为新格式。

## 🔄 参数格式对比

### 旧格式 (已废弃)
```javascript
{
  "bet_amount": "100.00",        // 字符串格式的下注金额
  "token": "USDT",               // 下注代币
  "direction": "up",             // 预测方向 (up, down)
  "trading_pair": "BTC/USDT",    // 交易对
  "entry_price": "45120.30"      // 入场价格
}
```

### 新格式 (当前使用)
```javascript
{
  "orderType": "CALL",           // 订单类型 (CALL=买涨, PUT=买跌)
  "amount": 10,                  // 数字格式的下注金额
  "entryPrice": 112917.19,       // 数字格式的入场价格
  "betTokenSymbol": "LUSD",      // 下注代币符号
  "tradingPairSymbol": "BTCUSDT", // 交易对符号
  "ratio": 1.8,                  // 比率
  "frontendSubmitTime": 1759231754096 // 前端提交时间戳
}
```

## 🛠️ 修改的文件

### 1. `src/services/orderService.js`
- **更新 `createOrder` 方法**：
  - 修改参数验证逻辑，支持新的字段名
  - 更新API请求参数构建
  - 更新JSDoc注释

**主要变更**：
```javascript
// 旧代码
const apiParams = {
  bet_amount: orderData.bet_amount,
  token: orderData.token,
  direction: orderData.direction,
  trading_pair: orderData.trading_pair,
  entry_price: orderData.entry_price
};

// 新代码
const apiParams = {
  orderType: orderData.orderType,
  amount: orderData.amount,
  entryPrice: orderData.entryPrice,
  betTokenSymbol: orderData.betTokenSymbol,
  tradingPairSymbol: orderData.tradingPairSymbol,
  ratio: orderData.ratio,
  frontendSubmitTime: orderData.frontendSubmitTime
};
```

### 2. `src/pages/Trade/index.jsx`
- **更新 `handlePlaceBet` 函数**：
  - 修改订单数据构建逻辑
  - 更新参数验证
  - 添加新字段支持

**主要变更**：
```javascript
// 旧代码
const orderData = {
  bet_amount: tradeAmount.toFixed(2),
  token: selectedToken,
  direction: direction,
  trading_pair: "BTC/USDT",
  entry_price: currentPrice.toString()
};

// 新代码
const orderData = {
  orderType: direction === 'up' ? 'CALL' : 'PUT',
  amount: tradeAmount,
  entryPrice: currentPrice,
  betTokenSymbol: selectedToken,
  tradingPairSymbol: "BTCUSDT",
  ratio: 1.8,
  frontendSubmitTime: now
};
```

### 3. 响应处理兼容性
- **添加新旧字段名兼容性**：
  - 支持 `entryPrice` 和 `entry_price` 两种格式
  - 支持 `createdAt` 和 `created_at` 两种格式
  - 支持 `expiresAt` 和 `expires_at` 两种格式

## 📊 字段映射表

| 旧字段名 | 新字段名 | 类型变化 | 说明 |
|---------|---------|---------|------|
| `bet_amount` | `amount` | string → number | 下注金额 |
| `token` | `betTokenSymbol` | - | 下注代币符号 |
| `direction` | `orderType` | up/down → CALL/PUT | 订单类型 |
| `trading_pair` | `tradingPairSymbol` | BTC/USDT → BTCUSDT | 交易对符号 |
| `entry_price` | `entryPrice` | string → number | 入场价格 |
| - | `ratio` | - | 新增：比率字段 |
| - | `frontendSubmitTime` | - | 新增：前端提交时间 |

## ✅ 验证要点

1. **参数类型**：
   - `amount` 和 `entryPrice` 现在是数字类型
   - `orderType` 使用 CALL/PUT 而不是 up/down
   - `tradingPairSymbol` 去掉了斜杠

2. **新增字段**：
   - `ratio`: 固定值 1.8（可后续配置化）
   - `frontendSubmitTime`: 当前时间戳

3. **兼容性**：
   - API响应处理支持新旧字段名
   - 显示页面无需修改（仍使用API返回的字段）

## 🧪 测试建议

1. **功能测试**：
   - 测试买涨（CALL）订单创建
   - 测试买跌（PUT）订单创建
   - 验证所有必需字段都正确传递

2. **参数验证测试**：
   - 测试无效的 `orderType` 值
   - 测试无效的 `amount` 值
   - 测试缺失的必需字段

3. **API调用验证**：
   - 检查网络请求中的参数格式
   - 验证请求头和认证信息
   - 确认API响应正确处理

## 📝 注意事项

1. **向后兼容**：响应处理代码支持新旧字段名，确保API变更时的平滑过渡
2. **固定值**：`ratio` 当前设为固定值 1.8，后续可考虑从配置或API获取
3. **交易对格式**：从 "BTC/USDT" 改为 "BTCUSDT"
4. **数据类型**：金额和价格字段从字符串改为数字类型

---

**更新完成时间**: 2025-01-13  
**影响范围**: 订单创建功能  
**测试状态**: 待验证
