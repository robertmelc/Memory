// js/profile.js — profil uživatele, statistiky, export/import

const Profile = (() => {

  function render() {
    if (!App.user) return;

    const initials  = App.user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const greens    = App.items.filter(i => i.light === 'green').length;
    const reds      = App.items.filter(i => i.light === 'red').length;
    const expiring  = App.receipts.filter(r => { const d = Warranty.daysLeft(r); return d !== null && d >= 0 && d <= 30; }).length;
    const pn        = App.pushEnabled;

    document.getElementById('profileContent').innerHTML = `
      <div style="text-align:center;margin-bottom:24px">
        <div class="profile-avatar">${initials}</div>
        <div style="font-size:20px;font-weight:700">${App.user.name}</div>
        <div style="font-size:14px;color:var(--c-muted)">${App.user.email}</div>
      </div>

      <div class="stat-row">
        <div class="stat-card"><div class="stat-num">${App.receipts.length}</div><div class="stat-label">Účtenek</div></div>
        <div class="stat-card"><div class="stat-num">${App.items.length}</div><div class="stat-label">Položek</div></div>
        <div class="stat-card"><div class="stat-num" style="color:var(--c-green)">${greens}</div><div class="stat-label">Super produktů</div></div>
        <div class="stat-card"><div class="stat-num" style="color:${expiring ? 'var(--c-amber)' : 'var(--c-accent)'}">${expiring}</div><div class="stat-label">Záruky brzy</div></div>
      </div>

      <div style="font-size:12px;color:var(--c-muted);font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px">🔔 Notifikace</div>
      <div class="card" style="margin-bottom:16px" onclick="Notifications.toggle()">
        <div style="display:flex;align-items:center;gap:12px">
          <div class="push-dot ${pn ? 'on' : 'off'}"></div>
          <div>
            <div style="font-weight:600">Push notifikace</div>
            <div style="font-size:13px;color:var(--c-muted)">${pn ? 'Aktivní — záruky do 30 dní' : 'Klikni pro aktivaci'}</div>
          </div>
          <div style="margin-left:auto;font-size:13px;font-weight:600;color:${pn ? 'var(--c-green)' : 'var(--c-muted)'}">${pn ? 'ZAP' : 'VYP'}</div>
        </div>
      </div>

      <div style="font-size:12px;color:var(--c-muted);font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px">☁️ Záloha & Export</div>

      <button class="gdrive-btn profile-card" onclick="Storage.exportJSON()">
        <div class="profile-card-icon" style="background:rgba(74,222,128,0.1)">📤</div>
        <div class="profile-card-body"><strong>Export dat (JSON)</strong><span>Stáhnout zálohu do zařízení</span></div>
      </button>

      <button class="profile-card" onclick="toggleImport()">
        <div class="profile-card-icon" style="background:rgba(167,139,250,0.1)">📥</div>
        <div class="profile-card-body"><strong>Import dat</strong><span>Obnovit nebo sloučit ze zálohy</span></div>
      </button>

      <div class="import-area" id="importArea" style="display:none">
        <input type="file" accept=".json" id="importInput" onchange="Profile.doImport()" />
        <p>Vyber soubor pamet-export-*.json</p>
      </div>

      <button class="profile-card" onclick="Profile.exportGDriveHelp()" style="margin-top:2px">
        <div class="profile-card-icon" style="background:rgba(66,133,244,0.1)">🔵</div>
        <div class="profile-card-body"><strong>Google Drive záloha</strong><span>Exportuj a nahraj ručně na Drive</span></div>
      </button>

      <div style="margin-top:20px">
        <button class="btn btn-danger" style="width:100%" onclick="Auth.logout()">Odhlásit se</button>
      </div>

      <div style="text-align:center;margin-top:20px;font-size:12px;color:var(--c-muted)">
        Paměť v${App.VERSION} · Data jsou uložena pouze v tomto prohlížeči
      </div>
    `;
  }

  function toggleImport() {
    const area = document.getElementById('importArea');
    if (area) area.style.display = area.style.display === 'none' ? 'block' : 'none';
  }

  async function doImport() {
    const file = document.getElementById('importInput')?.files[0];
    if (!file) return;
    try {
      const result = await Storage.importJSON(file);
      Receipts.render(); Receipts.buildFilters(); Receipts.checkExpiryBanner();
      Items.render(); Warranty_Tab.render(); render();
      UI.toast(`✓ Import: +${result.receipts} účtenek, +${result.items} položek`);
    } catch (e) {
      UI.toast('Chyba: ' + e.message);
    }
  }

  function exportGDriveHelp() {
    Storage.exportJSON();
    setTimeout(() => {
      UI.toast('Soubor stažen — nahraj jej na drive.google.com', 4500);
    }, 400);
  }

  return { render, toggleImport, doImport, exportGDriveHelp };
})();
