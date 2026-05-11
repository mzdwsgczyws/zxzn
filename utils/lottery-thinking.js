/**
 * 抽签「思考模式」：仅展示纳入运算的数据门类（不展开具体取值），
 * 配合 lottery-core 中间隔 setData 做逐项渐显。
 */

/** 与 fortune 种子相对应的高层类目，文案保持克制、不罗列字段值 */
const THINKING_CATEGORIES = [
  '历法与时间锚点',
  '经典文案与文化意象',
  '环境与气象上下文',
  '道性分型与档案画像',
  '箴言偏好与近况'
]

const THINKING_FOOTNOTE =
  '所用传统文化意象仅为修辞与联想参照，不作对未来的断言；仅供文化自察与行动参考。'

/** @returns {{ categories: string[], footnote: string }} */
function buildLotteryThinkingBrief() {
  return {
    categories: THINKING_CATEGORIES.slice(),
    footnote: THINKING_FOOTNOTE
  }
}

module.exports = { buildLotteryThinkingBrief }
