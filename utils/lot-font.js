/**
 * 箴言配图用隶书：通过 wx.loadFontFace 加载包内字体，供旧版 Canvas ctx.font 使用。
 * 按顺序尝试 /fonts/ 下常见文件名（见 fonts/README.md）；均未放置时绘图回退系统默认字体。
 */

const FONT_FAMILY = 'DaoLotLiShu'

/** 任命中其一即可，优先使用列表靠前的文件 */
const FONT_URLS = [
  '/fonts/LiShu.otf',
  '/fonts/LiShu.ttf',
  '/fonts/AlimamaDaoLiTi-Regular.otf',
  '/fonts/FandolLi-Regular.otf'
]

let _resolved = false
let _ok = false
let _promise = null

function ensureLotArtFont() {
  if (_resolved) return Promise.resolve(_ok)
  if (_promise) return _promise
  _promise = new Promise((resolve) => {
    let index = 0
    const tryNext = () => {
      if (index >= FONT_URLS.length) {
        console.warn('[lot-font] loadFontFace: no file matched', FONT_URLS.join(', '))
        _ok = false
        _resolved = true
        resolve(false)
        return
      }
      const path = FONT_URLS[index++]
      wx.loadFontFace({
        family: FONT_FAMILY,
        source: `url("${path}")`,
        desc: {
          style: 'normal',
          weight: 'normal'
        },
        scopes: ['native', 'webview'],
        global: true,
        success: () => {
          _ok = true
          _resolved = true
          resolve(true)
        },
        fail: (err) => {
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
