/**
 * 抽取心象箴言前档案完整度：用于提示用户是否去完善（仅存本机字段）。
 */

const VALID_RECENT = ['low', 'mid', 'high']
const VALID_RHYTHM = ['early', 'night', 'irregular']
const VALID_STYLE = ['brief', 'rich', 'classical', 'plain']
const VALID_FOCUS = new Set(['work', 'relation', 'health', 'study', 'finance', 'family', 'rest'])

function isLotteryProfileComplete(profile) {
  const p = profile || {}
  if (!p.recentState || VALID_RECENT.indexOf(p.recentState) < 0) return false
  if (!p.rhythmType || VALID_RHYTHM.indexOf(p.rhythmType) < 0) return false
  if (!p.lotStylePref || VALID_STYLE.indexOf(p.lotStylePref) < 0) return false
  const tags = p.focusTags
  if (!Array.isArray(tags) || tags.length === 0) return false
  const ok = tags.some((t) => VALID_FOCUS.has(t))
  return ok
}

module.exports = { isLotteryProfileComplete, VALID_FOCUS }
