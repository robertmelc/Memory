// js/auth.js — přihlášení / odhlášení

const Auth = (() => {

  async function login() {
    const name  = document.getElementById('loginName').value.trim();
    const email = document.getElementById('loginEmail').value.trim();
    if (!name || !email) { UI.toast('Vyplň jméno a e-mail'); return; }
    if (!email.includes('@')) { UI.toast('Zadej platný e-mail'); return; }

    App.user = { name, email, created: Date.now() };
    await Storage.setUser(App.user);
    await App.boot();
  }

  async function logout() {
    if (!confirm('Opravdu se odhlásit? Data zůstanou v prohlížeči.')) return;
    App.user = null;
    App.receipts = [];
    App.items = [];
    document.getElementById('appScreen').style.display  = 'none';
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('loginName').value  = '';
    document.getElementById('loginEmail').value = '';
  }

  return { login, logout };
})();
