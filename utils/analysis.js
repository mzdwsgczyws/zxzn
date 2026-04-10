/**
 * 根据近日量化记录生成自修建议（观察与优化，非医疗建议）
 */

function avg(arr, key) {
  const xs = arr.map((r) => Number(r[key])).filter((n) => !Number.isNaN(n))
  if (!xs.length) return null
  return xs.reduce((a, b) => a + b, 0) / xs.length
}

function analyzeRecords(records) {
  const last7 = records.slice(-7)
  if (!last7.length) {
    return {
      title: '还没有足够数据',
      lines: ['请先记录至少一天的身心指标，再生成方案。'],
      focus: []
    }
  }

  const sleepH = avg(last7, 'sleepHours')
  const anger = avg(last7, 'angerCount')
  const worry = avg(last7, 'worryCount')
  const screen = avg(last7, 'screenHours')
  const walk = avg(last7, 'walkMinutes')
  const calm = avg(last7, 'calmMinutes')

  const lines = []
  const focus = []

  if (sleepH != null) {
    if (sleepH < 6.5) {
      lines.push(`近${last7.length}天平均睡眠约 ${sleepH.toFixed(1)} 小时，略偏低。优先把「就寝时间」固定，比强迫早起更稳。`)
      focus.push('固定就寝闹钟、睡前 30 分钟减屏')
    } else if (sleepH > 8.5) {
      lines.push(`睡眠较充足。若白天仍倦，可关注情绪消耗或运动不足。`)
    } else {
      lines.push(`睡眠时长在常见合理区间，可继续观察波动与睡前习惯。`)
    }
  }

  if (anger != null && anger > 1.5) {
    lines.push(`日均生气/强烈烦躁约 ${anger.toFixed(1)} 次，建议用「触发—反应」日记：只记事实与身体感受，不评判。`)
    focus.push('怒气记录 + 深呼吸 4-7-8 每日 3 组')
  }

  if (worry != null && worry > 3) {
    lines.push(`烦恼念头登记偏多，可每天划定 15 分钟「烦恼专用时间」，其余时间只写关键词延后处理。`)
    focus.push('烦恼清单延后处理法')
  }

  if (screen != null && screen > 6) {
    lines.push(`屏幕使用约 ${screen.toFixed(1)} 小时/日，可尝试「饭后一小时无娱乐屏」。`)
    focus.push('屏幕时长递减 10%')
  }

  if (walk != null && walk < 20) {
    lines.push(`步行偏少，每日增加 10–15 分钟散步，有助于「散→聚」的能量收束。`)
    focus.push('每日轻量步行')
  }

  if (calm != null && calm < 10) {
    lines.push(`静坐/正念时间较少，可从每日 5 分钟只观呼吸开始。`)
    focus.push('5 分钟呼吸静坐')
  }

  if (!lines.length) {
    lines.push('指标整体平稳。建议保持记录，每周对比一次趋势即可。')
  }

  lines.push('说明：本分析为自我观察辅助，情绪与睡眠持续困扰时请寻求专业帮助。')

  return {
    title: `基于近 ${last7.length} 天记录的自修侧重点`,
    lines,
    focus: focus.length ? focus : ['继续保持记录习惯']
  }
}

module.exports = { analyzeRecords }
