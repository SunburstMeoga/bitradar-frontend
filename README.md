# BitRadar Frontend

BitRadar is a decentralized finance (DeFi) application built with React and Vite, featuring Web3 wallet integration and mobile-first responsive design. This frontend application serves as the user interface for the BitRadar ecosystem, providing users with a gateway to decentralized finance services.

## 🚀 Features

- **Web3 Integration**: Connect with MetaMask and other Web3 wallets
- **Multi-language Support**: English, Chinese, and Korean localization
- **Mobile-First Design**: Responsive design with advanced vw adaptation system
- **BSC Integration**: Built for Binance Smart Chain (BSC) mainnet and testnet
- **Modern Tech Stack**: React 19, Vite, Tailwind CSS, and Zustand state management

## 🛠️ Tech Stack

### Core Technologies

- **React 19** - Latest React with concurrent features
- **Vite** - Fast build tool and development server
- **React Router DOM** - Client-side routing
- **Zustand** - Lightweight state management

### Styling & UI

- **Tailwind CSS** - Utility-first CSS framework
- **SCSS** - Enhanced CSS with variables and mixins
- **PostCSS** - CSS processing with px-to-viewport conversion
- **Custom vw Plugin** - Advanced mobile adaptation system

### Web3 & Blockchain

- **Web3.js** - Ethereum JavaScript API
- **MetaMask Integration** - Wallet connection and transaction handling
- **BSC Support** - Binance Smart Chain mainnet and testnet

### Internationalization

- **i18next** - Internationalization framework
- **react-i18next** - React integration for i18next
- **Language Detection** - Automatic language detection and persistence

### Development Tools

- **ESLint** - Code linting and quality assurance
- **Yarn** - Package management
- **Autoprefixer** - CSS vendor prefixing

## 📱 Mobile Adaptation System

This project features an advanced mobile adaptation system with four different approaches:

### 1. Tailwind vw Plugin (Recommended)

```jsx
<div className="w-[200vw] h-[300vw] bg-primary">
  // 200px and 300px in 375px design, auto-scales to any device
</div>
```

### 2. PostCSS Auto-conversion

```scss
.container {
  width: 200px; // Automatically converted to vw units
  height: 300px; // Based on 375px design width
}
```

### 3. Predefined vw Classes

```jsx
<div className="w-vw-200 h-vw-300">// Predefined vw utility classes</div>
```

### 4. SCSS Responsive Mixins

```scss
.element {
  @include responsive(width, 200px, 300px, 400px);
  // Mobile: 200px, Tablet: 300px, Desktop: 400px
}
```

## 🚀 Quick Start

### Prerequisites

- Node.js 16+
- Yarn package manager
- MetaMask or compatible Web3 wallet

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd bitradar-frontend
   ```

2. **Install dependencies**

   ```bash
   yarn install
   ```

3. **Environment setup**

   ```bash
   # Copy environment file
   cp .env.development .env.local

   # Edit environment variables as needed
   ```

4. **Start development server**

   ```bash
   yarn dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

### Available Scripts

```bash
# Development
yarn dev          # Start development server with HMR

# Production
yarn build        # Build for production
yarn preview      # Preview production build locally

# Code Quality
yarn lint         # Run ESLint for code quality checks
```

## 🌐 Environment Configuration

### Development (.env.development)

```env
VITE_APP_ENV=development
VITE_BASE_URL=http://localhost:3000

# BSC Testnet Configuration
VITE_BSC_CHAIN_ID=97
VITE_BSC_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/
VITE_BSC_BLOCK_EXPLORER=https://testnet.bscscan.com

# API Configuration
VITE_API_BASE_URL=https://api-dev.bitradar.com
VITE_WS_URL=wss://ws-dev.bitradar.com
```

### Production (.env.production)

