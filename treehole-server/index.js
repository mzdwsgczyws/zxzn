const express = require('express')
const mysql = require('mysql2/promise')

const app = express()
app.use(express.json())

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-WX-SERVICE')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

const ADMIN_KEY = process.env.ADMIN_KEY || 'CHANGE_ME'

// --- MySQL 连接池 ---
const pool = mysql.createPool({
  host: process.env.MYSQL_ADDRESS ? process.env.MYSQL_ADDRESS.split(':')[0] : process.env.MYSQL_HOST,
  port: process.env.MYSQL_ADDRESS ? Number(process.env.MYSQL_ADDRESS.split(':')[1] || 3306) : Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USERNAME || process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'treehole',
  waitForConnections: true,
  connectionLimit: 5,
  charset: 'utf8mb4'
})

async function initDb() {
  const conn = await pool.getConnection()
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS letters (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        letterToken VARCHAR(64) NOT NULL UNIQUE,
        content TEXT NOT NULL,
        status VARCHAR(16) NOT NULL DEFAULT 'pending',
        reply TEXT,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        repliedAt DATETIME NULL,
        INDEX idx_status_created (status, createdAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)
    console.log('[treehole] table letters ready')
  } finally {
    conn.release()
  }
}

initDb().catch(err => {
  console.error('[treehole] initDb error:', err.message)
})

// --- 健康检查 ---
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'treehole' })
})

// --- 用户投信 ---
app.post('/api/submit', async (req, res) => {
  const { content, letterToken } = req.body

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return res.json({ success: false, error: '内容不能为空' })
  }
  if (content.length > 500) {
    return res.json({ success: false, error: '内容不能超过 500 字' })
  }
  if (!letterToken || typeof letterToken !== 'string' || letterToken.length < 16) {
    return res.json({ success: false, error: '无效的信件凭证' })
  }

  try {
    await pool.execute(
      'INSERT INTO letters (letterToken, content) VALUES (?, ?)',
      [letterToken, content.trim()]
    )
    res.json({ success: true })
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.json({ success: false, error: '该信件已提交过' })
    }
    console.error('[submit] error:', err.message)
    res.json({ success: false, error: '投递失败，请稍后重试' })
  }
})

// --- 用户查询回信 ---
app.post('/api/query', async (req, res) => {
  const { letterTokens } = req.body

  if (!Array.isArray(letterTokens) || letterTokens.length === 0) {
    return res.json({ success: true, letters: [] })
  }

  const safeTokens = letterTokens
    .filter(t => typeof t === 'string' && t.length >= 16)
    .slice(0, 50)

  if (safeTokens.length === 0) {
    return res.json({ success: true, letters: [] })
  }

  try {
    const placeholders = safeTokens.map(() => '?').join(',')
    const [rows] = await pool.query(
      `SELECT letterToken, content, status, reply, repliedAt, createdAt
       FROM letters WHERE letterToken IN (${placeholders})
       ORDER BY createdAt DESC`,
      safeTokens
    )
    res.json({ success: true, letters: rows })
  } catch (err) {
    console.error('[query] error:', err.message)
    res.json({ success: false, error: '查询失败' })
  }
})

// --- 管理员操作 ---
app.post('/api/admin', async (req, res) => {
  const { action, adminKey } = req.body

  if (adminKey !== ADMIN_KEY) {
    return res.json({ success: false, error: '密钥错误' })
  }

  if (action === 'list') {
    const statusFilter = req.body.status || 'pending'
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM letters WHERE status = ? ORDER BY createdAt ASC LIMIT 100',
        [statusFilter]
      )
      return res.json({ success: true, letters: rows })
    } catch (err) {
      console.error('[admin list] error:', err.message)
      return res.json({ success: false, error: '查询失败' })
    }
  }

  if (action === 'reply') {
    const { letterToken, reply } = req.body
    if (!letterToken || !reply || reply.trim().length === 0) {
      return res.json({ success: false, error: '回信内容不能为空' })
    }
    try {
      const [result] = await pool.execute(
        "UPDATE letters SET status = 'replied', reply = ?, repliedAt = NOW() WHERE letterToken = ?",
        [reply.trim(), letterToken]
      )
      if (result.affectedRows === 0) {
        return res.json({ success: false, error: '未找到该信件' })
      }
      return res.json({ success: true })
    } catch (err) {
      console.error('[admin reply] error:', err.message)
      return res.json({ success: false, error: '回复失败' })
    }
  }

  res.json({ success: false, error: '未知操作' })
})

const PORT = process.env.PORT || 80
app.listen(PORT, '0.0.0.0', () => {
  console.log(`treehole-server running on port ${PORT}`)
})
