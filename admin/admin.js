const PASS_KEY = 'myearglow-admin-pass'

let settings = null
let password = localStorage.getItem(PASS_KEY) || ''

const loginView = document.getElementById('login-view')
const adminView = document.getElementById('admin-view')
const loginForm = document.getElementById('login-form')
const loginError = document.getElementById('login-error')

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'x-admin-password': password,
  }
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(options.auth ? authHeaders() : {}),
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || res.statusText)
  }
  return res.json()
}

function showAdmin() {
  loginView.hidden = true
  loginView.style.display = 'none'
  adminView.hidden = false
  adminView.style.display = 'block'
}

function showLogin() {
  adminView.hidden = true
  adminView.style.display = 'none'
  loginView.hidden = false
  loginView.style.display = ''
  password = ''
  localStorage.removeItem(PASS_KEY)
}

document.getElementById('show-login-pass').addEventListener('change', (e) => {
  document.getElementById('login-password').type = e.target.checked ? 'text' : 'password'
})

function showSavedPass(value) {
  const box = document.getElementById('saved-pass-box')
  const el = document.getElementById('saved-pass-value')
  el.textContent = value
  box.hidden = false
  document.getElementById('login-password').value = value
  document.getElementById('login-password').type = 'text'
  document.getElementById('show-login-pass').checked = true
}

async function doLogin(value) {
  const pass = String(value || '').trim()
  if (!pass) throw new Error('Empty password')
  await api('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: pass }),
  })
  password = pass
  localStorage.setItem(PASS_KEY, password)
  showAdmin()
  try {
    await loadAll()
  } catch (err) {
    console.error('Admin data load failed', err)
  }
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  loginError.hidden = true
  const value = document.getElementById('login-password').value.trim()
  try {
    await doLogin(value)
  } catch {
    showLogin()
    loginError.hidden = false
    loginError.textContent = 'Wrong password'
  }
})

document.getElementById('reveal-pass-btn').addEventListener('click', async () => {
  try {
    const data = await api('/api/admin/reveal-password')
    showSavedPass(data.password)
    loginError.hidden = true
  } catch (err) {
    alert(err.message || 'Could not load password')
  }
})

document.getElementById('reset-pass-btn').addEventListener('click', async () => {
  try {
    const data = await api('/api/admin/reset-password', { method: 'POST' })
    localStorage.removeItem(PASS_KEY)
    password = ''
    showSavedPass(data.password)
    loginError.hidden = true
    // Sign in immediately with the reset password
    await doLogin(data.password)
  } catch (err) {
    alert(err.message || 'Reset failed')
  }
})

document.getElementById('logout-btn').addEventListener('click', showLogin)

document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('is-active'))
    document.querySelectorAll('.panel').forEach((p) => p.classList.remove('is-active'))
    tab.classList.add('is-active')
    document.getElementById(`panel-${tab.dataset.tab}`).classList.add('is-active')
  })
})

async function loadAll() {
  settings = await api('/api/settings')
  const passInfo = await api('/api/admin/password', { auth: true }).catch(() => null)
  if (passInfo?.password) settings.adminPassword = passInfo.password
  renderOffers()
  fillContent()
  await loadOrders()
}

function renderOffers() {
  const root = document.getElementById('offers-form')
  root.innerHTML = ''
  ;['1', '2'].forEach((id) => {
    const o = settings.offers?.[id] || {}
    const card = document.createElement('div')
    card.className = 'offer-card'
    card.innerHTML = `
      <h3>Offer ${id}</h3>
      <label>Compare price <input data-offer="${id}" data-field="compare" value="${escapeAttr(o.compare || '')}" /></label>
      <label>Sale price <input data-offer="${id}" data-field="now" value="${escapeAttr(o.now || '')}" /></label>
      <label>Title EN <input data-offer="${id}" data-field="title_en" value="${escapeAttr(o.title_en || '')}" /></label>
      <label>Title AR <input data-offer="${id}" data-field="title_ar" value="${escapeAttr(o.title_ar || '')}" /></label>
      <label>Badge EN <input data-offer="${id}" data-field="badge_en" value="${escapeAttr(o.badge_en || '')}" /></label>
      <label>Badge AR <input data-offer="${id}" data-field="badge_ar" value="${escapeAttr(o.badge_ar || '')}" /></label>
      <label>Label EN <input data-offer="${id}" data-field="label_en" value="${escapeAttr(o.label_en || '')}" /></label>
      <label>Label AR <input data-offer="${id}" data-field="label_ar" value="${escapeAttr(o.label_ar || '')}" /></label>
      <label>Meta EN <input data-offer="${id}" data-field="meta_en" value="${escapeAttr(o.meta_en || '')}" /></label>
      <label>Meta AR <input data-offer="${id}" data-field="meta_ar" value="${escapeAttr(o.meta_ar || '')}" /></label>
      <label>DM message EN <textarea data-offer="${id}" data-field="dm_en" rows="2">${escapeHtml(o.dm_en || '')}</textarea></label>
      <label>DM message AR <textarea data-offer="${id}" data-field="dm_ar" rows="2">${escapeHtml(o.dm_ar || '')}</textarea></label>
    `
    root.appendChild(card)
  })
}

