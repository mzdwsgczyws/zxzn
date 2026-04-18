/**
 * 箴言配图用隶书：通过 wx.loadFontFace 加载包内字体。
 * 仅列出仓库中实际存在的字体文件，避免不存在的路径触发网络 500 后超时卡死。
 * 加载失败时绘图回退系统默认字体，不阻塞渲染。
 */

const FONT_FAMILY = 'DaoLotLiShu'

/** 仅保留仓库中实际存在的字体文件 */
const FONT_URLS = [
  '/fonts/AlimamaDaoLiTi-Regular.otf'
]

/** 单次 loadFontFace 超时上限（ms），防止基础库不触发 fail 回调 */
const LOAD_TIMEOUT = 4000

let _resolved = false
let _ok = false
let _promise = null

function ensureLotArtFont() {
  if (_resolved) return Promise.resolve(_ok)
  if (_promise) return _promise
  _promise = new Promise((resolve) => {
    let index = 0
    let settled = false
    const settle = (ok) => {
      if (settled) return
      settled = true
      _ok = ok
      _resolved = true
      resolve(ok)
    }
    const tryNext = () => {
      if (index >= FONT_URLS.length) {
        console.warn('[lot-font] loadFontFace: no file matched', FONT_URLS.join(', '))
        settle(false)
        return
      }
      const path = FONT_URLS[index++]
      // 超时保护：若 loadFontFace 既不 success 也不 fail，强制 resolve
      const timer = setTimeout(() => {
        console.warn('[lot-font] loadFontFace timeout', path)
        tryNext()
      }, LOAD_TIMEOUT)
      wx.loadFontFace({
        family: FONT_FAMILY,
        source: 'url("' + path + '")',
        desc: { style: 'normal', weight: 'normal' },
        scopes: ['native', 'webview'],
        global: true,
        success: () => {
          clearTimeout(timer)
          settle(true)
        },
        fail: (err) => {
          clearTimeout(timer)
          console.warn('[lot-font] loadFontFace skip', path, err)
          tryNext()
        }
      })
    }
    tryNext()
  })
  return _promise
}

module.exports = {
  FONT_FAMILY,
  ensureLotArtFont
}
