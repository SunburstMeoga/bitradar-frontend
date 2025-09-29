import React from 'react'
import './index.scss'

const VwTest = () => {
  return (
    <div className="vw-test">
      <div className="container mx-auto p-4">
        <h1 className="text-[24vw] font-bold text-center mb-8">
          vw 插件测试
        </h1>
        
        <div className="space-y-8">
          {/* 测试你的具体需求 */}
          <section className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-[18vw] font-semibold mb-4">
              你的测试用例
            </h2>
            <div className="w-[200vw] h-[300vw] bg-primary flex items-center justify-center text-black font-bold">
              w-[200vw] × h-[300vw]
              <br />
              设计稿: 200px × 300px
              <br />
              375px设备: 200px × 300px
              <br />
              750px设备: 400px × 600px
            </div>
            <p className="text-[14vw] mt-4 text-gray-600">
              这个 div 在 375px 设备上应该是 200px × 300px，在 750px 设备上应该是 400px × 600px
            </p>
          </section>

          {/* 更多测试用例 */}
          <section className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-[18vw] font-semibold mb-4">
              更多测试用例
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="w-[100vw] h-[100vw] bg-blue-500 text-white flex items-center justify-center text-[12vw]">
                100×100
              </div>
              <div className="w-[100vw] h-[80vw] bg-green-500 text-white flex items-center justify-center text-[12vw]">
                100×80
              </div>
              <div className="w-[100vw] h-[100vw] bg-red-500 text-white flex items-center justify-center text-[12vw]">
                100×100
              </div>
            </div>
          </section>

          {/* 计算验证 */}
          <section className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-[18vw] font-semibold mb-4">
              计算验证
            </h2>
            <div className="space-y-2 text-[14vw]">
              <p><strong>基准宽度:</strong> 375px</p>
              <p><strong>计算公式:</strong> vw = (px / 375) * 100</p>
              <p><strong>200px =</strong> (200 / 375) * 100 = 53.333vw</p>
              <p><strong>300px =</strong> (300 / 375) * 100 = 80vw</p>
            </div>
            
            <div className="mt-4 p-4 bg-gray-100 rounded">
              <p className="text-[12vw] text-gray-700">
                在开发者工具中检查上面的 div，应该看到：
              </p>
              <code className="text-[11vw] text-blue-600">
                width: 53.333vw; height: 80vw;
              </code>
            </div>
          </section>

          {/* 响应式测试 */}
          <section className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-[18vw] font-semibold mb-4">
              响应式测试
            </h2>
            <div className="w-[200vw] h-[100vw] bg-purple-500 text-white flex items-center justify-center text-[14vw] md:w-[300vw] md:h-[150vw]">
              移动端: 200×100 | 桌面端: 300×150
            </div>
            <p className="text-[12vw] mt-2 text-gray-600">
              这个 div 在移动端是 200×100，在桌面端是 300×150
            </p>
          </section>

          {/* 边距和字体测试 */}
          <section className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-[18vw] font-semibold mb-4">
              边距和字体测试
            </h2>
            <div className="space-y-4">
              <div className="p-[16vw] bg-yellow-200 text-[16vw]">
                内边距 16vw，字体 16vw
              </div>
              <div className="m-[20vw] p-[12vw] bg-pink-200 text-[14vw]">
                外边距 20vw，内边距 12vw，字体 14vw
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default VwTest
