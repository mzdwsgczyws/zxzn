/**
 * 天气：使用 Open-Meteo 公开接口（无需 key）。
 * 请在微信公众平台 → 开发 → 开发管理 → 服务器域名 → request 合法域名 中添加：
 *   https://api.open-meteo.com
 * 详见：https://developers.weixin.qq.com/miniprogram/dev/framework/ （网络 / 业务域名）
 */

const WMO_CN = {
  0: '晴',
  1: '大部晴朗',
  2: '多云',
  3: '阴',
  45: '雾',
  48: '雾凇',
  51: '小毛毛雨',
  53: '毛毛雨',
  55: '大毛毛雨',
  61: '小雨',
  63: '中雨',
  65: '大雨',
  71: '小雪',
  73: '中雪',
  75: '大雪',
  80: '阵雨',
  81: '强阵雨',
  82: '暴雨',
  95: '雷暴',
  96: '雷暴伴冰雹',
  99: '强雷暴伴冰雹'
}

function describeWeather(code, tempC) {
  const label = WMO_CN[code] || '多变'
  const t = tempC != null && !Number.isNaN(tempC) ? Math.round(tempC) : null
  const tempText = t != null ? `约 ${t}℃` : '气温未知'
  return { label, tempC: t, text: `${label}，${tempText}` }
}

/**
 * @param {number|null} lat
 * @param {number|null} lng
 * @returns {Promise<{ code: number, label: string, tempC: number|null, text: string }|null>}
 */
function fetchWeather(lat, lng) {
  if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) {
    return Promise.resolve(null)
  }
  return new Promise((resolve) => {
    wx.request({
      url: 'https://api.open-meteo.com/v1/forecast',
      method: 'GET',
      data: {
        latitude: lat,
        longitude: lng,
        current_weather: true,
        timezone: 'auto'
      },
      timeout: 20000,
      success(res) {
        const cw = res.data && res.data.current_weather
        if (!cw) {
          resolve(null)
          return
        }
        const code = cw.weathercode
        const desc = describeWeather(code, cw.temperature)
        resolve({
          code,
          label: desc.label,
          tempC: desc.tempC,
          text: desc.text
        })
      },
      fail() {
        resolve(null)
      }
    })
  })
}

module.exports = { fetchWeather, describeWeather, WMO_CN }
