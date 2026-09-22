import express from 'express'
import cors from 'cors'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { createServer as createViteServer } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const dataDir = path.join(root, 'data')
const settingsPath = path.join(dataDir, 'settings.json')
const ordersPath = path.join(dataDir, 'orders.json')
const PORT = process.env.PORT || 5174

async function readJson(file, fallback) {
  try {
    const raw = await fs.readFile(file, 'utf8')
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

async function writeJson(file, data) {
  await fs.mkdir(path.dirname(file), { recursive: true })
  await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf8')
}

function publicSettings(settings) {
  const { adminPassword, ...rest } = settings
  return rest
}

async function start() {
  const app = express()
  app.use(cors())
  app.use(express.json({ limit: '1mb' }))

  app.get('/api/settings', async (_req, res) => {
    const settings = await readJson(settingsPath, {})
    res.json(publicSettings(settings))
  })

  app.put('/api/settings', async (req, res) => {
    const current = await readJson(settingsPath, {})
    const password = req.headers['x-admin-password']
    if (!password || password !== current.adminPassword) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const next = {
      ...current,
      ...req.body,
      adminPassword: req.body.adminPassword || current.adminPassword,
    }
    await writeJson(settingsPath, next)
    res.json(publicSettings(next))
  })

  app.post('/api/admin/login', async (req, res) => {
    const settings = await readJson(settingsPath, {})
    const attempt = String(req.body?.password || '').trim()
    if (attempt && attempt === String(settings.adminPassword || '').trim()) {
      return res.json({ ok: true })
    }
    res.status(401).json({ error: 'Wrong password' })
  })

  app.get('/api/admin/password', async (req, res) => {
    const settings = await readJson(settingsPath, {})
    if (req.headers['x-admin-password'] !== settings.adminPassword) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    res.json({ password: settings.adminPassword || '' })
  })

  app.get('/api/admin/reveal-password', async (_req, res) => {
    const settings = await readJson(settingsPath, {})
    res.json({ password: settings.adminPassword || 'admin@123#!' })
  })

  app.post('/api/admin/reset-password', async (_req, res) => {
    const settings = await readJson(settingsPath, {})
    settings.adminPassword = 'admin@123#!'
    await writeJson(settingsPath, settings)
    res.json({ ok: true, password: 'admin@123#!' })
  })

  app.get('/api/orders', async (req, res) => {
    const settings = await readJson(settingsPath, {})
    if (req.headers['x-admin-password'] !== settings.adminPassword) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    const orders = await readJson(ordersPath, [])
    res.json(orders)
  })

  app.post('/api/orders', async (req, res) => {
    const {
      offerId,
      customerName,
      phone,
      address,
      message,
      lang,
    } = req.body || {}

    if (!customerName?.trim() || !phone?.trim() || !address?.trim()) {
      return res.status(400).json({ error: 'Name, phone, and address are required' })
    }

    const settings = await readJson(settingsPath, {})
    const offer = settings.offers?.[String(offerId)] || settings.offers?.['1']
    const orders = await readJson(ordersPath, [])

    const order = {
      id: `ord_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
      status: 'new',
      offerId: String(offerId || '1'),
      offerTitle: lang === 'ar' ? offer?.title_ar : offer?.title_en,
      price: offer?.now || '',
      compare: offer?.compare || '',
      customerName: String(customerName).trim(),
      phone: String(phone).trim(),
      address: String(address).trim(),
      message: String(message || '').trim(),
      lang: lang === 'ar' ? 'ar' : 'en',
    }

    orders.unshift(order)
    await writeJson(ordersPath, orders)
    res.status(201).json(order)
  })

  app.patch('/api/orders/:id', async (req, res) => {
    const settings = await readJson(settingsPath, {})
    if (req.headers['x-admin-password'] !== settings.adminPassword) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    const orders = await readJson(ordersPath, [])
    const idx = orders.findIndex((o) => o.id === req.params.id)
    if (idx < 0) return res.status(404).json({ error: 'Not found' })
    orders[idx] = { ...orders[idx], ...req.body, id: orders[idx].id }
    await writeJson(ordersPath, orders)
    res.json(orders[idx])
  })

  app.delete('/api/orders/:id', async (req, res) => {
    const settings = await readJson(settingsPath, {})
    if (req.headers['x-admin-password'] !== settings.adminPassword) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    const orders = await readJson(ordersPath, [])
    const next = orders.filter((o) => o.id !== req.params.id)
    await writeJson(ordersPath, next)
    res.json({ ok: true })
  })

  const vite = await createViteServer({
    root,
    server: { middlewareMode: true, host: true },
    appType: 'custom',
  })

  // Admin must be registered BEFORE Vite, or Vite serves the home page for /admin
  async function sendAdminHtml(req, res, next) {
    try {
      const adminPath = path.join(root, 'admin', 'index.html')
      let html = await fs.readFile(adminPath, 'utf8')
      html = await vite.transformIndexHtml('/admin/index.html', html)
      res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
    } catch (err) {
      vite.ssrFixStacktrace(err)
      next(err)
    }
  }

  app.get(['/admin', '/admin/'], sendAdminHtml)
  app.use('/admin', express.static(path.join(root, 'admin')))

  app.use(vite.middlewares)

  app.use(async (req, res, next) => {
    try {
      const url = req.originalUrl || req.url
      if (url.startsWith('/api') || url.startsWith('/admin')) return next()

      if (req.method !== 'GET' && req.method !== 'HEAD') return next()
      const accept = req.headers.accept || ''
      if (!accept.includes('text/html')) return next()

      const indexPath = path.join(root, 'index.html')
      let html = await fs.readFile(indexPath, 'utf8')
      html = await vite.transformIndexHtml(url, html)
      res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
    } catch (err) {
      vite.ssrFixStacktrace(err)
      next(err)
    }
  })

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`My Ear Glow running at http://localhost:${PORT}`)
    console.log(`Admin panel: http://localhost:${PORT}/admin`)
    console.log(`Phone (same Wi-Fi): http://192.168.1.7:${PORT}`)
  })
}

start().catch((err) => {
  console.error(err)
  process.exit(1)
})
