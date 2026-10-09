import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'

const app = express()
const port = process.env.PORT || 8080

app.use(helmet())
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }))
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'familybiz-api', message: 'API đang chạy', syncConfigured: false })
})

app.get('/api', (_req, res) => {
  res.json({
    name: 'FamilyBiz API',
    version: '0.1.0',
    status: 'scaffold',
    note: 'Cần cấu hình xác thực, database và phân quyền trước khi bật đồng bộ nhiều thiết bị.'
  })
})

app.listen(port, () => {
  console.log(`FamilyBiz API listening on http://localhost:${port}`)
})
