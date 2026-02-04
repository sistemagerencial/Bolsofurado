import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'

const TARGET = process.env.SUPABASE_TARGET || 'https://oepcnqqlcgnjtosaxsru.supabase.co'
const app = express()

app.use(express.json())

app.use('/rest/v1', createProxyMiddleware({
  target: TARGET,
  changeOrigin: true,
  secure: true,
  onProxyReq: (proxyReq, req, res) => {
    const key = process.env.VITE_SUPABASE_ANON_KEY
    if (key) {
      proxyReq.setHeader('apikey', key)
      proxyReq.setHeader('Authorization', 'Bearer ' + key)
    }
  }
}))

const port = process.env.PORT || 8080
app.listen(port, () => console.log(`proxy listening http://localhost:${port} -> ${TARGET}`))
