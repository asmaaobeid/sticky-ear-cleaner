import { t, translations } from './i18n.js'

const LANG_KEY = 'myearglow-lang'

let settings = null
let currentLang = localStorage.getItem(LANG_KEY) || 'en'
let currentOffer = '1'
let preferredChannel = 'wa'

function offerData(id = currentOffer) {
  return settings?.offers?.[String(id)] || settings?.offers?.['1'] || {}
}

function offerMessage(offerId = currentOffer) {
  const o = offerData(offerId)
  return currentLang === 'ar' ? o.dm_ar : o.dm_en
}

function igDm() {
  return `https://ig.me/m/${settings?.instagram || 'myearglow'}`
}

function whatsappUrl(message) {
  const text = encodeURIComponent(message)
  const phone = String(settings?.whatsapp || '').replace(/\D/g, '')
  return phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`
}

async function loadSettings() {
  try {
    const res = await fetch('/api/settings')
    if (!res.ok) throw new Error('settings failed')
    settings = await res.json()
  } catch {
    settings = {
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
    }
  }
  applySettingsToDom()
}

function applySettingsToDom() {
  if (!settings) return
  const o1 = settings.offers['1']
  const o2 = settings.offers['2']
  const ar = currentLang === 'ar'

  document.querySelectorAll('.logo, .brand-mark, .footer-logo').forEach((el) => {
    if (el && settings.brand) el.textContent = settings.brand
  })

  const setText = (selector, value) => {
    document.querySelectorAll(selector).forEach((el) => {
      if (value != null) el.textContent = value
    })
  }

  if (settings.announce) {
    setText('[data-i18n="announce_live"]', ar ? settings.announce.live_ar : settings.announce.live_en)
    setText('[data-i18n="announce_label"]', ar ? settings.announce.label_ar : settings.announce.label_en)
    setText('[data-i18n="announce_cta"]', ar ? settings.announce.cta_ar : settings.announce.cta_en)
  }

  if (settings.hero) {
    setText('[data-i18n="hero_h1"]', ar ? settings.hero.h1_ar : settings.hero.h1_en)
    setText('[data-i18n="hero_lead"]', ar ? settings.hero.lead_ar : settings.hero.lead_en)
  }

  // Announce deal prices
  document.querySelectorAll('.announce-deal[data-dm-offer="1"] strong').forEach((el) => {
    el.textContent = o1.now
  })
  document.querySelectorAll('.announce-deal[data-dm-offer="1"] s').forEach((el) => {
    el.textContent = o1.compare
  })
  document.querySelectorAll('.announce-deal[data-dm-offer="2"] strong').forEach((el) => {
    el.textContent = o2.now
  })
  document.querySelectorAll('.announce-deal[data-dm-offer="2"] s').forEach((el) => {
    el.textContent = o2.compare
  })

  setText('.announce-deal[data-dm-offer="1"] [data-i18n="announce_deal1_label"]', ar ? o1.label_ar : o1.label_en)
  setText('.announce-deal[data-dm-offer="2"] [data-i18n="announce_deal2_label"]', ar ? o2.label_ar : o2.label_en)

  // Sale cards
  setText('.sale-card.featured h3', ar ? o1.title_ar : o1.title_en)
  setText('.sale-card.featured .sale-meta', ar ? o1.meta_ar : o1.meta_en)
  setText('.sale-card.featured .sale-badge', ar ? o1.badge_ar : o1.badge_en)
  document.querySelectorAll('.sale-card.featured .price-was').forEach((el) => {
    el.textContent = o1.compare
  })
  document.querySelectorAll('.sale-card.featured .price-now').forEach((el) => {
    el.textContent = o1.now
  })

  const hotCard = document.querySelector('.sale-card:not(.featured)')
  if (hotCard) {
    const h3 = hotCard.querySelector('h3')
    const meta = hotCard.querySelector('.sale-meta')
    const badge = hotCard.querySelector('.sale-badge')
    if (h3) h3.textContent = ar ? o2.title_ar : o2.title_en
    if (meta) meta.textContent = ar ? o2.meta_ar : o2.meta_en
    if (badge) badge.textContent = ar ? o2.badge_ar : o2.badge_en
    hotCard.querySelectorAll('.price-was').forEach((el) => {
      el.textContent = o2.compare
    })
    hotCard.querySelectorAll('.price-now').forEach((el) => {
      el.textContent = o2.now
    })
  }

  // Offer picks
  const pick1 = document.querySelector('.offer-pick[data-offer="1"]')
  const pick2 = document.querySelector('.offer-pick[data-offer="2"]')
  if (pick1) {
    const label = pick1.querySelector('.offer-label')
    const price = pick1.querySelector('.offer-price')
    if (label) label.textContent = `${ar ? o1.label_ar : o1.label_en} · ${ar ? o1.badge_ar : o1.badge_en}`
    if (price) price.innerHTML = `<s>${o1.compare}</s> <strong>${o1.now}</strong>`
  }
  if (pick2) {
    const label = pick2.querySelector('.offer-label')
    const price = pick2.querySelector('.offer-price')
    if (label) label.textContent = `${ar ? o2.label_ar : o2.label_en} · ${ar ? o2.badge_ar : o2.badge_en}`
    if (price) price.innerHTML = `<s>${o2.compare}</s> <strong>${o2.now}</strong>`
  }

  // Order modal choices
  document.querySelectorAll('.order-choice[data-offer="1"]').forEach((btn) => {
    btn.querySelector('span') && (btn.querySelector('span').textContent = ar ? o1.label_ar : o1.label_en)
    btn.querySelector('strong') && (btn.querySelector('strong').textContent = o1.now)
  })
  document.querySelectorAll('.order-choice[data-offer="2"]').forEach((btn) => {
    btn.querySelector('span') && (btn.querySelector('span').textContent = ar ? o2.label_ar : o2.label_en)
    btn.querySelector('strong') && (btn.querySelector('strong').textContent = o2.now)
  })

  // Contact links — Instagram by default until a WhatsApp number is set
  const ig = settings.instagram || 'myearglow'
  const waPhone = String(settings.whatsapp || '').replace(/\D/g, '')
  const hasWhatsApp = Boolean(waPhone)
  if (!hasWhatsApp) preferredChannel = 'ig'

  document.querySelectorAll('a[href*="ig.me"], a[href*="instagram.com"]').forEach((a) => {
    if (a.classList.contains('float-wa')) return
    if (a.href.includes('ig.me') || a.getAttribute('href')?.includes('ig.me')) {
      a.href = `https://ig.me/m/${ig}`
    }
  })
  const floatWa = document.getElementById('float-wa')
  if (floatWa) {
    floatWa.hidden = !hasWhatsApp
    floatWa.href = hasWhatsApp ? `https://wa.me/${waPhone}` : '#'
  }
  if (orderSendWaBtn) orderSendWaBtn.hidden = !hasWhatsApp
  const orderHint = document.querySelector('.order-hint')
  if (orderHint) {
    orderHint.setAttribute('data-i18n', hasWhatsApp ? 'order_hint' : 'order_hint_ig')
  }
  const floatOrder = document.getElementById('float-order')
  if (floatOrder) floatOrder.href = `https://ig.me/m/${ig}`

  setOffer(currentOffer)
}

