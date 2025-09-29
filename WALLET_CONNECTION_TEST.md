# 钱包连接和登录功能测试指南

## 功能概述

本次实现了完整的钱包连接和登录功能，包括：

1. **连接钱包功能** - 通过 MetaMask 连接 Web3 钱包
2. **简化签名登录** - 直接使用多语言签名消息进行登录（无需 nonce）
3. **用户信息获取** - 登录后自动获取用户资料信息
4. **余额信息获取** - 获取用户各种代币的余额信息
5. **多语言支持** - 签名消息支持中英韩三语言

## 实现的 API 接口

### 1. 登录接口

- **接口**: `POST /api/v1/auth/login`
- **参数**:
  ```json
  {
    "message": "签名消息",
    "signature": "签名结果"
  }
  ```
- **返回**:
  ```json
  {
    "success": true,
    "data": {
      "token": "JWT_TOKEN",
      "refreshToken": "REFRESH_TOKEN",
      "user": { ... }
    }
  }
  ```

## 多语言签名消息

系统会根据用户当前选择的语言自动使用对应的签名消息：

- **英文**: "Welcome to BitRocket Binary Options Trading Platform! 🚀"
- **中文**: "欢迎使用 BitRocket 二元期权交易平台！🚀"
- **韩文**: "BitRocket 바이너리 옵션 거래 플랫폼에 오신 것을 환영합니다! 🚀"

语言检测逻辑：

1. 从 localStorage 的 `i18nextLng` 字段获取当前语言
2. 如果未设置，默认使用英文

### 3. 用户信息接口

- **接口**: `GET /users/profile`
- **返回示例**:
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "wallet_address": "0xDfb96d31E145EA173C6034Fd23D804AA6bA93dC6",
      "vip_level": 0,
      "invite_code": "INV001",
      "inviter_id": null,
      "total_bet_amount": "1000.00",
      "total_profit": "50.00",
      "total_loss": "30.00",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  }
  ```

### 4. 余额信息接口

- **接口**: `GET /users/balance`
- **返回示例**:
  ```json
  {
    "success": true,
    "data": {
      "balances": [
        {
          "token_symbol": "USDT",
          "available_balance": "950.00",
          "frozen_balance": "50.00",
          "total_balance": "1000.00"
        },
        {
          "token_symbol": "USDR",
          "available_balance": "25.50",
          "frozen_balance": "0.00",
          "total_balance": "25.50"
        },
        {
          "token_symbol": "LuckyUSD",
          "available_balance": "500.00",
          "frozen_balance": "0.00",
          "total_balance": "500.00"
        }
      ]
    }
  }
  ```

## 测试步骤

### 1. 准备工作

1. 确保安装了 MetaMask 浏览器插件
2. 确保后端 API 服务正在运行
3. 打开浏览器访问 `http://localhost:5174/`

### 2. 测试钱包连接

1. 点击页面右上角的"连接钱包"按钮
2. MetaMask 会弹出连接请求，点击"连接"
3. 如果网络不正确，会自动切换到 BSC 测试网

### 3. 测试签名登录

1. 钱包连接成功后，会自动进行签名登录
2. MetaMask 会弹出签名请求，显示多语言签名消息
3. 点击"签名"完成认证
4. 登录成功后会显示成功提示

### 4. 查看控制台输出

打开浏览器开发者工具的控制台，应该能看到：

```
🚀 开始Web3登录流程...
📝 签名消息: Welcome to BitRocket Binary Options Trading Platform! 🚀
🖊️ 正在请求用户签名...
✅ 签名成功: 0x...
🔐 正在验证签名并登录...
🎉 登录成功！
用户信息: {...}
开始获取用户信息和余额...
=== 用户信息 ===
用户ID: 1
钱包地址: 0xDfb96d31E145EA173C6034Fd23D804AA6bA93dC6
VIP等级: 0
邀请码: INV001
...
===============
=== 用户余额信息 ===
代币 1:
  代币符号: USDT
  可用余额: 950.00
  冻结余额: 50.00
  总余额: 1000.00
  ---
...
==================
用户信息和余额获取完成
```

### 5. 测试 Account 页面

1. 导航到 Account 页面
2. 应该能看到正确的钱包地址显示
3. 余额信息应该从 API 获取并正确显示

## 注意事项

1. **环境变量配置**: 确保 `.env` 文件中的 `VITE_API_BASE_URL` 指向正确的后端服务地址
2. **网络配置**: 默认配置为 BSC 测试网，可以在 `.env` 文件中修改
3. **错误处理**: 如果 API 调用失败，会在控制台显示错误信息，但不会影响钱包连接状态
4. **Token 管理**: JWT token 会自动保存到 localStorage，页面刷新后会自动恢复登录状态

## 故障排除

1. **钱包连接失败**: 检查 MetaMask 是否已安装并解锁
2. **签名失败**: 确保在 MetaMask 中点击了"签名"而不是"取消"
3. **API 调用失败**: 检查后端服务是否正在运行，以及网络连接是否正常
4. **控制台错误**: 查看浏览器控制台的详细错误信息进行调试
