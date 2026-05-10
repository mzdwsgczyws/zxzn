/**
 * 心象日历页：自然日日历格子（dateStr 与抽签历史一致：无补零 Y-M-D）。
 */

const WEEK_TITLES = ['日', '一', '二', '三', '四', '五', '六']

/** @param {number} y @param {number} m 1-12 @param {number} d */
function formatDateKey(y, m, d) {
  return `${y}-${m}-${d}`
}

/**
 * @param {number} calYear
 * @param {number} calMonth 1-12
 * @param {Record<string, object>} trendByDate dateStr -> row
 */
function buildMonthCells(calYear, calMonth, trendByDate) {
  const trend = trendByDate || {}
  const first = new Date(calYear, calMonth - 1, 1)
  const lastDay = new Date(calYear, calMonth, 0).getDate()
  const startPad = first.getDay()
  const cells = []
  let keyI = 0
  for (let i = 0; i < startPad; i++) {
    cells.push({ type: 'pad', cellKey: `pad-${keyI++}` })
  }
  for (let d = 1; d <= lastDay; d++) {
    const dateStr = formatDateKey(calYear, calMonth, d)
    const hit = trend[dateStr]
    const dt = new Date(calYear, calMonth - 1, d)
    const wd = dt.getDay()
    const isWeekend = wd === 0 || wd === 6
    cells.push({
      type: 'day',
      cellKey: dateStr,
      day: d,
      dateStr,
      hasSign: !!hit,
      tierColor: hit ? hit.tierColor : '',
      tierLabel: hit ? hit.tierLabel : '',
      titleShort: hit && hit.title ? String(hit.title).slice(0, 8) : '',
      isWeekend
    })
  }
  return cells
}

/** @param {{ dateStr: string }[]} rows */
function computeYearBounds(rows, fallbackYear) {
  let minY = fallbackYear
  let maxY = fallbackYear
  ;(rows || []).forEach((r) => {
    const y = parseInt(String(r.dateStr).split('-')[0], 10)
    if (!Number.isNaN(y)) {
      minY = Math.min(minY, y)
      maxY = Math.max(maxY, y)
    }
  })
  return { minY, maxY }
}

function buildYearChoices(minY, maxY) {
  const low = Math.min(minY, maxY)
  const high = Math.max(minY, maxY)
  const arr = []
  for (let y = low; y <= high; y++) arr.push(y)
  return arr.length ? arr : [new Date().getFullYear()]
}

module.exports = {
  WEEK_TITLES,
  formatDateKey,
  buildMonthCells,
  computeYearBounds,
  buildYearChoices
}
