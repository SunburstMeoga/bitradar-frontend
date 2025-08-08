# BitRadar 页面标题实现文档

## 📋 需求概述

在网页的标签中，实现标题格式为：**页面名称 | 项目名称**，支持多语言。

例如：
- Trade页面：`"Trade | BitRadar"` (英文) / `"交易 | BitRadar"` (中文) / `"거래 | BitRadar"` (韩文)

## ✅ 实现方案

### 1. 创建自定义Hook

创建了 `src/hooks/usePageTitle.js`，提供统一的页面标题管理：

```javascript
const usePageTitle = (pageKey, customTitle = null) => {
  const { t } = useTranslation();

  useEffect(() => {
    let title;
    
    if (customTitle) {
      title = customTitle;
    } else if (pageKey) {
      title = t(`page_titles.${pageKey}`);
    } else {
      title = t('common.app_name');
      document.title = title;
      return;
    }

    const appName = t('common.app_name');
    const fullTitle = `${title} | ${appName}`;
    
    document.title = fullTitle;
  }, [pageKey, customTitle, t]);
};
```

### 2. 更新多语言文件

在所有语言文件中添加了 `page_titles` 和 `common.app_name` 配置：

#### 英文 (`src/i18n/locales/en.json`)
```json
{
  "common": {
    "app_name": "BitRadar"
  },
  "page_titles": {
    "trade": "Trade",
    "home": "Home",
    "history": "History",
    "account": "Account",
    "network_details": "Network Details",
    "exchange": "Exchange",
    "transaction_history": "Transaction History",
    "not_found": "Page Not Found"
  }
}
```

#### 中文 (`src/i18n/locales/zh.json`)
```json
{
  "common": {
    "app_name": "BitRadar"
  },
  "page_titles": {
    "trade": "交易",
    "home": "首页",
    "history": "历史记录",
    "account": "账户",
    "network_details": "网体详情",
    "exchange": "兑换",
    "transaction_history": "交易记录",
    "not_found": "页面未找到"
  }
}
```

#### 韩文 (`src/i18n/locales/ko.json`)
```json
{
  "common": {
    "app_name": "BitRadar"
  },
  "page_titles": {
    "trade": "거래",
    "home": "홈",
    "history": "기록",
    "account": "계정",
    "network_details": "네트워크 세부정보",
    "exchange": "교환",
    "transaction_history": "거래 내역",
    "not_found": "페이지를 찾을 수 없음"
  }
}
```

### 3. 在页面组件中集成

在所有页面组件中添加了 `usePageTitle` Hook：

```javascript
// 示例：Trade页面
import usePageTitle from '../../hooks/usePageTitle';

const Trade = () => {
  // 设置页面标题
  usePageTitle('trade');
  
  // 其他组件逻辑...
};
```

## 📁 已更新的文件

### 核心文件
- `src/hooks/usePageTitle.js` - 新建的自定义Hook
- `src/i18n/locales/en.json` - 英文翻译更新
- `src/i18n/locales/zh.json` - 中文翻译更新
- `src/i18n/locales/ko.json` - 韩文翻译更新

### 页面组件
- `src/pages/Trade/index.jsx` - Trade页面（主页）
- `src/pages/Home/index.jsx` - Home页面
- `src/pages/History/index.jsx` - History页面
- `src/pages/Account/index.jsx` - Account页面
- `src/pages/NetworkDetails/index.jsx` - Network Details页面
- `src/pages/Exchange/index.jsx` - Exchange页面
- `src/pages/TransactionHistory/index.jsx` - Transaction History页面
- `src/pages/NotFound/index.jsx` - 404页面

### 测试文件
- `src/components/PageTitleTest.jsx` - 测试组件
- `src/router/index.jsx` - 添加了测试路由
- `test-page-titles.html` - 静态测试页面
- `test-verification.html` - 验证工具页面
- `verify-page-titles.js` - JavaScript验证脚本

## 🎯 预期效果

### 不同页面的标题格式

| 页面路径 | 英文标题 | 中文标题 | 韩文标题 |
|---------|---------|---------|---------|
| `/` | Trade \| BitRadar | 交易 \| BitRadar | 거래 \| BitRadar |
| `/home` | Home \| BitRadar | 首页 \| BitRadar | 홈 \| BitRadar |
| `/history` | History \| BitRadar | 历史记录 \| BitRadar | 기록 \| BitRadar |
| `/account` | Account \| BitRadar | 账户 \| BitRadar | 계정 \| BitRadar |
| `/network-details` | Network Details \| BitRadar | 网体详情 \| BitRadar | 네트워크 세부정보 \| BitRadar |
| `/exchange` | Exchange \| BitRadar | 兑换 \| BitRadar | 교환 \| BitRadar |
| `/transaction-history` | Transaction History \| BitRadar | 交易记录 \| BitRadar | 거래 내역 \| BitRadar |
| `/not-found` | Page Not Found \| BitRadar | 页面未找到 \| BitRadar | 페이지를 찾을 수 없음 \| BitRadar |

## 🧪 测试方法

### 1. 手动测试
1. 启动开发服务器：`npm run dev`
2. 访问 http://localhost:5175/
3. 检查浏览器标签页中的标题
4. 导航到不同页面，验证标题是否正确更新
5. 切换语言，验证标题是否相应更新

### 2. 使用测试组件
访问 http://localhost:5175/test-page-titles 查看专门的测试界面

### 3. 使用验证工具
打开 `test-verification.html` 文件，使用提供的验证工具

## 🔧 技术特点

1. **响应式更新**：标题会随着路由变化和语言切换自动更新
2. **多语言支持**：支持英文、中文、韩文三种语言
3. **统一格式**：所有页面都遵循 "页面名称 | BitRadar" 的格式
4. **易于维护**：通过自定义Hook和翻译文件集中管理
5. **向后兼容**：不影响现有的页面功能

## 🚀 使用方法

在任何新的页面组件中，只需要：

```javascript
import usePageTitle from '../hooks/usePageTitle';

const NewPage = () => {
  // 使用翻译key
  usePageTitle('new_page');
  
  // 或者使用自定义标题
  usePageTitle(null, 'Custom Title');
  
  return <div>页面内容</div>;
};
```

然后在翻译文件的 `page_titles` 部分添加对应的翻译即可。

## ✨ 总结

成功实现了页面标题的统一管理和多语言支持，所有页面的标题现在都遵循 "页面名称 | BitRadar" 的格式，并且会根据当前语言设置显示相应的翻译。这个实现方案具有良好的可维护性和扩展性。