```env
VITE_APP_ENV=production
VITE_BASE_URL=https://bitradar.com

# BSC Mainnet Configuration
VITE_BSC_CHAIN_ID=56
VITE_BSC_RPC_URL=https://bsc-dataseed1.binance.org/
VITE_BSC_BLOCK_EXPLORER=https://bscscan.com

# API Configuration
VITE_API_BASE_URL=https://api.bitradar.com
VITE_WS_URL=wss://ws.bitradar.com
```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout/         # Layout components (Header, Footer)
│   ├── LanguageSelector/ # Language switching component
│   └── VwTest/         # vw adaptation demo component
├── pages/              # Page components
│   ├── Home/           # Home page
│   └── NotFound/       # 404 page
├── router/             # React Router configuration
├── store/              # Zustand state management
│   ├── index.js        # Store exports
│   ├── appStore.js     # App-wide state
│   └── web3Store.js    # Web3 wallet state
├── utils/              # Utility functions
│   └── web3.js         # Web3 helper functions
├── i18n/               # Internationalization
│   ├── index.js        # i18n configuration
│   └── locales/        # Translation files
│       ├── en.json     # English translations
│       ├── zh.json     # Chinese translations
│       └── ko.json     # Korean translations
├── styles/             # Global styles and SCSS
│   └── main.scss       # Main stylesheet with mixins
└── assets/             # Static assets
```

## 🎨 Design System

### Color Palette

- **Primary Color**: `#c5ff33` - 项目主色调（按钮、选中状态等）
- **Background Primary**: `#121212` - 主背景色（页面背景、顶部栏背景）
- **Background Secondary**: `#1f1f1f` - 次要背景色（底部导航栏背景）
- **Text Primary**: `#ffffff` - 主要文字颜色
- **Text Secondary**: `#8f8f8f` - 次要文字颜色（未选中状态）
- **Border Primary**: `#121212` - 主要边框颜色

### Component Specifications

#### Header (顶部栏)

- **Background**: `#121212`
- **Padding**: `11px 16px` (vw 适配)
- **Logo**: `104px × 24px`
- **Connect Button**: `130px × 34px`, 白色背景，黑色文字，15px 字体，4px 圆角
- **Connected Button**: 透明背景，`#121212`边框，9px 内边距，13px 字体

#### Footer (底部导航栏)

- **Background**: `#1f1f1f`
- **Padding**: `12px 8px` (vw 适配)
- **Height**: `42px`
- **Icons**: `24px × 24px`
- **Font Size**: `11px`
- **Active Color**: `#c5ff33`
- **Inactive Color**: `#8f8f8f`

## 🔧 Configuration Files

- **`vite.config.js`** - Vite build configuration
- **`tailwind.config.js`** - Tailwind CSS configuration with vw extensions
- **`postcss.config.js`** - PostCSS configuration for px-to-vw conversion
- **`tailwind-vw-plugin.js`** - Custom Tailwind plugin for vw adaptation
- **`eslint.config.js`** - ESLint configuration for code quality
- **`src/styles/colors.js`** - 项目颜色常量定义

## 🌍 Internationalization

The application supports three languages:

- **English (en)** - Default language
- **Chinese (zh)** - Simplified Chinese
- **Korean (ko)** - Korean

Language detection is automatic based on browser settings, with manual switching available through the language selector component.

## 🔗 Web3 Integration

### Supported Networks

- **BSC Mainnet** (Chain ID: 56)
- **BSC Testnet** (Chain ID: 97)

### Wallet Features

- MetaMask connection
- Account address display
- Network switching
- Transaction handling
- Wallet state persistence

## 📱 Responsive Design

The application uses a mobile-first approach with breakpoints:

- **Mobile**: < 640px (base styles)
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

The custom vw adaptation system ensures perfect scaling across all device sizes based on a 375px design width.

## 🚀 Deployment

### Build for Production

```bash
yarn build
```

### Preview Production Build

```bash
yarn preview
```

The build output will be in the `dist/` directory, ready for deployment to any static hosting service.

## 📚 Additional Documentation

- **[VW Adaptation Guide](./README-VW-ADAPTATION.md)** - Detailed guide on the mobile adaptation system
- **[VW Plugin Implementation](./VW-PLUGIN-IMPLEMENTATION.md)** - Technical details of the custom Tailwind vw plugin
- **[VW Adaptation Guide](./docs/vw-adaptation-guide.md)** - Comprehensive usage guide

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary to BitRadar.

## 🆘 Support

For support and questions, please contact the development team or create an issue in the repository.

---

**Built with ❤️ by the BitRadar Team**
