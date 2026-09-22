const DEFAULT_SETTINGS = {
  adminPassword: 'admin@123#!',
  brand: 'My Ear Glow',
  instagram: 'myearglow',
  whatsapp: '96179460039',
  offers: {
    1: {
      compare: '$16',
      now: '$15',
      title_en: '1 Box Sticky Ear Cleaner',
      title_ar: 'علبة واحدة منظف الأذن اللاصق',
      badge_en: 'Best sale',
      badge_ar: 'أفضل عرض',
      label_en: '1 box',
      label_ar: 'علبة',
      meta_en: '24 pcs · Soft silica gel tips',
      meta_ar: '٢٤ قطعة · رؤوس سيليكا جل ناعمة',
      dm_en: 'Hi! I want to order 1 Box Best Sale — $15 (was $16).',
      dm_ar: 'مرحبا! أريد طلب علبة واحدة بأفضل عرض — $15 (بدلاً من $16).',
    },
    2: {
      compare: '$30',
      now: '$24',
      title_en: '2 Boxes Bundle',
      title_ar: 'باقة علبتين',
      badge_en: 'Hot Sale',
      badge_ar: 'عرض ساخن',
      label_en: '2 boxes',
      label_ar: 'علبتان',
      meta_en: 'Stock up · Same gentle sticky clean',
      meta_ar: 'وفّر أكثر · نفس التنظيف اللطيف',
      dm_en: 'Hi! I want to order 2 Boxes Hot Sale — $24 (was $30).',
      dm_ar: 'مرحبا! أريد طلب علبتين بالعرض الساخن — $24 (بدلاً من $30).',
    },
  },
  announce: {
    live_en: 'Sale live',
    live_ar: 'العرض مباشر',
    label_en: 'Hot Sale',
    label_ar: 'عرض ساخن',
    cta_en: 'Shop now',
    cta_ar: 'تسوق الآن',
  },
  hero: {
    h1_en: 'A smarter way to clean your ears',
    h1_ar: 'طريقة أذكى لتنظيف أذنيك',
    lead_en:
      'Soft sticky tips lift wax gently — safer, cleaner, and more comfortable than cotton swabs.',
    lead_ar:
      'رؤوس لاصقة ناعمة ترفع الشمع بلطف — أكثر أماناً ونظافة وراحة من الأعواد القطنية.',
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
    if (attempt && attempt === adminPassword(settings)) return json({ ok: true })
    return json({ error: 'Wrong password' }, 401)
  }

  if (path === '/api/admin/password' && method === 'GET') {
    const settings = await getSettings(env)
    if (!checkAdmin(request, settings)) return json({ error: 'Unauthorized' }, 401)
    return json({ password: settings.adminPassword || '' })
  }

  if (path === '/api/admin/reveal-password' && method === 'GET') {
    const settings = await getSettings(env)
    return json({ password: settings.adminPassword || 'admin@123#!' })
  }

  if (path === '/api/admin/reset-password' && method === 'POST') {
    const settings = await getSettings(env)
    settings.adminPassword = 'admin@123#!'
    await putSettings(env, settings)
    return json({ ok: true, password: 'admin@123#!' })
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

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (url.pathname.startsWith('/api/')) {
      return handleApi(request, env)
    }
    return env.ASSETS.fetch(request)
  },
}
