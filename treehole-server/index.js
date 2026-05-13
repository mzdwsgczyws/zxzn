const express = require('express')
const Database = require('better-sqlite3')
const path = require('path')
const crypto = require('crypto')

const app = express()
app.use(express.json())

// --- 数据库 ---
const DB_PATH = path.join('/data', 'treehole.db')
const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.exec(`
  CREATE TABLE IF NOT EXISTS letters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    letterToken TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    reply TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    repliedAt TEXT
  )
`)

const ADMIN_KEY = process.env.ADMIN_KEY || 'CHANGE_ME'

// --- 健康检查（云托管需要） ---
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'treehole' })
})

// --- 用户投信 ---
app.post('/api/submit', (req, res) => {
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
    db.prepare('INSERT INTO letters (letterToken, content) VALUES (?, ?)').run(letterToken, content.trim())
    res.json({ success: true })
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.json({ success: false, error: '该信件已提交过' })
    }
    res.json({ success: false, error: '投递失败，请稍后重试' })
  }
})

// --- 用户查询回信 ---
app.post('/api/query', (req, res) => {
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

  const placeholders = safeTokens.map(() => '?').join(',')
  const rows = db.prepare(
    `SELECT letterToken, content, status, reply, repliedAt, createdAt
     FROM letters WHERE letterToken IN (${placeholders})
     ORDER BY createdAt DESC`
  ).all(...safeTokens)

  res.json({ success: true, letters: rows })
})

// --- 管理员操作 ---
app.post('/api/admin', (req, res) => {
  const { action, adminKey } = req.body

  if (adminKey !== ADMIN_KEY) {
    return res.json({ success: false, error: '密钥错误' })
  }

  if (action === 'list') {
    const statusFilter = req.body.status || 'pending'
    const rows = db.prepare(
      'SELECT * FROM letters WHERE status = ? ORDER BY createdAt ASC LIMIT 100'
    ).all(statusFilter)
    return res.json({ success: true, letters: rows })
  }

  if (action === 'reply') {
    const { letterToken, reply } = req.body
    if (!letterToken || !reply || reply.trim().length === 0) {
      return res.json({ success: false, error: '回信内容不能为空' })
    }
    const row = db.prepare('SELECT id FROM letters WHERE letterToken = ?').get(letterToken)
    if (!row) {
      return res.json({ success: false, error: '未找到该信件' })
    }
    db.prepare(
      "UPDATE letters SET status = 'replied', reply = ?, repliedAt = datetime('now') WHERE letterToken = ?"
    ).run(reply.trim(), letterToken)
    return res.json({ success: true })
  }

  res.json({ success: false, error: '未知操作' })
})

const PORT = process.env.PORT || 80
app.listen(PORT, '0.0.0.0', () => {
  console.log(`treehole-server running on port ${PORT}`)
})
