/**
 * 页面级使用统计：停留时长、跳转边（与 app 级 session 配合）
 * 挂到 Page({ behaviors: [pageAnalytics] })
 */
const analytics = require('../utils/usage-analytics.js')

module.exports = Behavior({
  pageLifetimes: {
    show() {
      const pages = getCurrentPages()
      const cur = pages.length ? pages[pages.length - 1] : null
      const route = cur && cur.route ? cur.route : ''
      this._usageEnterAt = Date.now()
      this._usageRoute = route
      analytics.onPageShow(route)
    },
    hide() {
      const path = this._usageRoute
      const t0 = this._usageEnterAt
      if (path && t0) {
        analytics.onPageHide(path, t0)
      }
      this._usageEnterAt = 0
    }
  }
})
