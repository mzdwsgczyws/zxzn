const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  const { content, letterToken } = event

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return { success: false, error: '内容不能为空' }
  }
  if (content.length > 500) {
    return { success: false, error: '内容不能超过 500 字' }
  }
  if (!letterToken || typeof letterToken !== 'string' || letterToken.length < 16) {
    return { success: false, error: '无效的信件凭证' }
  }

  try {
    await db.collection('tree_hole_letters').add({
      data: {
        letterToken,
        content: content.trim(),
        createdAt: db.serverDate(),
        status: 'pending',
        reply: null,
        repliedAt: null
      }
    })
    return { success: true }
  } catch (err) {
    return { success: false, error: '投递失败，请稍后重试' }
  }
}
