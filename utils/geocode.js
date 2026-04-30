/**
 * 地名 → 经纬度（Open-Meteo Geocoding，无需 key）
 * 合法域名需添加：https://geocoding-api.open-meteo.com
 */

/**
 * @param {string} query
 * @param {string} [countryCode] 如 CN
 * @returns {Promise<{ lat: number, lng: number }|null>}
 */
function searchGeocode(query, countryCode) {
  const q = String(query || '').trim()
  if (!q) return Promise.resolve(null)
  return new Promise((resolve) => {
    const data = {
      name: q.slice(0, 100),
      count: 5,
      language: 'zh'
    }
    if (countryCode) data.countryCode = countryCode
    wx.request({
      url: 'https://geocoding-api.open-meteo.com/v1/search',
      method: 'GET',
      data,
      timeout: 15000,
      success(res) {
        const list = res.data && res.data.results
        if (!Array.isArray(list) || !list.length) {
          resolve(null)
          return
        }
        const r = list[0]
        if (r.latitude == null || r.longitude == null) {
          resolve(null)
          return
        }
        resolve({ lat: r.latitude, lng: r.longitude })
      },
      fail() {
        resolve(null)
      }
    })
  })
}

/**
 * @param {{ countryCode: string, province: string, city: string, detail: string }} parts
 */
function geocodeFromProfileParts(parts) {
  const cc = parts.countryCode || 'CN'
  const prov = String(parts.province || '').trim()
  const city = String(parts.city || '').trim()
  const detail = String(parts.detail || '').trim()

  if (cc === 'OTHER') {
    const q = [detail, parts.countryName || ''].filter(Boolean).join(' ').trim()
    return searchGeocode(q)
  }

  const main = [city, prov].filter(Boolean).join(' ')
  if (!main) return Promise.resolve(null)
  return searchGeocode(city || main, 'CN').then((coords) => {
    if (coords) return coords
    return searchGeocode(main, 'CN').then((c2) => {
      if (c2 || !detail) return c2
      return searchGeocode(`${detail} ${main}`, 'CN')
    })
  })
}

module.exports = { searchGeocode, geocodeFromProfileParts }
