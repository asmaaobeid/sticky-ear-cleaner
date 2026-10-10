import { t, translations } from './i18n.js'

const LANG_KEY = 'myearglow-lang'

let settings = null
let currentLang = localStorage.getItem(LANG_KEY) || 'en'
let currentOffer = '2'
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
          meta_en: 'COD · Delivery fee may apply',
          meta_ar: 'دفع عند الاستلام · قد تُحسب رسوم توصيل',
          dm_en:
            'Hi! I want to order 1 Box Sticky Ear Cleaner — $15. Cash on delivery please. Delivery fee may apply. Based in Tripoli.',
          dm_ar:
            'مرحبا! أريد طلب علبة واحدة منظف الأذن اللاصق — $15. الدفع عند الاستلام من فضلك. قد تُحسب رسوم توصيل. من طرابلس.',
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
    }
  }
  applySettingsToDom()
}

function applySettingsToDom() {
  if (!settings) return
  const o1 = settings.offers['1']
  const o2 = settings.offers['2']
  const ar = currentLang === 'ar'

  document.querySelectorAll('.logo-text, .brand-mark, .footer-logo-text').forEach((el) => {
    if (el && settings.brand) el.textContent = settings.brand
  })

  const setText = (selector, value) => {
    document.querySelectorAll(selector).forEach((el) => {
      if (value != null) el.textContent = value
    })
  }

  if (settings.announce) {
    setText('[data-i18n="announce_urgency"]', ar ? settings.announce.live_ar : settings.announce.live_en)
    setText('[data-i18n="announce_live"]', ar ? settings.announce.live_ar : settings.announce.live_en)
    setText('[data-i18n="announce_label"]', ar ? settings.announce.label_ar : settings.announce.label_en)
    setText('[data-i18n="announce_cta"]', ar ? settings.announce.cta_ar : settings.announce.cta_en)
  }

  // Dedicated topbar copy (do not reuse announce.live — that was wiping "Free delivery")
  if (settings.topbar) {
    setText('[data-i18n="topbar_text"]', ar ? settings.topbar.text_ar : settings.topbar.text_en)
  }

  if (settings.hero) {
    setText('[data-i18n="hero_h1"]', ar ? settings.hero.h1_ar : settings.hero.h1_en)
    setText('[data-i18n="hero_lead"]', ar ? settings.hero.lead_ar : settings.hero.lead_en)
  }

  // Announce deal prices
  document.querySelectorAll('.announce-deal[data-dm-offer="2"] strong').forEach((el) => {
    el.textContent = o2.now
  })
  document.querySelectorAll('.announce-deal[data-dm-offer="2"] s').forEach((el) => {
    el.textContent = o2.compare
  })

  setText('.announce-deal[data-dm-offer="2"] [data-i18n="announce_deal2_label"]', ar ? o2.label_ar : o2.label_en)

  // Sale cards by offer id (titles + prices from settings; marketing meta stays in i18n)
  ;['1', '2'].forEach((id) => {
    const card = document.querySelector(`.sale-card[data-offer="${id}"]`)
    const offer = settings.offers?.[id]
    if (!card || !offer) return
    const h3 = card.querySelector('h3')
    if (h3) h3.textContent = ar ? offer.title_ar : offer.title_en
    card.querySelectorAll('.price-was').forEach((el) => {
      const fixed = el.getAttribute('data-fixed-compare')
      if (fixed) {
        el.hidden = false
        el.textContent = fixed
        return
      }
      const show = Boolean(offer.compare && offer.compare !== offer.now)
      el.hidden = !show
      el.textContent = offer.compare || ''
    })
    card.querySelectorAll('.price-now').forEach((el) => {
      el.textContent = offer.now
    })
  })

  // Offer picks
  const pick1 = document.querySelector('.offer-pick[data-offer="1"]')
  const pick2 = document.querySelector('.offer-pick[data-offer="2"]')
  if (pick1) {
    const label = pick1.querySelector('.offer-label')
    const price = pick1.querySelector('.offer-price')
    if (label) label.textContent = `${ar ? o1.label_ar : o1.label_en}`
    if (price) {
      price.innerHTML =
        o1.compare && o1.compare !== o1.now
          ? `<s>${o1.compare}</s> <strong>${o1.now}</strong>`
          : `<strong>${o1.now}</strong>`
    }
  }
  if (pick2) {
    const label = pick2.querySelector('.offer-label')
    const price = pick2.querySelector('.offer-price')
    const popular = ar ? 'الأكثر طلباً' : 'Most popular'
    if (label) label.textContent = `${ar ? o2.label_ar : o2.label_en} · ${popular}`
    if (price) {
      price.innerHTML =
        o2.compare && o2.compare !== o2.now
          ? `<s>${o2.compare}</s> <strong>${o2.now}</strong>`
          : `<strong>${o2.now}</strong>`
    }
  }

  const stickyPrice = document.getElementById('sticky-bar-price')
  if (stickyPrice) stickyPrice.textContent = o2.now || '$24'

  // Stock line (hide when stockLeft is 0 / missing)
  const stockEl = document.getElementById('stock-line')
  if (stockEl) {
    const left = Number(settings.stockLeft)
    if (Number.isFinite(left) && left > 0) {
      stockEl.hidden = false
      stockEl.textContent = ar
        ? `بقي ${left} عبوة فقط هذا الأسبوع`
        : `Only ${left} packs left this week`
    } else {
      stockEl.hidden = true
    }
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

  // WhatsApp is the order channel; Instagram stays as a social reference
  const ig = settings.instagram || 'myearglow'
  const waPhone = String(settings.whatsapp || '').replace(/\D/g, '')
  const hasWhatsApp = Boolean(waPhone)
  preferredChannel = hasWhatsApp ? 'wa' : 'ig'

  document.querySelectorAll('a[href*="instagram.com"]').forEach((a) => {
    if (a.classList.contains('js-dm-current') || a.hasAttribute('data-dm-offer')) return
    a.href = `https://www.instagram.com/${ig}`
  })
  document.querySelectorAll('[data-ig-handle]').forEach((el) => {
    el.textContent = `@${ig}`
  })

  const floatWa = document.getElementById('float-wa')
  if (floatWa) {
    floatWa.hidden = !hasWhatsApp
    floatWa.href = hasWhatsApp ? `https://wa.me/${waPhone}` : '#'
  }
  if (orderSendWaBtn) orderSendWaBtn.hidden = !hasWhatsApp
  if (orderSendBtn) orderSendBtn.hidden = true
  const orderHint = document.querySelector('.order-hint')
  if (orderHint) {
    orderHint.setAttribute('data-i18n', hasWhatsApp ? 'order_hint' : 'order_hint_ig')
  }

  // Keep top-bar 2-box deal linked straight to WhatsApp with message
  document.querySelectorAll('.js-direct-wa').forEach((a) => {
    const offerId = a.getAttribute('data-dm-offer') || '2'
    a.href = whatsappUrl(offerMessage(offerId))
  })

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
  const showCompare = Boolean(offer.compare && offer.compare !== offer.now)
  if (comparePrice) {
    comparePrice.hidden = !showCompare
    comparePrice.textContent = offer.compare || ''
  }
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
        ? `اطلب الآن — ادفع عند الاستلام — ${offer.label_ar} — ${offer.now}`
        : `Place order — pay on delivery — ${offer.label_en} — ${offer.now}`
    orderNow.textContent = label
  }
  fillOrderPanel(currentOffer)
}

