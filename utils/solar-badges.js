/**
 * 节气徽章收集：在某节气前后 ±3 天内有抽签记录，即视为「集齐」该节气徽章。
 */

var { SOLAR_TERMS } = require('./seasonal.js')
var { loadHistoryRaw } = require('./lottery-history.js')

function computeSolarBadges() {
  var raw = loadHistoryRaw()
  var draws = raw.draws || []

  var collected = {}

  draws.forEach(function (d) {
    if (!d.dateStr) return
    var parts = String(d.dateStr).split('-').map(Number)
    if (parts.length < 3 || parts.some(isNaN)) return
    var year = parts[0]
    var drawTime = new Date(year, parts[1] - 1, parts[2]).getTime()

    SOLAR_TERMS.forEach(function (term) {
      if (collected[term.name]) return
      var termTime = new Date(year, term.month - 1, term.day).getTime()
      var diff = Math.abs(drawTime - termTime)
      if (diff <= 3 * 86400000) {
        collected[term.name] = d.dateStr
      }
    })
  })

  var collectedNames = Object.keys(collected)

  var list = SOLAR_TERMS.map(function (term) {
    var isCollected = !!collected[term.name]
    return {
      name: term.name,
      hint: term.hint,
      collected: isCollected,
      collectDate: isCollected ? collected[term.name] : null
    }
  })

  return {
    collected: collectedNames,
    total: 24,
    list: list,
    count: collectedNames.length
  }
}

module.exports = { computeSolarBadges: computeSolarBadges }
