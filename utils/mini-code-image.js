/**
 * 小程序码图加载（分包 portrait-assets）
 * Canvas 2D 须先 loadSubpackage + getImageInfo，部分机型直接 load 分包路径会失败。
 */

const APP_NAME = '量化自修正念'

const MINI_CODE_SRCS = [
  '/subpackages/portrait-assets/images/personality-portraits/index.jpg',
  '/subpackages/portrait-assets/images/personality-portraits/index.png'
]

let subpackageReady = false

function ensurePortraitSubpackage() {
  if (subpackageReady) return Promise.resolve()
  return new Promise((resolve) => {
    if (typeof wx.loadSubpackage !== 'function') {
      subpackageReady = true
      resolve()
      return
    }
    wx.loadSubpackage({
      name: 'portrait-assets',
      success: () => {
        subpackageReady = true
        resolve()
      },
      fail: () => resolve()
    })
  })
}

function getImageInfoPath(src) {
  return new Promise((resolve) => {
    if (!src) {
      resolve('')
      return
    }
    wx.getImageInfo({
      src,
      success: (i) => resolve((i && i.path) || ''),
      fail: () => resolve('')
    })
  })
}

async function firstImagePath(sources) {
  await ensurePortraitSubpackage()
  const list = sources && sources.length ? sources : MINI_CODE_SRCS
  for (let i = 0; i < list.length; i++) {
    const p = await getImageInfoPath(list[i])
    if (p) return { path: p, packSrc: list[i] }
  }
  return { path: '', packSrc: list[0] || '' }
}

function createImageCompat(canvas) {
  if (canvas && typeof canvas.createImage === 'function') return canvas.createImage()
  if (typeof wx.createImage === 'function') return wx.createImage()
  return null
}

function tryImageLoadOnce(canvas, src) {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null)
      return
    }
    const img = createImageCompat(canvas)
    if (!img) {
      resolve(null)
      return
    }
    const t = setTimeout(() => resolve(null), 8000)
    img.onload = () => {
      clearTimeout(t)
      resolve(img)
    }
    img.onerror = () => {
      clearTimeout(t)
      resolve(null)
    }
    try {
      img.src = src
    } catch (e) {
      clearTimeout(t)
      resolve(null)
    }
  })
}

function readFileDataUrl(filePath) {
  return new Promise((resolve) => {
    if (!filePath) {
      resolve('')
      return
    }
    try {
      wx.getFileSystemManager().readFile({
        filePath,
        encoding: 'base64',
        success: (r) => {
          const ext = String(filePath.split('.').pop() || 'jpg').toLowerCase()
          const mime = ext === 'png' ? 'image/png' : 'image/jpeg'
          resolve(`data:${mime};base64,` + r.data)
        },
        fail: () => resolve('')
      })
    } catch (e) {
      resolve('')
    }
  })
}

/** 供 Canvas 2D 绘制：优先本地 path，再试分包路径与 base64 */
async function loadMiniCodeForCanvas(canvas) {
  const { path, packSrc } = await firstImagePath(MINI_CODE_SRCS)
  if (!path && !packSrc) return null
  let img = await tryImageLoadOnce(canvas, path)
  if (img) return img
  if (packSrc && packSrc !== path) {
    img = await tryImageLoadOnce(canvas, packSrc)
    if (img) return img
  }
  if (path) {
    const dataUrl = await readFileDataUrl(path)
    if (dataUrl) img = await tryImageLoadOnce(canvas, dataUrl)
  }
  return img || null
}

module.exports = {
  APP_NAME,
  MINI_CODE_SRCS,
  ensurePortraitSubpackage,
  firstImagePath,
  loadMiniCodeForCanvas
}
