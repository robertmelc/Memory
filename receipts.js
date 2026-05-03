// js/receipts.js — správa účtenek

const Receipts = (() => {
  let activeFilter = '';

  function buildFilters() {
    const locs = [...new Set(App.receipts.map(r => r.location).filter(Boolean))];
    document.getElementById('receiptFilters').innerHTML =
      `<div class="fc active" onclick="Receipts.filter(this,'')">Vše</div>` +
      locs.map(l => `<div class="fc" onclick="Receipts.filter(this,'${l}')">${l}</div>`).join('');
  }

  function filter(el, val) {
    activeFilter = val;
    document.querySelectorAll('#receiptFilters .fc').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    render();
  }

  function render() {
    const q    = document.getElementById('receiptSearch').value.toLowerCase();
    const list = App.receipts.filter(r => {
      const textMatch = !q || [r.name, r.keywords, r.location, r.note].join(' ').toLowerCase().includes(q);
      const locMatch  = !activeFilter || r.location === activeFilter;
      return textMatch && locMatch;
    });

    const el = document.getElementById('receiptList');
    if (!list.length) {
      el.innerHTML = `<div class="empty">${App.receipts.length ? 'Žádné výsledky' : 'Zatím žádná účtenka.<br>Klikni + a přidej první.'}</div>`;
      return;
    }

    el.innerHTML = list.map(r => `
      <div class="card" onclick="Receipts.showDetail('${r.id}')">
        <div class="card-row">
          <div class="card-thumb">${r.photo ? `<img src="${r.photo}" alt="foto" />` : '🧾'}</div>
          <div class="card-body">
            <div class="card-title">${r.name}</div>
            <div class="card-meta">${r.purchaseDate ? new Date(r.purchaseDate).toLocaleDateString('cs-CZ') : 'Datum neuvedeno'}</div>
            <div class="card-tags">
              ${r.keywords ? r.keywords.split(',').slice(0,2).map(k => `<span class="tag">${k.trim()}</span>`).join('') : ''}
              ${r.location ? `<span class="tag loc">📍 ${r.location}</span>` : ''}
              ${Warranty.badge(r)}
            </div>
          </div>
        </div>
      </div>`).join('');
  }

  function openAdd() {
    document.getElementById('addReceiptTitle').textContent = 'Nová účtenka';
    document.getElementById('editReceiptId').value = '';
    ['rName','rKeywords','rLocation','rNote','receiptPhotoData','rWarrantyLen'].forEach(id => {
      document.getElementById(id).value = '';
    });
    document.getElementById('rDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('rWarrantyUnit').value = 'months';
    document.getElementById('warrantyPreview').textContent = '';
    UI.clearPhotoBox('receiptPhotoBox');
    UI.openModal('addReceipt');
  }

  function updateWarrantyPreview() {
    const len  = document.getElementById('rWarrantyLen').value;
    const unit = document.getElementById('rWarrantyUnit').value;
    const date = document.getElementById('rDate').value;
    const el   = document.getElementById('warrantyPreview');
    if (!len || !date) { el.textContent = ''; return; }
    const d = new Date(date);
    if (unit === 'years') d.setFullYear(d.getFullYear() + parseInt(len));
    else d.setMonth(d.getMonth() + parseInt(len));
    el.textContent = 'Záruka vyprší: ' + d.toLocaleDateString('cs-CZ');
  }

  async function save() {
    const name = document.getElementById('rName').value.trim();
    if (!name) { UI.toast('Zadej název'); return; }

    const editId = document.getElementById('editReceiptId').value;
    const r = {
      id:           editId || Date.now().toString(),
      name,
      photo:        document.getElementById('receiptPhotoData').value,
      keywords:     document.getElementById('rKeywords').value,
      location:     document.getElementById('rLocation').value,
      purchaseDate: document.getElementById('rDate').value,
      warrantyLen:  document.getElementById('rWarrantyLen').value,
      warrantyUnit: document.getElementById('rWarrantyUnit').value,
      note:         document.getElementById('rNote').value,
      created:      Date.now()
    };

    if (editId) {
      App.receipts = App.receipts.map(x => x.id === editId ? r : x);
    } else {
      App.receipts.unshift(r);
    }

    await Storage.setReceipts(App.receipts);
    UI.closeModal('addReceipt');
    UI.toast('Uloženo!');
    render(); buildFilters(); Warranty_Tab.render(); checkExpiryBanner();
  }

  function showDetail(id) {
    const r = App.receipts.find(x => x.id === id);
    if (!r) return;

    const d   = Warranty.daysLeft(r);
    const pct = Warranty.percent(r);
    const fc  = Warranty.fillColor(d);

    document.getElementById('receiptDetailContent').innerHTML = `
      ${r.photo ? `<img src="${r.photo}" class="detail-photo" alt="foto účtenky" />` : ''}
      <h2 style="font-size:20px;font-weight:700;margin-bottom:16px">${r.name}</h2>
      ${r.purchaseDate ? `<div class="detail-section"><h3>Datum nákupu</h3><div class="detail-val">${new Date(r.purchaseDate).toLocaleDateString('cs-CZ')}</div></div>` : ''}
      ${r.warrantyLen ? `
        <div class="detail-section"><h3>Záruka</h3>
          ${Warranty.badge(r)}
          <div style="margin-top:8px;font-size:13px;color:var(--c-muted)">Vyprší: ${Warranty.expiry(r)?.toLocaleDateString('cs-CZ') ?? '—'}</div>
          <div class="warranty-bar"><div class="warranty-fill" style="width:${pct}%;background:${fc}"></div></div>
        </div>` : ''}
      ${r.keywords ? `<div class="detail-section"><h3>Klíčová slova</h3><div class="card-tags">${r.keywords.split(',').map(k => `<span class="tag">${k.trim()}</span>`).join('')}</div></div>` : ''}
      ${r.location ? `<div class="detail-section"><h3>Místo uložení</h3><div class="detail-val" style="color:var(--c-teal)">📍 ${r.location}</div></div>` : ''}
      ${r.note ? `<div class="detail-section"><h3>Poznámka</h3><div class="detail-val" style="color:var(--c-muted)">${r.note}</div></div>` : ''}
    `;

    document.getElementById('receiptDetailBtns').innerHTML = `
      <button class="btn btn-danger"    onclick="Receipts.delete('${id}')">Smazat</button>
      <button class="btn btn-secondary" onclick="Receipts.edit('${id}');UI.closeModal('receiptDetail')">Upravit</button>
      <button class="btn btn-secondary" onclick="UI.closeModal('receiptDetail')">Zavřít</button>
    `;
    UI.openModal('receiptDetail');
  }

  function edit(id) {
    const r = App.receipts.find(x => x.id === id);
    if (!r) return;
    document.getElementById('addReceiptTitle').textContent = 'Upravit účtenku';
    document.getElementById('editReceiptId').value = id;
    document.getElementById('rName').value         = r.name         || '';
    document.getElementById('rKeywords').value     = r.keywords     || '';
    document.getElementById('rLocation').value     = r.location     || '';
    document.getElementById('rDate').value         = r.purchaseDate || '';
    document.getElementById('rWarrantyLen').value  = r.warrantyLen  || '';
    document.getElementById('rWarrantyUnit').value = r.warrantyUnit || 'months';
    document.getElementById('rNote').value         = r.note         || '';
    document.getElementById('receiptPhotoData').value = r.photo    || '';
    if (r.photo) {
      const box = document.getElementById('receiptPhotoBox');
      let img = box.querySelector('img');
      if (!img) { img = document.createElement('img'); box.appendChild(img); }
      img.src = r.photo;
      const svg = box.querySelector('svg'); const span = box.querySelector('span');
      if (svg)  svg.style.display  = 'none';
      if (span) span.style.display = 'none';
    }
    updateWarrantyPreview();
    UI.openModal('addReceipt');
  }

  async function deleteReceipt(id) {
    App.receipts = App.receipts.filter(r => r.id !== id);
    await Storage.setReceipts(App.receipts);
    UI.closeModal('receiptDetail');
    render(); buildFilters(); Warranty_Tab.render(); checkExpiryBanner();
    UI.toast('Smazáno');
  }

  function checkExpiryBanner() {
    const expiring = App.receipts.filter(r => {
      const d = Warranty.daysLeft(r);
      return d !== null && d >= 0 && d <= 30;
    });
    const el = document.getElementById('expiryBanner');
    if (!expiring.length) { el.innerHTML = ''; return; }
    el.innerHTML = `
      <div class="notif-banner">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <p><strong>${expiring.length} ${expiring.length === 1 ? 'záruční lhůta vyprší' : 'záruční lhůty vyprší'} do 30 dní.</strong> Zkontroluj záložku Záruky.</p>
      </div>`;
  }

  return { buildFilters, filter, render, openAdd, updateWarrantyPreview, save, showDetail, edit, delete: deleteReceipt, checkExpiryBanner };
})();

// Alias pro modul Záruky
const Warranty_Tab = (() => {
  function render() {
    const withW = App.receipts
      .filter(r => r.warrantyLen && r.purchaseDate)
      .sort((a, b) => (Warranty.daysLeft(a) ?? 99999) - (Warranty.daysLeft(b) ?? 99999));

    const el = document.getElementById('zarukaList');
    if (!withW.length) {
      el.innerHTML = `<div class="empty">Zatím žádná záruční lhůta.<br>Přidej ji při ukládání účtenky.</div>`;
      return;
    }

    const expired  = withW.filter(r => (Warranty.daysLeft(r) ?? 1) < 0);
    const expiring = withW.filter(r => { const d = Warranty.daysLeft(r); return d !== null && d >= 0 && d <= 30; });
    const ok       = withW.filter(r => { const d = Warranty.daysLeft(r); return d !== null && d > 30; });

    let html = '';
    if (expiring.length) html += `<div class="section-head"><h2>⏰ Vyprší brzy</h2></div>` + expiring.map(card).join('');
    if (ok.length)       html += `<div class="section-head" style="margin-top:${expiring.length ? 16 : 0}px"><h2>🛡 Aktivní záruky</h2></div>` + ok.map(card).join('');
    if (expired.length)  html += `<div class="section-head" style="margin-top:${(expiring.length || ok.length) ? 16 : 0}px"><h2>❌ Vypršelé</h2></div>` + expired.map(card).join('');

    el.innerHTML = html;

    // Zvýrazni záložku pokud blíží expiry
    const tab = document.getElementById('zarukaTab');
    tab.style.color = expiring.length ? 'var(--c-amber)' : '';
  }

  function card(r) {
    const d   = Warranty.daysLeft(r);
    const pct = Warranty.percent(r);
    const fc  = Warranty.fillColor(d);
    return `
      <div class="card" onclick="Receipts.showDetail('${r.id}')">
        <div class="card-row">
          <div class="card-thumb">${r.photo ? `<img src="${r.photo}" alt="foto" />` : '🧾'}</div>
          <div class="card-body">
            <div class="card-title">${r.name}</div>
            <div style="display:flex;align-items:center;gap:8px;margin-top:4px">
              ${Warranty.badge(r)}
              <span style="font-size:12px;color:var(--c-muted)">${Warranty.expiry(r) ? 'do ' + Warranty.expiry(r).toLocaleDateString('cs-CZ') : ''}</span>
            </div>
            <div class="warranty-bar"><div class="warranty-fill" style="width:${pct}%;background:${fc}"></div></div>
          </div>
        </div>
      </div>`;
  }

  return { render };
})();
