const { CLOUD_ENV } = require('./utils/cloud-env.js')

App({
  onLaunch() {
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs.slice(0, 20))

    if (wx.cloud) {
      wx.cloud.init({
        env: CLOUD_ENV,
        traceUser: true
      })
    }
  },
  globalData: {
    userProfile: null
  }
})
