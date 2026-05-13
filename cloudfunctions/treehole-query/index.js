const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event) => {
  const { letterTokens } = event

  if (!Array.isArray(letterTokens) || letterTokens.length === 0) {
    return { success: true, letters: [] }
  }

  const safeTokens = letterTokens.filter(t => typeof t === 'string' && t.length >= 16).slice(0, 50)
  if (safeTokens.length === 0) {
    return { success: true, letters: [] }
  }

  try {
    const { data } = await db.collection('tree_hole_letters')
      .where({ letterToken: _.in(safeTokens) })
      .orderBy('createdAt', 'desc')
      .limit(50)
      .field({ letterToken: true, content: true, status: true, reply: true, repliedAt: true, createdAt: true })
      .get()

    return { success: true, letters: data }
  } catch (err) {
    return { success: false, error: '查询失败' }
  }
}
