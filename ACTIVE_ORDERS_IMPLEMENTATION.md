# 活跃订单功能实现文档

## 功能概述

本次实现了两个主要功能：
1. **活跃订单列表页面** - 显示用户当前活跃的订单
2. **订单详情页面** - 显示特定订单的详细信息

## 实现的接口

### 1. 获取活跃订单列表
- **接口**: `GET /orders/active/list`
- **需要认证**: 是
- **参数**: 
  - `page`: 页码，默认1
  - `limit`: 每页数量，默认20
- **响应示例**:
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": 124,
        "bet_amount": "100.00",
        "token": "USDT",
        "direction": "up",
        "entry_price": "45120.30",
        "status": "pending",
        "created_at": "2024-01-15T11:00:00Z",
        "expires_at": "2024-01-15T11:01:00Z",
        "remaining_time": 45
      }
    ]
  }
}
```

### 2. 获取订单详情
- **接口**: `GET /orders/{id}`
- **需要认证**: 是
- **路径参数**: 
  - `id`: 订单ID (integer)
- **响应示例**:
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
      "close_price": null,
      "status": "pending",
      "profit": null,
      "created_at": "2024-01-15T11:00:00Z",
      "expires_at": "2024-01-15T11:01:00Z"
    }
  }
}
```

## 新增文件

### 1. 服务层
- `src/services/orderService.js` - 新增 `getActiveOrders()` 方法

### 2. 页面组件
- `src/pages/ActiveOrders/index.jsx` - 活跃订单列表页面
- `src/pages/OrderDetail/index.jsx` - 订单详情页面
- `src/pages/TestActiveOrders/index.jsx` - API测试页面

### 3. 路由配置
- `src/router/index.jsx` - 新增路由:
  - `/active-orders` - 活跃订单页面
  - `/order/:id` - 订单详情页面
  - `/test-active-orders` - 测试页面

### 4. 国际化文件
- `src/i18n/locales/zh.json` - 中文翻译
- `src/i18n/locales/en.json` - 英文翻译
- `src/i18n/locales/ko.json` - 韩文翻译

## 页面功能

### 活跃订单列表页面 (`/active-orders`)
- 显示用户当前活跃的订单列表
- 支持分页加载
- 显示订单基本信息：交易对、方向、投注金额、剩余时间等
- 点击订单可跳转到详情页面
- 支持下拉刷新和上拉加载更多
- 空状态处理

### 订单详情页面 (`/order/:id`)
- 显示订单的完整详细信息
- 包含订单状态、投注信息、价格信息、时间信息等
- 支持返回上一页
- 根据订单状态显示不同的视觉效果

### 测试页面 (`/test-active-orders`)
- 提供API接口测试功能
- 可以测试活跃订单列表和订单详情接口
- 显示API响应数据
- 包含接口说明文档

## 导航增强

### History页面增强
- 在历史记录页面标题栏添加"活跃订单"按钮
- 方便用户在历史记录和活跃订单之间切换

### ActiveOrders页面增强
- 在活跃订单页面标题栏添加"历史记录"按钮
- 提供返回历史记录的快捷方式

## 技术特性

### 响应式设计
- 支持移动端和桌面端
- 使用vw单位实现移动端适配
- 响应式布局和字体大小

### 国际化支持
- 支持中文、英文、韩文三种语言
- 所有文本都通过i18n系统管理

### 错误处理
- 完善的错误处理机制
- 网络错误、API错误的友好提示
- 加载状态和空状态处理

### 性能优化
- 使用React Hooks进行状态管理
- 防重复请求机制
- 分页加载减少数据传输

## 使用方法

### 访问页面
1. 活跃订单列表: `http://localhost:5174/active-orders`
2. 订单详情: `http://localhost:5174/order/123` (123为订单ID)
3. API测试页面: `http://localhost:5174/test-active-orders`

### 页面导航
1. 从历史记录页面点击"活跃订单"按钮
2. 从活跃订单页面点击"历史记录"按钮
3. 从活跃订单列表点击任意订单进入详情页面

## 注意事项

1. **认证要求**: 所有接口都需要用户认证，请确保用户已登录
2. **分页参数**: 分页参数与历史记录接口保持一致
3. **错误处理**: 接口调用失败时会显示相应的错误信息
4. **数据格式**: 确保后端接口返回的数据格式与预期一致

## 后续扩展

1. **实时更新**: 可以考虑使用WebSocket实现活跃订单的实时更新
2. **筛选功能**: 可以添加按交易对、方向等条件筛选活跃订单
3. **操作功能**: 可以添加取消订单等操作功能
4. **推送通知**: 可以添加订单状态变化的推送通知
