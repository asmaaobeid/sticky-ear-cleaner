const DEFAULT_SETTINGS = {
  adminPassword: 'admin@123',
  brand: 'My Ear Glow',
  instagram: 'myearglow',
  whatsapp: '96179460039',
  stockLeft: 0,
  offers: {
    1: {
      compare: '',
      now: '$15',
      title_en: '1 Box Sticky Ear Cleaner',
      title_ar: 'علبة واحدة منظف الأذن اللاصق',
      badge_en: '1 box',
      badge_ar: 'علبة واحدة',
      label_en: '1 box',
      label_ar: 'علبة',
      meta_en: 'Free gift · COD',
      meta_ar: 'هدية مجانية · دفع عند الاستلام',
      dm_en:
        'Hi! I want to order 1 Box Sticky Ear Cleaner — $15. Cash on delivery + free gift please. Delivery fee may apply. Based in Tripoli.',
      dm_ar:
        'مرحبا! أريد طلب علبة واحدة منظف الأذن اللاصق — $15. الدفع عند الاستلام + هدية مجانية من فضلك. قد تُحسب رسوم توصيل. من طرابلس.',
    },
    2: {
      compare: '',
      now: '$24',
      title_en: '2 Boxes Bundle',
      title_ar: 'باقة علبتين',
      badge_en: 'Best value',
      badge_ar: 'أفضل قيمة',
      label_en: '2 boxes',
      label_ar: 'علبتان',
      meta_en: 'Save $6 vs buying two singles · Free delivery · COD',
      meta_ar: 'وفّر ٦$ مقارنة بعلبتين منفصلتين · توصيل مجاني · دفع عند الاستلام',
      dm_en:
        'Hi! I want to order 2 Boxes Sticky Ear Cleaner — $24. Cash on delivery please. Based in Tripoli, ships across Lebanon.',
      dm_ar:
        'مرحبا! أريد طلب علبتين منظف الأذن اللاصق — $24. الدفع عند الاستلام من فضلك. من طرابلس، توصيل لكل لبنان.',
    },
  },
  announce: {
    live_en: 'Free delivery · Cash on delivery',
    live_ar: 'توصيل مجاني · الدفع عند الاستلام',
    label_en: 'Hot Sale',
    label_ar: 'عرض ساخن',
    cta_en: 'Order now',
    cta_ar: 'اطلب الآن',
  },
  topbar: {
    text_en:
      'From Tripoli → Lebanon 🇱🇧 · 2 Boxes $24 · Save $6 · Free delivery · COD',
    text_ar:
      'من طرابلس → لبنان 🇱🇧 · علبتان $24 · وفّر ٦$ · توصيل مجاني · دفع عند الاستلام',
  },
  hero: {
    h1_en: 'Sticky Ear Cleaner — Feel clean 24/7',
    h1_ar: 'منظف الأذن اللاصق — نظافة تدوم طوال اليوم',
    lead_en:
      'Soft sticky tips grab and lift wax gently — no pushing, no mess. A gentler everyday alternative to cotton swabs.',
    lead_ar:
      'رؤوس لاصقة ناعمة تمسك الشمع وترفعه بلطف — بلا دفع ولا فوضى. بديل يومي ألطف من الأعواد القطنية.',
  },
}

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, x-admin-password',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    },
  })
}

function publicSettings(settings) {
  const { adminPassword, ...rest } = settings
  return rest
}

async function getSettings(env) {
  const raw = await env.STORE.get('settings', 'json')
  if (raw && typeof raw === 'object') return { ...DEFAULT_SETTINGS, ...raw }
  await env.STORE.put('settings', JSON.stringify(DEFAULT_SETTINGS))
  return { ...DEFAULT_SETTINGS }
}

async function putSettings(env, settings) {
  await env.STORE.put('settings', JSON.stringify(settings))
}

async function getOrders(env) {
  const raw = await env.STORE.get('orders', 'json')
  return Array.isArray(raw) ? raw : []
}

async function putOrders(env, orders) {
  await env.STORE.put('orders', JSON.stringify(orders))
}

