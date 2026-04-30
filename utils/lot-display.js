/**
 * 按个人档案中的表述偏好调整展示用释义（不改变条目与编号）。
 */

function applyLotStylePref(lot, pref) {
  if (!lot) return lot
  const interp = lot.interpret || ''
  const out = { ...lot }
  const p = pref || 'rich'
  if (p === 'brief') {
    const parts = interp.split(/[。！？]/).filter((s) => s && s.trim())
    const first = (parts[0] || interp).trim()
    out.interpret =
      first.length >= 8
        ? first + (/[。！？]$/.test(first) ? '' : '。')
        : (interp.slice(0, 96) + (interp.length > 96 ? '…' : ''))
  } else if (p === 'plain') {
    out.interpret = interp
      .replace(/，/g, '，\n')
      .replace(/。/g, '。\n')
      .replace(/\n+/g, '\n')
      .trim()
  } else if (p === 'classical') {
    out.interpret = interp
  } else {
    out.interpret = interp
  }
  return out
}

module.exports = { applyLotStylePref }
