/**
 * 页面级统计：与 utils/usage-analytics.js 配合，记录路由跳转与停留时长。
 */
const { onPageShow, onPageHide } = require('../utils/usage-analytics.js')

function currentRoute() {
  const pages = getCurrentPages()
  const cur = pages[pages.length - 1]
  return cur && cur.route ? cur.route : ''
}

module.exports = Behavior({
  pageLifetimes: {
    show() {
      this._analyticsEnterTs = Date.now()
      onPageShow(currentRoute())
    },
    hide() {
      const ts = this._analyticsEnterTs || 0
      onPageHide(currentRoute(), ts)
      this._analyticsEnterTs = 0
    }
  }
})
