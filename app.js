const { CLOUD_ENV } = require('./utils/cloud-env.js')
const usageAnalytics = require('./utils/usage-analytics.js')
const { ensureLotArtFont } = require('./utils/lot-font.js')

App({
  onLaunch() {
    usageAnalytics.onAppLaunch()
    ensureLotArtFont()

    if (wx.cloud) {
      wx.cloud.init({
        env: CLOUD_ENV,
        traceUser: true
      })
    }
  },

  onShow() {
    usageAnalytics.onAppShow()
  },

  onHide() {
    usageAnalytics.onAppHide()
  },

  globalData: {
    userProfile: null
  }
})
