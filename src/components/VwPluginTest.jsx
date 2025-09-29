import { formatAddress } from '../utils/web3';

const VwPluginTest = () => {
  // 测试地址格式化
  const testAddress = '0x1234567890abcdef1234567890abcdef12345678';
  const formattedAddress = formatAddress(testAddress);

  return (
    <div className="p-[20vw] bg-white text-black">
      <h1 className="text-size-[24vw] font-bold mb-[16vw]">vw插件测试</h1>

      {/* 地址格式化测试 */}
      <div className="bg-blue-100 p-[8vw] mb-[16vw] rounded-[4vw]">
        <h2 className="text-size-[16vw] font-bold mb-[8vw]">地址格式化测试</h2>
        <div className="text-size-[12vw]">
          <p><strong>原地址:</strong> {testAddress}</p>
          <p><strong>格式化后:</strong> {formattedAddress}</p>
          <p><strong>预期结果:</strong> 0x1...678 (前3位+0x，后3位)</p>
        </div>
      </div>
      
      <div className="space-y-[16vw]">
        {/* 测试padding */}
        <div className="bg-red-200 p-[11vw]">
          <div className="bg-blue-200">p-[11vw] - 在375px下应该是11px的padding</div>
        </div>
        
        <div className="bg-red-200 px-[11vw] py-[16vw]">
          <div className="bg-blue-200">px-[11vw] py-[16vw] - 在375px下应该是左右11px，上下16px</div>
        </div>
        
        {/* 测试字体 */}
        <div className="bg-green-200 p-[8vw]">
          <div className="text-size-[11vw]">text-size-[11vw] - 在375px下应该是11px字体</div>
          <div className="text-size-[15vw]">text-size-[15vw] - 在375px下应该是15px字体</div>
          <div className="text-size-[13vw]">text-size-[13vw] - 在375px下应该是13px字体</div>
          <div className="font-size-[16vw] text-red-600">font-size-[16vw] - 另一种写法，16px字体</div>
        </div>
        
        {/* 测试宽高 */}
        <div className="bg-yellow-200 p-[8vw]">
          <div className="w-[104vw] h-[24vw] bg-purple-500 text-white flex items-center justify-center text-size-[12vw]">
            104×24 (Logo尺寸)
          </div>
          <div className="w-[100vw] h-[34vw] bg-blue-500 text-white flex items-center justify-center text-size-[12vw] mt-[8vw]">
            100×34 (按钮尺寸)
          </div>
        </div>
        
        {/* 测试margin（包括负margin） */}
        <div className="bg-pink-200 p-[8vw]">
          <div className="bg-orange-300 mb-[16vw] p-[8vw]">mb-[16vw] - 下边距16px</div>
          <div className="bg-orange-300 mx-[20vw] p-[8vw]">mx-[20vw] - 左右边距20px</div>
          <div className="bg-red-400 -mt-[12vw] p-[8vw] text-white">-mt-[12vw] - 负上边距-12px</div>
          <div className="bg-blue-400 -mx-[8vw] p-[8vw] text-white">-mx-[8vw] - 负左右边距-8px</div>
        </div>
        
        {/* 测试圆角和边框 */}
        <div className="bg-gray-200 p-[8vw]">
          <div className="bg-green-400 rounded-[4vw] p-[8vw] mb-[8vw]">rounded-[4vw] - 4px圆角</div>
          <div className="bg-blue-400 border-[1vw] border-red-500 p-[8vw]">border-[1vw] - 1px边框</div>
        </div>
        
        {/* 测试gap */}
        <div className="bg-indigo-200 p-[8vw]">
          <div className="flex gap-[8vw]">
            <div className="bg-red-400 p-[8vw] text-white">Item 1</div>
            <div className="bg-green-400 p-[8vw] text-white">Item 2</div>
            <div className="bg-blue-400 p-[8vw] text-white">Item 3</div>
          </div>
          <div className="text-size-[12vw] mt-[8vw]">gap-[8vw] - 8px间距</div>
        </div>
      </div>
    </div>
  );
};

export default VwPluginTest;
