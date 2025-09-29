# 用户资料信息集成实现文档

## 📋 功能概述

已成功将 `userService.getProfile()` 获取的用户信息集成到前端界面中，在钱包弹窗显示会员等级，在交易页面显示总盈利数据。

## 🚀 实现的功能

### 1. 用户Store更新 (useUserStore)

**文件位置**: `src/store/index.js`

**新增功能**:
- 添加 `fetchProfile()` 方法用于获取用户资料
- 自动保存profile数据到store状态中
- 完整的错误处理和日志记录

**API调用**:
```javascript
// 获取用户资料
fetchProfile: async () => {
  try {
    const result = await userService.getProfile();
    if (result.success) {
      set({ profile: result.data });
      console.log('✅ 用户资料获取成功:', result.data);
      return result;
    }
    throw new Error('获取用户资料失败');
  } catch (error) {
    console.error('❌ 获取用户资料失败:', error);
    throw error;
  }
}
```

### 2. Trade页面总盈利显示

**文件位置**: `src/pages/Trade/index.jsx`

**主要变更**:
- 添加对 `profile` 和 `fetchProfile` 的访问
- 在组件加载时自动获取用户资料
- 将硬编码的 "456.45" 替换为动态的总盈利数据

**实现细节**:
```javascript
// 导入profile相关数据
const { balance, profile, fetchBalance, fetchProfile } = useUserStore();

// 获取用户资料
useEffect(() => {
  if (isAuthenticated && !profile) {
    fetchProfile().catch(error => {
      console.error('获取用户资料失败:', error);
    });
  }
}, [isAuthenticated, profile, fetchProfile]);

// 显示总盈利
<span className="text-[#8f8f8f] text-size-[13vw] md:text-sm pb-[2vw]">
  <br /> {t('trade.payout')}: {formatNumber(safeParseFloat(profile?.total_profit, 0), 2)}
</span>
```

### 3. 钱包弹窗会员等级显示

**文件位置**: `src/components/WalletCard/index.jsx`

**主要变更**:
- 移除本地的 `membershipLevel` 状态
- 添加对用户profile的访问
- 实现VIP等级到会员等级的转换逻辑
- 在组件加载时自动获取用户资料

**VIP等级映射**:
```javascript
// 将API的vip_level转换为本地的MEMBERSHIP_LEVELS
const getMembershipLevelFromVip = (vipLevel) => {
  switch (vipLevel) {
    case 1:
      return MEMBERSHIP_LEVELS.SILVER;  // 银牌会员
    case 2:
      return MEMBERSHIP_LEVELS.GOLD;    // 金牌会员
    case 0:
    default:
      return MEMBERSHIP_LEVELS.NONE;    // 无会员
  }
};

// 获取当前会员等级
const currentMembershipLevel = getMembershipLevelFromVip(profile?.vip_level);
```

## 📊 用户资料数据结构

根据 `userService.getProfile()` 返回的数据结构：

```json
{
  "success": true,
  "data": {
    "id": 123,
    "wallet_address": "0x...",
    "vip_level": 1,           // VIP等级: 0=无, 1=银牌, 2=金牌
    "invite_code": "ABC123",
    "inviter_id": 456,
    "total_bet_amount": "1000.00",
    "total_profit": "456.45", // 总盈利 - 显示在Trade页面
    "total_loss": "200.00",
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T11:00:00Z"
  }
}
```

## 🔧 技术实现细节

### 数据获取时机

1. **Trade页面**: 在用户认证后且profile为空时自动获取
2. **WalletCard**: 在用户认证后且profile为空时自动获取
3. **避免重复请求**: 通过检查 `profile` 状态避免重复API调用

### 数据安全处理

- 使用 `safeParseFloat()` 确保数值安全解析
- 使用 `formatNumber()` 格式化显示数值
- 使用可选链操作符 `?.` 避免空值错误
- 提供默认值确保界面稳定显示

### 错误处理

- 完整的try-catch错误捕获
- 详细的控制台日志记录
- 静默处理错误，不影响用户体验
- 失败时使用默认值保证界面正常显示

## 🧪 测试验证

### 1. Trade页面总盈利测试

1. **访问Trade页面**: http://localhost:5174/
2. **连接钱包并认证**
3. **查看Payout区域**: 应显示从API获取的总盈利数据
4. **控制台验证**: 查看 "✅ 用户资料获取成功" 日志

### 2. 钱包弹窗会员等级测试

1. **点击Connect Wallet打开钱包弹窗**
2. **查看会员等级显示**: 应根据API返回的vip_level显示对应等级
3. **测试不同VIP等级**:
   - vip_level: 0 → 显示"无会员"
   - vip_level: 1 → 显示"银牌会员"
   - vip_level: 2 → 显示"金牌会员"

### 3. 数据同步测试

1. **多页面数据一致性**: Trade页面和钱包弹窗应显示相同的用户数据
2. **实时更新**: 用户资料更新后应在所有位置同步显示
3. **网络错误处理**: 断网情况下应使用默认值，不影响界面

## ✅ 实现状态

- ✅ 用户Store添加fetchProfile方法
- ✅ Trade页面集成总盈利显示
- ✅ 钱包弹窗集成会员等级显示
- ✅ VIP等级映射逻辑完成
- ✅ 错误处理和默认值处理
- ✅ 数据安全解析和格式化
- ✅ 自动获取和缓存机制

## 🎯 显示效果

### Trade页面
- **位置**: Payout区域
- **格式**: "Payout: 456.45" (动态显示total_profit)
- **默认值**: 0.00 (当数据不可用时)

### 钱包弹窗
- **位置**: 会员等级显示区域
- **格式**: 根据vip_level显示对应的会员等级文本和颜色
- **默认值**: "无会员" (当数据不可用时)

---

**实现完成时间**: 2025-01-13
**开发者**: BitRocket 开发团队
**版本**: v1.1.0 (用户资料集成)