async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* fall through */
  }
  try {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.cssText = 'position:fixed;opacity:0'
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand('copy')
    area.remove()
    return ok
  } catch {
    return false
  }
}

const year = document.getElementById('year')
if (year) year.textContent = String(new Date().getFullYear())

const mainImage = document.getElementById('main-image')
document.querySelectorAll('.thumb').forEach((thumb) => {
  thumb.addEventListener('click', () => {
    const src = thumb.getAttribute('data-src')
    if (!src || !mainImage) return
    mainImage.src = src
    document.querySelectorAll('.thumb').forEach((el) => el.classList.remove('is-active'))
    thumb.classList.add('is-active')
  })
})

const comparePrice = document.getElementById('compare-price')
const productPrice = document.getElementById('product-price')
const orderNow = document.getElementById('order-now')
const offerPicks = document.querySelectorAll('.offer-pick')
const orderModal = document.getElementById('order-modal')
const orderMessage = document.getElementById('order-message')
const orderSummary = document.getElementById('order-summary')
const orderBadge = document.getElementById('order-badge')
const orderSendBtn = document.getElementById('order-send')
const orderSendWaBtn = document.getElementById('order-send-wa')
const orderError = document.getElementById('order-error')
const orderName = document.getElementById('order-name')
const orderPhone = document.getElementById('order-phone')
const orderAddress = document.getElementById('order-address')

