# 推荐码绑定功能更新

## 📋 更新内容

### 1. 文案修改 ✅

**多语言文件更新：**
- `src/i18n/locales/zh.json`
- `src/i18n/locales/en.json` 
- `src/i18n/locales/ko.json`

**修改内容：**
- "推荐地址" → "推荐码"
- "Referrer Address" → "Referral Code"
- "추천인 주소" → "추천 코드"
- 新增 "Type or Paste 推荐码" 的多语言支持

### 2. API接口更新 ✅

**新增方法：**
- `referralService.bindReferral(referralCode, walletAddress)`
  - 调用 `/api/v1/referral/bind` 接口
  - 参数：`referral_code` 和 `wallet_address`

**方法重构：**
- `referralService.useInviteCode(inviteCode, walletAddress)` 
  - 现在内部调用 `bindReferral` 方法
  - 保持向后兼容性

### 3. 组件更新 ✅

**AddReferrerCard 组件修改：**
- 导入 `useWeb3Store` 获取钱包地址
- 更新提示文案使用多语言
- 传入钱包地址参数到 API 调用
- 更新所有错误和成功消息的多语言

**新增多语言键：**
```json
{
  "type_or": "输入或",
  "paste": "粘贴", 
  "referral_code_text": "推荐码",
  "invalid_referral_code": "推荐码无效",
  "validation_failed": "验证失败",
  "please_enter_valid_referral_code": "请输入有效的推荐码",
  "please_connect_wallet_first": "请先连接钱包",
  "referral_bind_success": "成功绑定推荐关系！",
  "referral_bind_failed": "绑定推荐关系失败",
  "validating": "验证中...",
  "valid_referral_code": "有效推荐码"
}
```

## 🔧 技术实现

### API 请求格式

```javascript
// 新的绑定接口调用
POST /api/v1/referral/bind
{
  "referral_code": "ABC123",
  "wallet_address": "0x1234...abcd"
}
```

### 响应格式
```javascript
{
  "success": true,
  "data": {
    "referral_relationship": {
      "referrer_id": 100,
      "referee_id": 200,
      "referral_code": "ABC123",
      "created_at": "2024-01-15T11:00:00Z",
      "status": "active"
    },
    "referrer_info": {
      "user_id": 100,
      "vip_level": 3,
      "total_referrals": 12
    }
  }
}
```

## 🧪 测试要点

### 功能测试
1. **钱包连接检查**
   - 未连接钱包时显示错误提示
   - 连接钱包后可正常输入推荐码

2. **推荐码验证**
   - 输入无效推荐码显示错误
   - 输入有效推荐码显示成功状态
   - 显示推荐人VIP等级信息

3. **绑定流程**
   - 成功绑定后显示成功消息
   - 绑定失败显示错误消息
   - 绑定成功后触发 `onSuccess` 回调

4. **多语言支持**
   - 中文、英文、韩文界面正确显示
   - 所有提示消息支持多语言

### UI测试
1. **响应式设计**
   - 移动端和桌面端正确显示
   - 输入框和按钮适配不同屏幕

2. **交互体验**
   - 粘贴功能正常工作
   - 验证状态实时显示
   - 加载状态正确显示

## 🚀 部署说明

1. 确保后端 `/api/v1/referral/bind` 接口已实现
2. 测试所有语言环境下的功能
3. 验证钱包连接和推荐码绑定流程
4. 检查错误处理和用户提示

## 📝 注意事项

- 保持了原有 `useInviteCode` 方法的向后兼容性
- 新增的 `bindReferral` 方法可以独立使用
- 所有用户提示消息都支持多语言
- 钱包地址从当前连接的钱包自动获取
