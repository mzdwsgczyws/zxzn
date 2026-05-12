/**
 * 数据备份与恢复（本地导出/导入 JSON）
 *
 * 导出：将 storage 中的关键数据写入文件系统，然后通过 wx.shareFileMessage 分享。
 * 导入：通过 wx.chooseMessageFile 选取 JSON，解析后写回 storage。
 *
 * API 兼容性：
 * - wx.getFileSystemManager: 基础库 1.9.9+
 * - wx.shareFileMessage: 基础库 2.16.1+
 * - wx.chooseMessageFile: 基础库 2.5.0+（鸿蒙 5.0 有已知兼容问题）
 */
const KEYS = require('./storage-keys.js')

const EXPORT_KEYS = [
  KEYS.CHECKIN_STATE,
  KEYS.LOT_ROWS,
  KEYS.LOT_HALL,
  KEYS.PROFILE,
  KEYS.QUIZ_RESULT,
  KEYS.ACHIEVE_STATE,
  KEYS.USAGE_STATE
]

function canShare() {
  return typeof wx.shareFileMessage === 'function'
}

function canChooseFile() {
  return typeof wx.chooseMessageFile === 'function'
}

function exportData() {
  return new Promise((resolve, reject) => {
    const payload = { _version: 1, _exportedAt: Date.now() }
    EXPORT_KEYS.forEach(key => {
      try {
        const val = wx.getStorageSync(key)
        if (val !== '' && val !== undefined && val !== null) {
          payload[key] = val
        }
      } catch (e) {}
    })

    const jsonStr = JSON.stringify(payload, null, 2)
    const fs = wx.getFileSystemManager()
    const filePath = `${wx.env.USER_DATA_PATH}/dao-backup.json`

    fs.writeFile({
      filePath,
      data: jsonStr,
      encoding: 'utf8',
      success() {
        if (canShare()) {
          wx.shareFileMessage({
            filePath,
            fileName: 'dao-backup.json',
            success: () => resolve({ ok: true, method: 'share' }),
            fail: (err) => {
              resolve({ ok: true, method: 'file', filePath })
            }
          })
        } else {
          resolve({ ok: true, method: 'file', filePath, msg: '当前微信版本不支持文件分享，数据已保存到本地' })
        }
      },
      fail: (err) => reject(err)
    })
  })
}

function importData() {
  return new Promise((resolve, reject) => {
    if (!canChooseFile()) {
      reject(new Error('当前微信版本不支持从聊天选取文件'))
      return
    }

    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['json'],
      success(res) {
        if (!res.tempFiles || res.tempFiles.length === 0) {
          reject(new Error('未选择文件'))
          return
        }
        const tempPath = res.tempFiles[0].path
        const fs = wx.getFileSystemManager()
        fs.readFile({
          filePath: tempPath,
          encoding: 'utf8',
          success(readRes) {
            try {
              const data = JSON.parse(readRes.data)
              if (!data._version) {
                reject(new Error('文件格式不正确，不是有效的备份文件'))
                return
              }
              let restored = 0
              EXPORT_KEYS.forEach(key => {
                if (data[key] !== undefined) {
                  try {
                    wx.setStorageSync(key, data[key])
                    restored++
                  } catch (e) {}
                }
              })
              resolve({ ok: true, restored, total: EXPORT_KEYS.length })
            } catch (e) {
              reject(new Error('JSON 解析失败：' + e.message))
            }
          },
          fail: (err) => reject(err)
        })
      },
      fail: (err) => {
        if (err.errMsg && err.errMsg.indexOf('cancel') >= 0) {
          resolve({ ok: false, cancelled: true })
        } else {
          reject(err)
        }
      }
    })
  })
}

module.exports = {
  exportData,
  importData,
  canShare,
  canChooseFile
}