function buildCustomerMessage(offerId = currentOffer) {
  const base = orderMessage?.value?.trim() || offerMessage(offerId)
  const name = orderName?.value?.trim() || ''
  const phone = orderPhone?.value?.trim() || ''
  const address = orderAddress?.value?.trim() || ''
  if (currentLang === 'ar') {
    return `${base}\n\nالاسم: ${name}\nالهاتف: ${phone}\nالعنوان: ${address}`
  }
  return `${base}\n\nName: ${name}\nPhone: ${phone}\nAddress: ${address}`
}

function setOffer(id) {
  const offer = offerData(id)
  if (!offer) return
  currentOffer = String(id)
  if (comparePrice) comparePrice.textContent = offer.compare
  if (productPrice) productPrice.textContent = offer.now
  offerPicks.forEach((btn) => {
    btn.classList.toggle('is-active', btn.getAttribute('data-offer') === currentOffer)
  })
  document.querySelectorAll('.order-choice').forEach((btn) => {
    btn.classList.toggle('is-active', btn.getAttribute('data-offer') === currentOffer)
  })
  if (orderNow) {
    const label =
      currentLang === 'ar'
        ? `اطلب الآن — ${offer.label_ar} — ${offer.now}`
        : `Order now — ${offer.label_en} — ${offer.now}`
    orderNow.textContent = label
  }
  fillOrderPanel(currentOffer)
}

function fillOrderPanel(offerId = currentOffer) {
  const offer = offerData(offerId)
  const ar = currentLang === 'ar'
  if (orderBadge) orderBadge.textContent = ar ? offer.badge_ar : offer.badge_en
  if (orderSummary) {
    orderSummary.innerHTML = `
      <strong>${ar ? offer.title_ar : offer.title_en}</strong>
      <span><s>${offer.compare}</s> <b>${offer.now}</b></span>
    `
  }
  if (orderMessage) orderMessage.value = offerMessage(offerId)
  if (orderSendBtn) orderSendBtn.textContent = t(currentLang, 'order_send_ig')
  if (orderSendWaBtn) orderSendWaBtn.textContent = t(currentLang, 'order_send_wa')
}

function hasWhatsAppNumber() {
  return Boolean(String(settings?.whatsapp || '').replace(/\D/g, ''))
}

function openOrderPanel(offerId = currentOffer, channel = preferredChannel) {
  const wantWa = channel === 'wa' && hasWhatsAppNumber()
  preferredChannel = wantWa ? 'wa' : 'ig'
  setOffer(offerId)
  fillOrderPanel(offerId)
  if (orderError) orderError.hidden = true
  if (!orderModal) return
  orderModal.hidden = false
  requestAnimationFrame(() => orderModal.classList.add('is-open'))
  document.body.classList.add('modal-open')
}

function closeOrderPanel() {
  if (!orderModal) return
  orderModal.classList.remove('is-open')
  document.body.classList.remove('modal-open')
  setTimeout(() => {
    orderModal.hidden = true
  }, 220)
}

async function sendOrder(channel = preferredChannel) {
  const name = orderName?.value?.trim()
  const phone = orderPhone?.value?.trim()
  const address = orderAddress?.value?.trim()

  if (!name || !phone || !address) {
    if (orderError) {
      orderError.hidden = false
      orderError.textContent = t(currentLang, 'order_required')
    }
    return
  }
  if (orderError) orderError.hidden = true

  const message = buildCustomerMessage(currentOffer)
  const useWa = channel !== 'ig' && hasWhatsAppNumber()
  const activeBtn = useWa ? orderSendWaBtn : orderSendBtn
  const prevLabel = activeBtn?.textContent
  ;[orderSendBtn, orderSendWaBtn].forEach((btn) => {
    if (btn) {
      btn.disabled = true
      if (btn === activeBtn) btn.textContent = t(currentLang, 'order_sending')
    }
  })

  try {
    await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        offerId: currentOffer,
        customerName: name,
        phone,
        address,
        message,
        lang: currentLang,
      }),
    })
  } catch {
    /* still allow chat open */
  }

  await copyText(message)
  if (useWa) {
    window.open(whatsappUrl(message), '_blank', 'noopener,noreferrer')
  } else {
    window.open(igDm(), '_blank', 'noopener,noreferrer')
  }

  closeOrderPanel()
  ;[orderSendBtn, orderSendWaBtn].forEach((btn) => {
    if (btn) btn.disabled = false
  })
  if (activeBtn) activeBtn.textContent = prevLabel

  const toast = document.getElementById('order-toast')
  if (toast) {
    const title = toast.querySelector('[data-toast-title]')
    const body = toast.querySelector('[data-toast-body]')
    const preview = toast.querySelector('[data-toast-preview]')
    if (title) title.textContent = t(currentLang, useWa ? 'toast_wa_title' : 'toast_copied_title')
    if (body) body.textContent = t(currentLang, useWa ? 'toast_wa_body' : 'toast_copied_body')
    if (preview) preview.textContent = message
    toast.hidden = false
    toast.classList.add('is-visible')
    setTimeout(() => toast.classList.remove('is-visible'), 6500)
  }

  if (orderName) orderName.value = ''
  if (orderPhone) orderPhone.value = ''
  if (orderAddress) orderAddress.value = ''
}

