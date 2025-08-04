import React from 'react'
import './index.scss'

const VwDemo = () => {
  return (
    <div className="vw-demo">
      <div className="container-vw">
        <h1 className="vw-demo__title">vw 适配方案演示</h1>
        
        {/* 方法1: Tailwind 原生 vw 单位 */}
        <section className="vw-demo__section">
          <h2 className="vw-demo__section-title">方法1: Tailwind 原生 vw 单位</h2>
          <div className="w-[80vw] h-[20vw] bg-blue-500 text-white flex items-center justify-center mx-auto mb-4vw rounded-[2vw]">
            <span className="text-[4vw] font-bold">80vw × 20vw 容器</span>
          </div>
          <div className="flex gap-[4vw] justify-center">
            <div className="w-[25vw] h-[15vw] bg-red-500 rounded-[1vw] flex items-center justify-center">
              <span className="text-[3vw] text-white">25vw</span>
            </div>
            <div className="w-[25vw] h-[15vw] bg-green-500 rounded-[1vw] flex items-center justify-center">
              <span className="text-[3vw] text-white">25vw</span>
            </div>
            <div className="w-[25vw] h-[15vw] bg-purple-500 rounded-[1vw] flex items-center justify-center">
              <span className="text-[3vw] text-white">25vw</span>
            </div>
          </div>
        </section>

        {/* 方法2: Tailwind 预设 vw 类名 */}
        <section className="vw-demo__section">
          <h2 className="vw-demo__section-title">方法2: Tailwind 预设 vw 类名</h2>
          <div className="w-90vw h-20vw bg-yellow-500 text-black flex items-center justify-center mx-auto mb-4vw rounded-2vw">
            <span className="text-xl-vw font-bold">90vw × 20vw 容器</span>
          </div>
          <div className="grid grid-cols-4 gap-2vw">
            <div className="h-12vw bg-indigo-500 rounded-1vw flex items-center justify-center">
              <span className="text-sm-vw text-white">Grid 1</span>
            </div>
            <div className="h-12vw bg-pink-500 rounded-1vw flex items-center justify-center">
              <span className="text-sm-vw text-white">Grid 2</span>
            </div>
            <div className="h-12vw bg-teal-500 rounded-1vw flex items-center justify-center">
              <span className="text-sm-vw text-white">Grid 3</span>
            </div>
            <div className="h-12vw bg-orange-500 rounded-1vw flex items-center justify-center">
              <span className="text-sm-vw text-white">Grid 4</span>
            </div>
          </div>
        </section>

        {/* 方法3: SCSS 混合宏 */}
        <section className="vw-demo__section">
          <h2 className="vw-demo__section-title">方法3: SCSS 混合宏</h2>
          <div className="scss-vw-container">
            <div className="scss-vw-card">
              <h3 className="scss-vw-card__title">SCSS vw 卡片</h3>
              <p className="scss-vw-card__content">
                这个卡片使用 SCSS 混合宏实现 vw 适配，
                支持复杂的样式计算和响应式设计。
              </p>
              <button className="btn-vw btn-vw--primary">主要按钮</button>
              <button className="btn-vw btn-vw--secondary ml-2vw">次要按钮</button>
            </div>
          </div>
        </section>

        {/* 方法4: PostCSS 自动转换 */}
        <section className="vw-demo__section">
          <h2 className="vw-demo__section-title">方法4: PostCSS 自动转换</h2>
          <div className="postcss-demo">
            <div className="postcss-demo__item">
              <span>16px → 自动转换为 vw</span>
            </div>
            <div className="postcss-demo__item">
              <span>24px → 自动转换为 vw</span>
            </div>
            <div className="postcss-demo__item">
              <span>32px → 自动转换为 vw</span>
            </div>
          </div>
        </section>

        {/* 响应式演示 */}
        <section className="vw-demo__section">
          <h2 className="vw-demo__section-title">响应式演示</h2>
          <div className="w-[90vw] md:w-[60vw] lg:w-[40vw] h-[15vw] bg-gradient-to-r from-blue-500 to-purple-600 text-white flex items-center justify-center mx-auto rounded-[2vw]">
            <span className="text-[3.5vw] md:text-lg lg:text-xl font-bold">
              响应式 vw 容器
            </span>
          </div>
          <p className="text-center text-[3vw] md:text-sm lg:text-base mt-4vw text-gray-600">
            移动端: 90vw | 平板: 60vw | 桌面: 40vw
          </p>
        </section>

        {/* 工具类演示 */}
        <section className="vw-demo__section">
          <h2 className="vw-demo__section-title">工具类演示</h2>
          <div className="space-y-2vw">
            <div className="text-vw-xs bg-gray-100 p-2vw rounded-1vw">超小字体 (12px)</div>
            <div className="text-vw-sm bg-gray-200 p-2vw rounded-1vw">小字体 (14px)</div>
            <div className="text-vw-base bg-gray-300 p-2vw rounded-1vw">基础字体 (16px)</div>
            <div className="text-vw-lg bg-gray-400 p-2vw rounded-1vw text-white">大字体 (18px)</div>
            <div className="text-vw-xl bg-gray-500 p-2vw rounded-1vw text-white">超大字体 (20px)</div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default VwDemo
