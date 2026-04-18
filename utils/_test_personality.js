// 临时测试脚本，验证 personality.js 结构完整性
const wx = { getStorageSync: () => null, setStorageSync: () => {} }
global.wx = wx
const p = require('./personality.js')
console.log('Questions:', p.QUESTIONS.length)
console.log('Types:', p.PERSONALITY_TYPES.length)

let bad = 0
p.QUESTIONS.forEach((q) => {
  if (!q.options || q.options.length < 5) {
    console.log('BAD Q', q.id, q.options && q.options.length)
    bad++
  }
})
if (bad === 0) console.log('All 36 questions have >= 5 options OK')

// 测试计分
const answers = {}
p.QUESTIONS.forEach((q) => { answers[q.id] = 2 }) // 全选中间项
const r = p.calculatePersonality(answers)
console.log('All-neutral result:', r.typeName, JSON.stringify(r.scores))

// 测试全选第一项
const answers2 = {}
p.QUESTIONS.forEach((q) => { answers2[q.id] = 0 })
const r2 = p.calculatePersonality(answers2)
console.log('All-first result:', r2.typeName, JSON.stringify(r2.scores))
