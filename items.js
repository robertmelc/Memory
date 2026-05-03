// js/items.js — správa hodnocených produktů

const Items = (() => {
  let activeFilter = '';

  function buildFilters() {
    document.getElementById('itemFilters').innerHTML =
      `<div class="fc active" onclick="Items.filter(this,'')">Vše</div>` +
      Object.entries(CATS).map(([k, v]) => `<div class="fc" onclick="Items.filter(this,'${k}')">${v}</div>`).join('');
  }

  function filter(el, val) {
    activeFilter = val;
    document.querySelectorAll('#itemFilters .fc').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    render();
  }

  function setLight(val) {
    document.getElementById('addLightVal').value = val;
    document.querySelectorAll('#addTraffic .light').forEach(l => l.classList.remove('active'));
    document.querySelector(`#addTraffic .light.${val}`).classList.add('active');
    const lbl = document.getElementById('addLightLabel');
    lbl.textContent  = LIGHTS[val].label;
    lbl.style.color  = LIGHTS[val].color;
  }

  function render() {
    const q    = document.getElementById('itemSearch').value.toLowerCase();
    const list = App.items.filter(i => {
      const textMatch = !q || [i.name, i.note, i.cat].join(' ').toLowerCase().includes(q);
      return textMatch && (!activeFilter || i.cat === activeFilter);
    });

    const el = document.getElementById('itemList');
    if (!list.length) {
      el.innerHTML = `<div class="empty">${App.items.length ? 'Žádné výsledky' : 'Zatím žádná položka.<br>Klikni + a přidej první.'}</div>`;
      return;
    }

    el.innerHTML = list.map(i => `
      <div class="card" onclick="Items.showDetail('${i.id}')">
        <div class="card-row">
          <div style="width:6px;border-radius:3px;background:${LIGHTS[i.light]?.color || 'var(--c-muted)'};align-self:stretch;flex-shrink:0"></div>
          <div class="card-body" style="margin-left:12px">
            <div class="card-title">${i.name}</div>
            <div style="display:flex;align-items:center;gap:8px;margin-top:5px">
              <span class="cat-pill cat-${i.cat}">${CATS[i.cat]}</span>
              <span style="font-size:12px;color:${LIGHTS[i.light]?.color}">${LIGHTS[i.light]?.label}</span>
            </div>
            ${i.note ? `<div style="font-size:12px;color:var(--c-muted);margin-top:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${i.note}</div>` : ''}
          </div>
        </div>
      </div>`).join('');
  }

  async function save() {
    const name = document.getElementById('iName').value.trim();
    if (!name) { UI.toast('Zadej název'); return; }

    App.items.unshift({
      id:      Date.now().toString(),
      name,
      cat:     document.getElementById('iCat').value,
      light:   document.getElementById('addLightVal').value,
      note:    document.getElementById('iNote').value,
      created: Date.now()
    });

    await Storage.setItems(App.items);
    UI.closeModal('addItem');
    UI.toast('Uloženo!');
    render();

    // Reset formuláře
    ['iName','iNote'].forEach(id => document.getElementById(id).value = '');
    setLight('red');
  }

  function showDetail(id) {
    const i = App.items.find(x => x.id === id);
    if (!i) return;

    document.getElementById('itemDetailContent').innerHTML = `
      <h2 style="font-size:20px;font-weight:700;margin-bottom:16px">${i.name}</h2>
      <div class="detail-section">
        <h3>Kategorie</h3>
        <span class="cat-pill cat-${i.cat}">${CATS[i.cat]}</span>
      </div>
      <div class="detail-section">
        <h3>Hodnocení</h3>
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:14px;height:14px;border-radius:50%;background:${LIGHTS[i.light]?.color}"></div>
          <span style="font-size:16px;font-weight:600;color:${LIGHTS[i.light]?.color}">${LIGHTS[i.light]?.label}</span>
        </div>
      </div>
      ${i.note ? `<div class="detail-section"><h3>Poznámka</h3><div class="detail-val" style="color:var(--c-muted)">${i.note}</div></div>` : ''}
    `;

    document.getElementById('itemDeleteBtn').onclick = () => deleteItem(id);
    UI.openModal('itemDetail');
  }

  async function deleteItem(id) {
    App.items = App.items.filter(i => i.id !== id);
    await Storage.setItems(App.items);
    UI.closeModal('itemDetail');
    render();
    Profile.render();
    UI.toast('Smazáno');
  }

  return { buildFilters, filter, setLight, render, save, showDetail };
})();
