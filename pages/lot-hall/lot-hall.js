const { getFirstUnlockListSorted } = require('../../utils/lottery-history.js')
const { TIER_COLORS } = require('../../utils/lottery-core.js')

Page({
  data: {
    rows: [],
    empty: true
  },

  onShow() {
    const list = getFirstUnlockListSorted()
    const rows = list.map((r) => ({
      ...r,
      tierColor: TIER_COLORS[r.tier] || '#1565c0'
    }))
    this.setData({
      rows,
      empty: rows.length === 0
    })
  }
})