function fillOrderPanel(offerId = currentOffer) {
  const offer = offerData(offerId)
  const ar = currentLang === 'ar'
  if (orderBadge) {
    orderBadge.textContent =
      String(offerId) === '2'
        ? ar
          ? 'الأكثر طلباً'
          : 'Most popular'
        : ar
          ? offer.badge_ar
          : offer.badge_en
  }
  if (orderSummary) {
    const gift =
      String(offerId) === '2'
        ? ar
          ? 'توصيل مجاني · دفع عند الاستلام'
          : 'Free delivery · COD'
        : ar
          ? 'دفع عند الاستلام · قد تُحسب رسوم توصيل'
          : 'COD · Delivery fee may apply'
    const priceHtml =
      offer.compare && offer.compare !== offer.now
        ? `<span><s>${offer.compare}</s> <b>${offer.now}</b></span>`
        : `<span><b>${offer.now}</b></span>`
    orderSummary.innerHTML = `
      <strong>${ar ? offer.title_ar : offer.title_en}</strong>
      ${priceHtml}
      <em class="order-summary-gift">${gift}</em>
    `
  }
  if (orderMessage) orderMessage.value = offerMessage(offerId)
  if (orderSendBtn) {
    orderSendBtn.hidden = true
    orderSendBtn.textContent = t(currentLang, 'order_send_ig')
  }
  if (orderSendWaBtn) orderSendWaBtn.textContent = t(currentLang, 'order_send_wa')
}

const META_PIXEL_ID = '1081769741266056'

function pixelPhone(raw) {
  let digits = String(raw || '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('00')) digits = digits.slice(2)
  if (digits.startsWith('0')) digits = `961${digits.slice(1)}`
  if (digits.length === 8) digits = `961${digits}`
  return digits
}

function pixelNameParts(raw) {
  const parts = String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\s]/gu, '')
    .split(/\s+/)
    .filter(Boolean)
  return {
    fn: parts[0] || '',
    ln: parts.slice(1).join(' '),
  }
}

