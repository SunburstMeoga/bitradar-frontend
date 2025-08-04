import postcss from 'postcss'
import tailwindcss from 'tailwindcss'
import vwPlugin from './tailwind-vw-plugin.js'

// 测试配置
const tailwindConfig = {
  content: [{ raw: 'w-[200vw] h-[300vw] text-[16vw] p-[12vw] m-[8vw]' }],
  plugins: [vwPlugin],
}

// 测试 CSS
const testCSS = `
@tailwind utilities;
`

async function testPlugin() {
  try {
    const result = await postcss([
      tailwindcss(tailwindConfig)
    ]).process(testCSS, { from: undefined })

    console.log('生成的 CSS:')
    console.log(result.css)
    
    // 验证是否包含正确的 vw 值
    const css = result.css
    
    console.log('\n验证结果:')
    
    // 200px = (200/375)*100 = 53.333vw
    if (css.includes('53.333')) {
      console.log('✅ w-[200vw] 正确转换为 53.333vw')
    } else {
      console.log('❌ w-[200vw] 转换失败')
    }
    
    // 300px = (300/375)*100 = 80vw
    if (css.includes('80vw')) {
      console.log('✅ h-[300vw] 正确转换为 80vw')
    } else {
      console.log('❌ h-[300vw] 转换失败')
    }
    
    // 16px = (16/375)*100 = 4.267vw
    if (css.includes('4.267')) {
      console.log('✅ text-[16vw] 正确转换为 4.267vw')
    } else {
      console.log('❌ text-[16vw] 转换失败')
    }
    
    // 12px = (12/375)*100 = 3.2vw
    if (css.includes('3.2vw')) {
      console.log('✅ p-[12vw] 正确转换为 3.2vw')
    } else {
      console.log('❌ p-[12vw] 转换失败')
    }
    
    // 8px = (8/375)*100 = 2.133vw
    if (css.includes('2.133')) {
      console.log('✅ m-[8vw] 正确转换为 2.133vw')
    } else {
      console.log('❌ m-[8vw] 转换失败')
    }
    
  } catch (error) {
    console.error('测试失败:', error)
  }
}

testPlugin()
