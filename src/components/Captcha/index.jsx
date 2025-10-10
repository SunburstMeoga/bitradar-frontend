import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  loadCaptchaEnginge,
  LoadCanvasTemplate,
  LoadCanvasTemplateNoReload,
  validateCaptcha,
} from 'react-simple-captcha';

/**
 * Global Captcha component based on react-simple-captcha
 * Props:
 * - length: number of characters (default 6)
 * - backgroundColor: canvas background color
 * - fontColor: captcha font color
 * - charset: one of 'upper' | 'lower' | 'numbers' | 'special_char' | undefined
 * - noReload: disable reload link on canvas
 * - reloadText: custom reload text (only when noReload=false)
 * - reloadColor: custom reload text color (only when noReload=false)
 * - noReloadOnFail: do not auto-reload when validation fails
 * - onSuccess: callback on successful validation
 * - onFailure: callback on failed validation
 */
export default function Captcha({
  // 新增统一的 props 以兼容需求描述
  captchaType = 'text', // 'text' | 'math'
  onSuccess,
  onFail,
  onLoad,
  bgColor = 'rgb(245,245,245)',
  charLength = 6,
  placeholder,
  reloadText,
  reloadIcon,
  className,
  inputClassName,
  reloadClassName,
  // 兼容原先基于 react-simple-captcha 的高级控制
  backgroundColor,
  fontColor,
  charset,
  noReload = false,
  reloadColor,
  noReloadOnFail = false,
  // 算术题扩展
  operators = ['+','-','*'],
}) {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState('');
  const [status, setStatus] = useState(null); // 'success' | 'error' | null
  const [math, setMath] = useState({ x: 0, y: 0, op: '+', answer: 0 });

  // 文本型验证码初始化（使用第三方库）
  const loadEngine = useCallback(() => {
    loadCaptchaEnginge(charLength, backgroundColor, fontColor, charset);
  }, [charLength, backgroundColor, fontColor, charset]);

  // 数学型验证码初始化
  const loadMath = useCallback(() => {
    // 随机选择运算符，增强干扰
    const ops = Array.isArray(operators) && operators.length ? operators : ['+'];
    const op = ops[Math.floor(Math.random() * ops.length)];

    let x = Math.floor(Math.random() * 9) + 1; // 1~9
    let y = Math.floor(Math.random() * 9) + 1; // 1~9
    let answer = x + y;

    if (op === '-') {
      // 保证非负结果
      if (y > x) [x, y] = [y, x];
      answer = x - y;
    } else if (op === '*') {
      // 乘法范围稍小以保证易读
      x = Math.floor(Math.random() * 8) + 2; // 2~9
      y = Math.floor(Math.random() * 8) + 2; // 2~9
      answer = x * y;
    } else {
      answer = x + y;
    }
    setMath({ x, y, op, answer });
  }, [operators]);

  useEffect(() => {
    if (captchaType === 'text') {
      loadEngine();
    } else {
      loadMath();
    }
    onLoad && onLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [captchaType]);

  const handleValidate = () => {
    let ok = false;
    if (captchaType === 'text') {
      ok = validateCaptcha(inputValue, noReloadOnFail) === true;
      // 成功后刷新下一次；失败时由库内部决定是否刷新（取决于第二参数）
      if (ok) loadEngine();
    } else {
      ok = Number(inputValue) === math.answer;
      // 数学题：根据结果刷新下一题
      loadMath();
    }

    setStatus(ok ? 'success' : 'error');
    setInputValue('');
    if (ok) {
      onSuccess && onSuccess();
    } else {
      onFail && onFail();
    }
  };

  const handleReload = () => {
    if (captchaType === 'text') {
      loadEngine();
    } else {
      loadMath();
    }
  };

  return (
    <div className={className} style={{ display: 'grid', gap: 12 }}>
      {/* 展示区域：深色背景 + 噪点纹理 + 绿色点缀 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: 'linear-gradient(180deg, #151515, #101010)',
          padding: 12,
          borderRadius: 12,
          border: '1px solid #272727',
          boxShadow: '0 6px 18px rgba(0,0,0,0.35)',
          backgroundImage:
            'radial-gradient(#ffffff0a 1px, transparent 1px)',
          backgroundSize: '10px 10px',
          backgroundBlendMode: 'soft-light',
        }}
      >
        {captchaType === 'text' ? (
          // 始终使用无内置重载控件的模板，统一外部“换一组”文案
          <LoadCanvasTemplateNoReload />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/** 将数字做一定倾斜与随机绿色，提高阅读难度 */}
            {(() => {
              const rdeg = () => Math.floor(Math.random() * 40) - 20; // -20 ~ +20°
              const rsize = () => Math.floor(Math.random() * 12) + 18; // 18~30
              const rspace = () => Math.floor(Math.random() * 2) + 1; // 1~2
              // 颜色完全随机（HSL），不局限绿色系
              const rcol = () => {
                const h = Math.floor(Math.random() * 360);
                const s = 70; // 保持饱和度以提升区分度
                const l = 60; // 保持亮度以保证可读性
                return `hsl(${h} ${s}% ${l}%)`;
              };
              const numStyle = (deg) => ({
                transform: `rotate(${deg}deg) skewX(${deg > 0 ? 6 : -6}deg)`,
                color: rcol(),
                fontWeight: 700,
                fontSize: rsize(),
                letterSpacing: rspace(),
                textShadow: '0 1px 2px rgba(0,0,0,0.35)',
              });
              return (
                <>
                  <span style={numStyle(rdeg())}>{math.x}</span>
                  <span style={{ color: '#7c7c7c', fontWeight: 600, fontSize: 18 }}>{math.op}</span>
                  <span style={numStyle(rdeg())}>{math.y}</span>
                  <span style={{ color: '#7c7c7c', fontWeight: 600, fontSize: 18 }}>=</span>
                  <span style={{ color: '#7c7c7c', fontWeight: 600, fontSize: 18 }}>?</span>
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* 自定义重载按钮：独立于输入区域的块，使用项目绿色 */}
      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <button
          type="button"
          onClick={handleReload}
          className={reloadClassName}
          style={{
            padding: 0,
            border: 'none',
            background: 'transparent',
            color: '#c5ff33',
            cursor: 'pointer',
            textDecoration: 'underline',
            fontSize: 12,
          }}
        >
          {reloadIcon ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <img src={reloadIcon} alt="reload" style={{ width: 14, height: 14 }} />
              {reloadText || t('captcha.reload_text')}
            </span>
          ) : (
            reloadText || t('captcha.reload_text')
          )}
        </button>
      </div>

      {/* 输入与校验 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder || (captchaType === 'math' ? t('captcha.placeholder_math') : 'Enter Captcha')}
          className={inputClassName}
          style={{
            flex: 1,
            height: 40,
            padding: '0 12px',
            border: '1px solid #2a2a2a',
            background: '#0f0f0f',
            color: '#e5e7eb',
            borderRadius: 10,
            outline: 'none',
            boxShadow: 'inset 0 0 0 1px #1a1a1a',
          }}
        />
        <button
          type="button"
          onClick={handleValidate}
          style={{
            height: 40,
            padding: '0 16px',
            borderRadius: 10,
            border: '1px solid #c5ff33',
            background: '#c5ff33',
            color: '#0f0f0f',
            cursor: 'pointer',
          }}
        >
          {t('captcha.verify_button')}
        </button>
      </div>

      {status === 'success' && (
        <div style={{ color: '#c5ff33' }}>{t('captcha.success')}</div>
      )}
      {status === 'error' && (
        <div style={{ color: '#ef4444' }}>{t('captcha.fail')}</div>
      )}
    </div>
  );
}