function setPixelCustomer({ name, phone } = {}) {
  try {
    if (typeof window.fbq !== 'function') return
    const match = { country: 'lb' }
    const ph = pixelPhone(phone)
    const { fn, ln } = pixelNameParts(name)
    if (ph) match.ph = ph
    if (fn) match.fn = fn
    if (ln) match.ln = ln
    window.fbq('init', META_PIXEL_ID, match)
  } catch {
    /* ignore */
  }
}

function trackPixel(event, data, eventID) {
  try {
    if (typeof window.fbq !== 'function') return
    if (eventID) window.fbq('track', event, data || {}, { eventID })
    else window.fbq('track', event, data || {})
  } catch {
    /* ignore */
  }
}

function hasWhatsAppNumber() {
  return Boolean(String(settings?.whatsapp || '').replace(/\D/g, ''))
}

function openOrderPanel(offerId = currentOffer, channel = preferredChannel) {
  const wantWa = hasWhatsAppNumber() && channel !== 'ig'
  preferredChannel = wantWa ? 'wa' : hasWhatsAppNumber() ? 'wa' : 'ig'
  setOffer(offerId)
  fillOrderPanel(offerId)
  if (orderError) orderError.hidden = true
  if (!orderModal) return
  orderModal.hidden = false
  requestAnimationFrame(() => orderModal.classList.add('is-open'))
  document.body.classList.add('modal-open')
  const offer = offerData(offerId)
  trackPixel('InitiateCheckout', {
    content_name: offer.title_en || `Offer ${offerId}`,
    content_ids: [String(offerId)],
    value: Number(String(offer.now || '').replace(/[^0-9.]/g, '')) || undefined,
    currency: 'USD',
  })
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
  const useWa = hasWhatsAppNumber()
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

  const offer = offerData(currentOffer)
  const value = Number(String(offer.now || '').replace(/[^0-9.]/g, '')) || 0
  const eventID = `lead-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  setPixelCustomer({ name, phone })
  trackPixel(
    'Lead',
    {
      content_name: offer.title_en || `Offer ${currentOffer}`,
      content_ids: [String(currentOffer)],
      value,
      currency: 'USD',
    },
    eventID,
  )
  trackPixel(
    'Purchase',
    {
      content_name: offer.title_en || `Offer ${currentOffer}`,
      content_ids: [String(currentOffer)],
      value,
      currency: 'USD',
    },
    eventID,
  )

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
    '[data-dm-offer], .js-dm-current, #order-now, .float-wa',
  )
  if (!link) return

  // Direct WhatsApp (float button, top promo, etc.) — skip order form
  if (link.classList.contains('js-direct-wa') || link.id === 'float-wa') {
    event.preventDefault()
    const offerId = link.getAttribute('data-dm-offer') || currentOffer
    setOffer(offerId)
    const message = offerMessage(offerId)
    window.open(whatsappUrl(message), '_blank', 'noopener,noreferrer')
    trackPixel('Contact', { content_name: 'direct_wa', content_ids: [String(offerId)] })
    return
  }

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
  document.title = t(currentLang, 'title')

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
  setupRevealAnimations()
  trackPixel('ViewContent', {
    content_name: 'Sticky Ear Cleaner',
    content_ids: ['MEG-SEC-24'],
    content_type: 'product',
    value: 24,
    currency: 'USD',
  })
}

function setupRevealAnimations() {
  const targets = document.querySelectorAll(
    '.pitch, .about-strip, .reviews, .demo-slot, .hot-sale .section-intro, .sale-card, .product, .icon-strip, .how, .story, .specs, .soft-proof, .guarantee, .faq',
  )
  if (!targets.length) return

  targets.forEach((el, index) => {
    el.classList.add('reveal')
    if (el.classList.contains('sale-card')) {
      el.classList.add(index % 2 === 0 ? 'reveal-delay-1' : 'reveal-delay-2')
      if (el.classList.contains('featured')) el.classList.add('reveal-scale')
    }
    if (el.classList.contains('sale-card')) el.classList.add('reveal-delay-1')
    if (el.classList.contains('how') || el.classList.contains('story')) {
      el.classList.add(index % 2 === 0 ? 'reveal-left' : 'reveal-right')
    }
  })

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    targets.forEach((el) => el.classList.add('is-in'))
    return
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('is-in')
        observer.unobserve(entry.target)
      })
    },
    { threshold: 0.16, rootMargin: '0px 0px -8% 0px' },
  )

  targets.forEach((el) => observer.observe(el))
}

init()
