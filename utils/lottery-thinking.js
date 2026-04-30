/**
 * 抽签「思考模式」：仅展示纳入运算的数据门类（不展开具体取值），
 * 配合 lottery-core 中间隔 setData 做逐项渐显。
 */

/** 与 fortune 种子相对应的高层类目，文案保持克制、不罗列字段值 */
const THINKING_CATEGORIES = [
  '历法与时间锚点',
  '卦象与文化映射',
  '环境与气象上下文',
  '道性分型与档案画像',
  '箴言偏好与近况'
]

const THINKING_FOOTNOTE =
  '上述门类按固定规则汇合为当日指纹并映射卦序；同日、同档案与同环境下稳定对应，非无序抽签。仅供文化自察参考。'

/** @returns {{ categories: string[], footnote: string }} */
function buildLotteryThinkingBrief() {
  return {
    categories: THINKING_CATEGORIES.slice(),
    footnote: THINKING_FOOTNOTE
  }
}

module.exports = { buildLotteryThinkingBrief }
