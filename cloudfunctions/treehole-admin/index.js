const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const ADMIN_KEY = process.env.ADMIN_KEY || 'CHANGE_ME_IN_CLOUD_ENV'

exports.main = async (event) => {
  const { action, adminKey } = event

  if (adminKey !== ADMIN_KEY) {
    return { success: false, error: '密钥错误' }
  }

  if (action === 'list') {
    const statusFilter = event.status || 'pending'
    try {
      const { data } = await db.collection('tree_hole_letters')
        .where({ status: statusFilter })
        .orderBy('createdAt', 'asc')
        .limit(100)
        .get()
      return { success: true, letters: data }
    } catch (err) {
      return { success: false, error: '查询失败' }
    }
  }

  if (action === 'reply') {
    const { letterToken, reply } = event
    if (!letterToken || !reply || reply.trim().length === 0) {
      return { success: false, error: '回信内容不能为空' }
    }
    try {
      const { data } = await db.collection('tree_hole_letters')
        .where({ letterToken })
        .limit(1)
        .get()

      if (data.length === 0) {
        return { success: false, error: '未找到该信件' }
      }

      await db.collection('tree_hole_letters').doc(data[0]._id).update({
        data: {
          status: 'replied',
          reply: reply.trim(),
          repliedAt: db.serverDate()
        }
      })
      return { success: true }
    } catch (err) {
      return { success: false, error: '回复失败' }
    }
  }

  return { success: false, error: '未知操作' }
}
