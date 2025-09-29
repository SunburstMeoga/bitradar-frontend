# 新订单API实现文档

## 📋 功能概述

已成功实现新的二元期权交易订单创建功能，使用新的API格式 `POST /orders`，支持新的参数结构和响应格式。

## 🚀 实现的功能

### 1. 订单服务更新 (OrderService)

**文件位置**: `src/services/orderService.js`

**主要变更**:
- 更新 `createOrder(orderData)` 方法使用新的API格式
- API端点: `POST /orders` (不带 `/api/v1` 前缀)
- 新的参数结构和验证逻辑

**新的API参数格式**:
```javascript
{
  "bet_amount": "100.00",    // 字符串格式的下注金额
  "token": "USDT",           // 下注代币 (USDT, LuckyUSD, USDR)
  "direction": "up",         // 预测方向 (up, down)
  "trading_pair": "BTC/USDT" // 交易对
}
```

**参数验证**:
- `bet_amount`: 必需，最小值 1.00
- `token`: 必需，支持 USDT, LuckyUSD, USDR
- `direction`: 必需，支持 up, down
- `trading_pair`: 必需，当前默认 BTC/USDT

### 2. Trade页面集成更新

**文件位置**: `src/pages/Trade/index.jsx`

**主要变更**:
- 更新 `handlePlaceBet` 函数以使用新的API参数格式
- 参数转换逻辑：
  - `orderType: "CALL"/"PUT"` → `direction: "up"/"down"`
  - `amount: number` → `bet_amount: "string"`
  - 添加 `token` 参数（从 `selectedToken` 获取）
  - 添加 `trading_pair` 参数（默认 "BTC/USDT"）
  - 移除 `frontendSubmitTime` 参数

**响应处理更新**:
- 适配新的API响应格式
- 正确解析订单数据：`result.data.order` 或 `result.data`
- 更新本地下注记录的数据映射

## 📊 API接口详情

### 请求格式

```http
POST /orders
Content-Type: application/json
Authorization: Bearer <token>

{
  "bet_amount": "100.00",
  "token": "USDT",
  "direction": "up",
  "trading_pair": "BTC/USDT"
}
```

### 响应格式

```json
{
  "success": true,
  "data": {
    "order": {
      "id": 124,
      "bet_amount": "100.00",
      "token": "USDT",
      "direction": "up",
      "trading_pair": "BTC/USDT",
      "entry_price": "45120.30",
      "status": "pending",
      "created_at": "2024-01-15T11:00:00Z",
      "expires_at": "2024-01-15T11:01:00Z"
    }
  }
}
```

## 🧪 测试步骤

### 1. 基础功能测试

1. **启动开发服务器**
   ```bash
   yarn dev
   ```
   访问: http://localhost:5174/

2. **连接钱包**
   - 点击 "Connect Wallet" 按钮
   - 确认 MetaMask 连接和签名
   - 验证认证状态（Header显示绿色边框）

3. **选择代币**
   - 在Trade页面点击代币选择器
   - 测试选择不同代币：USDT, USDR, LuckyUSD
   - 验证余额显示正确

4. **下注测试**
   - 输入下注金额（最小1.00）
   - 选择预测方向（Buy Up 或 Buy Down）
   - 点击下注按钮
   - 观察控制台日志验证API调用

### 2. API调用验证

在浏览器开发者工具中检查：

1. **网络请求**
   - 验证请求URL: `{API_BASE_URL}/orders`
   - 验证请求方法: POST
   - 验证请求头包含 Authorization token

2. **请求参数**
   ```json
   {
     "bet_amount": "10.00",
     "token": "USDT",
     "direction": "up",
     "trading_pair": "BTC/USDT"
   }
   ```

3. **控制台日志**
   - 查看 "🎯 发送订单创建请求" 日志
   - 查看 "📡 API请求URL" 日志
   - 查看 "✅ 订单创建成功" 或错误日志

### 3. 错误处理测试

1. **参数验证错误**
   - 测试空的下注金额
   - 测试无效的代币类型
   - 测试无效的方向参数

2. **网络错误**
   - 断开网络连接测试
   - 测试API服务器不可用情况

3. **认证错误**
   - 未连接钱包时尝试下注
   - Token过期情况测试

## 🔧 技术细节

### API端点配置

由于新的API不使用 `/api/v1` 前缀，在 `orderService.js` 中使用完整URL：

```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const fullUrl = `${API_BASE_URL}/orders`;
const response = await this.client.post(fullUrl, orderData);
```

### 代币支持

当前支持的代币类型：
- `USDT`: 主要稳定币
- `LuckyUSD`: 平台代币
- `USDR`: 备用稳定币

### 交易对

当前默认交易对: `BTC/USDT`
未来可扩展支持更多交易对。

## ✅ 实现状态

- ✅ 订单服务API更新完成
- ✅ Trade页面集成更新完成
- ✅ 参数格式转换完成
- ✅ 响应处理适配完成
- ✅ 错误处理保持完整
- ✅ 开发服务器测试就绪

## 🎯 使用说明

1. **启动项目**: `yarn dev`
2. **访问地址**: http://localhost:5174/
3. **连接钱包**: 点击"Connect Wallet"
4. **选择代币**: 点击代币选择器选择USDT/LuckyUSD/USDR
5. **开始下注**: 输入金额，选择方向，点击按钮

---

**实现完成时间**: 2025-01-13
**开发者**: BitRocket 开发团队
**版本**: v2.0.0 (新订单API)
