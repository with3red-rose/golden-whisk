(() => {
  'use strict';
  const C = window.GW_CONFIG || {};
  const $ = (s, r = document) => r.querySelector(s);
  const waBase = `https://wa.me/${C.whatsappNumber || ''}`;
  const wa = (text) => `${waBase}?text=${encodeURIComponent(text || 'Hi The Golden Whisk, I have a question about an order.')}`;

  // Contact details from config
  document.querySelectorAll('[data-phone]').forEach(el => { el.textContent = C.phoneDisplay; el.href = `tel:+${C.whatsappNumber}`; });
  document.querySelectorAll('[data-email]').forEach(el => { el.href = `mailto:${C.email}`; if (el.classList.contains('contact-value')) el.textContent = C.email; });
  document.querySelectorAll('[data-whatsapp]').forEach(el => { el.href = wa(); });
  document.querySelectorAll('#yearNow').forEach(el => el.textContent = new Date().getFullYear());

  // Loader (never blocks the page)
  const loader = $('#siteLoader');
  if (loader) { const hide = () => loader.classList.add('hidden'); window.addEventListener('load', () => setTimeout(hide, 500)); setTimeout(hide, 2500); }

  // Mobile menu
  const toggle = $('#mobileMenuToggle'), nav = $('#siteNav');
  if (toggle && nav) {
    const setOpen = (open) => { nav.classList.toggle('open', open); toggle.setAttribute('aria-expanded', String(open)); toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation'); toggle.textContent = open ? '×' : '☰'; };
    toggle.addEventListener('click', () => setOpen(!nav.classList.contains('open')));
    nav.addEventListener('click', e => { if (e.target.closest('a,button')) setOpen(false); });
  }

  // Collection filter
  document.querySelectorAll('.filter-chip').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.toggle('active', c === btn));
    document.querySelectorAll('.cake-card').forEach(card => { card.style.display = btn.dataset.filter === 'all' || card.dataset.category === btn.dataset.filter ? '' : 'none'; });
  }));

  // Order modal
  const modal = $('#orderModal'), form = $('#orderForm'), success = $('#orderSuccess'), errorEl = $('#orderError');
  if (!modal || !form) return;
  const dateInput = $('#collectionDate');
  if (dateInput) { const d = new Date(); d.setDate(d.getDate() + 3); dateInput.min = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
  let lastFocus = null;
  const open = (cake = '') => {
    lastFocus = document.activeElement; form.hidden = false; form.reset(); success.hidden = true; errorEl.hidden = true;
    if (cake) { const sel = $('#orderCake'); if ([...sel.options].some(o => o.value === cake)) sel.value = cake; }
    modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden';
    setTimeout(() => $('input[name=customerName]', form).focus(), 50);
  };
  const close = () => { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; if (lastFocus) lastFocus.focus(); };
  document.addEventListener('click', e => {
    const c = e.target.closest('[data-order-cake]'), o = e.target.closest('[data-open-order]');
    if (c) { e.preventDefault(); open(c.dataset.orderCake); } else if (o) { e.preventDefault(); open(); }
  });
  $('#closeOrderModal').addEventListener('click', close);
  $('#closeSuccess').addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && modal.classList.contains('open')) close(); });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form).entries());
    if (d.company) return; // honeypot
    const ref = `GW-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const lines = [`Order enquiry ${ref}`, `Name: ${d.customerName}`, `Phone: ${d.phone}`, d.email && `Email: ${d.email}`, `Cake: ${d.cake}`, `Size: ${d.size}`, d.flavour && `Flavour: ${d.flavour}`, `Collection: ${d.collectionDate}, ${d.collectionTime}`, `Payment: ${d.paymentPreference}`, d.notes && `Notes: ${d.notes}`].filter(Boolean);
    const btn = $('.modal-submit', form); btn.disabled = true; errorEl.hidden = true;
    let delivered = false;
    if (C.formEndpoint) {
      try {
        const res = await fetch(C.formEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ reference: ref, ...d, company: undefined, message: lines.join('\n') }) });
        delivered = res.ok;
      } catch (_) { delivered = false; }
      if (!delivered) { errorEl.textContent = 'Sorry, we couldn\'t send that. Please try again, or message us on WhatsApp.'; errorEl.hidden = false; btn.disabled = false; return; }
    } else {
      window.open(wa(lines.join('\n')), '_blank', 'noopener'); // no form service set: hand off to WhatsApp
    }
    $('#successOrderId').textContent = ref;
    $('#whatsappFollow').href = wa([
        'Hi The Golden Whisk ',
        'I just sent an enquiry.',
        '',
        `*Reference:* ${ref}`,
        `*Cake:* ${d.cake}`,
        `*Size:* ${d.size}`,
        ...(d.flavour ? [`*Flavour:* ${d.flavour}`] : []),
        `*Collection:* ${d.collectionDate}, ${d.collectionTime}`,
        `*Payment:* ${d.paymentPreference}`,
        ...(d.notes ? [`*Details:* ${d.notes}`] : [])
      ].join('\n'));
    form.hidden = true; success.hidden = false; btn.disabled = false;
  });
})();