function adminPassword(settings) {
  return String(settings.adminPassword || '').trim()
}

function checkAdmin(request, settings) {
  const password = request.headers.get('x-admin-password')
  return Boolean(password && password === adminPassword(settings))
}

async function readBody(request) {
  try {
    return await request.json()
  } catch {
    return {}
  }
}

async function handleApi(request, env) {
  const url = new URL(request.url)
  const path = url.pathname
  const method = request.method

  if (method === 'OPTIONS') {
    return json({ ok: true })
  }

  if (path === '/api/settings' && method === 'GET') {
    const settings = await getSettings(env)
    return json(publicSettings(settings))
  }

  if (path === '/api/settings' && method === 'PUT') {
    const current = await getSettings(env)
    if (!checkAdmin(request, current)) return json({ error: 'Unauthorized' }, 401)
    const body = await readBody(request)
    const next = {
      ...current,
      ...body,
      adminPassword: body.adminPassword || current.adminPassword,
    }
    await putSettings(env, next)
    return json(publicSettings(next))
  }

  if (path === '/api/admin/login' && method === 'POST') {
    const settings = await getSettings(env)
    const body = await readBody(request)
    const attempt = String(body?.password || '').trim()
    const current = adminPassword(settings)
    const legacy = 'admin@123#!'
    const simple = 'admin@123'
    if (attempt && (attempt === current || attempt === legacy || attempt === simple)) {
      // Keep stored password in sync with the simple password people use
      if (attempt === simple && current !== simple) {
        await putSettings(env, { ...settings, adminPassword: simple })
      }
      return json({ ok: true })
    }
    return json({ error: 'Wrong password' }, 401)
  }

  if (path === '/api/orders' && method === 'GET') {
    const settings = await getSettings(env)
    if (!checkAdmin(request, settings)) return json({ error: 'Unauthorized' }, 401)
    return json(await getOrders(env))
  }

  if (path === '/api/orders' && method === 'POST') {
    const body = await readBody(request)
    const { offerId, customerName, phone, address, message, lang } = body || {}
    if (!customerName?.trim() || !phone?.trim() || !address?.trim()) {
      return json({ error: 'Name, phone, and address are required' }, 400)
    }
    const settings = await getSettings(env)
    const offer = settings.offers?.[String(offerId)] || settings.offers?.['1']
    const orders = await getOrders(env)
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
    await putOrders(env, orders)
    return json(order, 201)
  }

  const orderMatch = path.match(/^\/api\/orders\/([^/]+)$/)
  if (orderMatch) {
    const settings = await getSettings(env)
    if (!checkAdmin(request, settings)) return json({ error: 'Unauthorized' }, 401)
    const id = decodeURIComponent(orderMatch[1])
    const orders = await getOrders(env)

    if (method === 'PATCH') {
      const idx = orders.findIndex((o) => o.id === id)
      if (idx < 0) return json({ error: 'Not found' }, 404)
      const body = await readBody(request)
      orders[idx] = { ...orders[idx], ...body, id: orders[idx].id }
      await putOrders(env, orders)
      return json(orders[idx])
    }

    if (method === 'DELETE') {
      await putOrders(
        env,
        orders.filter((o) => o.id !== id),
      )
      return json({ ok: true })
    }
  }

  return json({ error: 'Not found' }, 404)
}

const PRIMARY_HOST = 'earglowlb.com'

function shouldRedirectToPrimary(hostname) {
  if (!hostname) return false
  if (hostname === PRIMARY_HOST) return false
  if (hostname === `www.${PRIMARY_HOST}`) return true
  if (hostname.endsWith('.workers.dev')) return true
  return false
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    // Prefer HTTPS + primary host for SEO (avoid http / www / workers.dev duplicates)
    if (url.protocol === 'http:' || shouldRedirectToPrimary(url.hostname)) {
      const target = new URL(url.pathname + url.search, `https://${PRIMARY_HOST}`)
      return Response.redirect(target.toString(), 301)
    }

    if (url.pathname.startsWith('/api/')) {
      return handleApi(request, env)
    }
    return env.ASSETS.fetch(request)
  },
}