function fillContent() {
  document.getElementById('f-brand').value = settings.brand || ''
  document.getElementById('f-instagram').value = settings.instagram || ''
  document.getElementById('f-whatsapp').value = settings.whatsapp || ''
  document.getElementById('f-password').value = settings.adminPassword || password || ''
  document.getElementById('f-password').placeholder = 'Current admin password'
  document.getElementById('f-live-en').value = settings.announce?.live_en || ''
  document.getElementById('f-live-ar').value = settings.announce?.live_ar || ''
  document.getElementById('f-ann-en').value = settings.announce?.label_en || ''
  document.getElementById('f-ann-ar').value = settings.announce?.label_ar || ''
  document.getElementById('f-hero-en').value = settings.hero?.h1_en || ''
  document.getElementById('f-hero-ar').value = settings.hero?.h1_ar || ''
  document.getElementById('f-lead-en').value = settings.hero?.lead_en || ''
  document.getElementById('f-lead-ar').value = settings.hero?.lead_ar || ''
}

document.getElementById('save-offers').addEventListener('click', async () => {
  const offers = structuredClone(settings.offers)
  document.querySelectorAll('#offers-form [data-offer]').forEach((el) => {
    const id = el.dataset.offer
    const field = el.dataset.field
    offers[id][field] = el.value
  })
  settings = await api('/api/settings', {
    method: 'PUT',
    auth: true,
    body: JSON.stringify({ ...settings, offers }),
  })
  flash('offers-msg')
})

document.getElementById('save-content').addEventListener('click', async () => {
  const payload = {
    brand: document.getElementById('f-brand').value,
    instagram: document.getElementById('f-instagram').value,
    whatsapp: document.getElementById('f-whatsapp').value,
    announce: {
      ...settings.announce,
      live_en: document.getElementById('f-live-en').value,
      live_ar: document.getElementById('f-live-ar').value,
      label_en: document.getElementById('f-ann-en').value,
      label_ar: document.getElementById('f-ann-ar').value,
    },
    hero: {
      h1_en: document.getElementById('f-hero-en').value,
      h1_ar: document.getElementById('f-hero-ar').value,
      lead_en: document.getElementById('f-lead-en').value,
      lead_ar: document.getElementById('f-lead-ar').value,
    },
  }
  const newPass = document.getElementById('f-password').value.trim()
  if (newPass) payload.adminPassword = newPass

  settings = await api('/api/settings', {
    method: 'PUT',
    auth: true,
    body: JSON.stringify(payload),
  })
  if (newPass) {
    password = newPass
    settings.adminPassword = newPass
    localStorage.setItem(PASS_KEY, password)
    document.getElementById('f-password').value = newPass
  }
  flash('content-msg')
})

async function loadOrders() {
  const orders = await api('/api/orders', { auth: true })
  const body = document.getElementById('orders-body')
  const stats = document.getElementById('order-stats')

  const total = orders.length
  const neu = orders.filter((o) => o.status === 'new').length
  const done = orders.filter((o) => o.status === 'done').length
  stats.innerHTML = `
    <div class="stat"><b>${total}</b><span>Total</span></div>
    <div class="stat"><b>${neu}</b><span>New</span></div>
    <div class="stat"><b>${done}</b><span>Done</span></div>
  `

  if (!orders.length) {
    body.innerHTML = `<tr><td colspan="7">No orders yet</td></tr>`
    return
  }

  body.innerHTML = orders
    .map((o) => {
      const date = new Date(o.createdAt).toLocaleString()
      return `
      <tr>
        <td>${escapeHtml(date)}</td>
        <td>
          <strong>${escapeHtml(o.customerName)}</strong>
          ${o.message ? `<div class="muted">${escapeHtml(o.message)}</div>` : ''}
        </td>
        <td><a href="tel:${escapeAttr(o.phone)}">${escapeHtml(o.phone)}</a></td>
        <td>${escapeHtml(o.address)}</td>
        <td>${escapeHtml(o.offerTitle || '')}<br /><strong>${escapeHtml(o.price || '')}</strong></td>
        <td><span class="status ${escapeAttr(o.status)}">${escapeHtml(o.status)}</span></td>
        <td>
          <div class="row-actions">
            <select data-status="${escapeAttr(o.id)}">
              <option value="new" ${o.status === 'new' ? 'selected' : ''}>new</option>
              <option value="done" ${o.status === 'done' ? 'selected' : ''}>done</option>
              <option value="cancelled" ${o.status === 'cancelled' ? 'selected' : ''}>cancelled</option>
            </select>
            <button type="button" class="btn danger" data-delete="${escapeAttr(o.id)}">Delete</button>
          </div>
        </td>
      </tr>`
    })
    .join('')

  body.querySelectorAll('[data-status]').forEach((select) => {
    select.addEventListener('change', async () => {
      await api(`/api/orders/${select.dataset.status}`, {
        method: 'PATCH',
        auth: true,
        body: JSON.stringify({ status: select.value }),
      })
      await loadOrders()
    })
  })

  body.querySelectorAll('[data-delete]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this order?')) return
      await api(`/api/orders/${btn.dataset.delete}`, { method: 'DELETE', auth: true })
      await loadOrders()
    })
  })
}

document.getElementById('refresh-orders').addEventListener('click', loadOrders)

function flash(id) {
  const el = document.getElementById(id)
  el.hidden = false
  setTimeout(() => {
    el.hidden = true
  }, 2000)
}

function escapeHtml(str = '') {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function escapeAttr(str = '') {
  return escapeHtml(str).replaceAll("'", '&#39;')
}

if (password) {
  doLogin(password).catch(() => {
    showLogin()
  })
} else {
  showLogin()
}