offerPicks.forEach((btn) => {
  btn.addEventListener('click', (event) => {
    event.preventDefault()
    openOrderPanel(btn.getAttribute('data-offer'), preferredChannel)
  })
})

document.addEventListener('click', (event) => {
  const link = event.target.closest(
    '[data-dm-offer], .js-dm-current, #order-now, .float-order, .float-wa',
  )
  if (!link) return
  event.preventDefault()
  const channel = link.getAttribute('data-channel') || preferredChannel
  openOrderPanel(link.getAttribute('data-dm-offer') || currentOffer, channel)
})

document.querySelectorAll('[data-close-order]').forEach((el) => {
  el.addEventListener('click', closeOrderPanel)
})

document.querySelectorAll('.order-choice').forEach((btn) => {
  btn.addEventListener('click', () => setOffer(btn.getAttribute('data-offer')))
})

orderSendBtn?.addEventListener('click', () => sendOrder('ig'))
orderSendWaBtn?.addEventListener('click', () => sendOrder('wa'))

document.getElementById('order-copy')?.addEventListener('click', async () => {
  const message = buildCustomerMessage(currentOffer)
  const ok = await copyText(message)
  const btn = document.getElementById('order-copy')
  if (btn && ok) {
    const prev = btn.textContent
    btn.textContent = t(currentLang, 'order_copied')
    setTimeout(() => {
      btn.textContent = prev
    }, 1600)
  }
})

function applyLanguage(lang) {
  currentLang = lang === 'ar' ? 'ar' : 'en'
  localStorage.setItem(LANG_KEY, currentLang)

  const root = document.documentElement
  root.lang = currentLang
  root.dir = translations[currentLang].dir
  document.body.classList.toggle('is-ar', currentLang === 'ar')

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n')
    if (!key) return
    el.textContent = t(currentLang, key)
  })

  document.querySelectorAll('[data-i18n-content]').forEach((el) => {
    const key = el.getAttribute('data-i18n-content')
    if (!key) return
    el.setAttribute('content', t(currentLang, key))
  })

  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder')
    if (!key) return
    el.setAttribute('placeholder', t(currentLang, key))
  })

  document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    const key = el.getAttribute('data-i18n-aria')
    if (!key) return
    el.setAttribute('aria-label', t(currentLang, key))
  })

  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.classList.toggle('is-active', btn.getAttribute('data-lang') === currentLang)
  })

  applySettingsToDom()
}

document.querySelectorAll('.lang-btn').forEach((btn) => {
  btn.addEventListener('click', () => applyLanguage(btn.getAttribute('data-lang')))
})

const header = document.querySelector('.site-header')
const toggle = document.querySelector('.nav-toggle')

toggle?.addEventListener('click', () => {
  const open = header?.classList.toggle('nav-open')
  toggle.setAttribute('aria-expanded', open ? 'true' : 'false')
  toggle.setAttribute('aria-label', t(currentLang, open ? 'menu_close' : 'menu_open'))
})

document.querySelectorAll('.nav a').forEach((link) => {
  link.addEventListener('click', () => {
    header?.classList.remove('nav-open')
    toggle?.setAttribute('aria-expanded', 'false')
  })
})

async function init() {
  await loadSettings()
  applyLanguage(currentLang)
}

init()
