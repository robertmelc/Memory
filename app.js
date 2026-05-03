// js/app.js — vstupní bod aplikace, globální stav

const App = {
  VERSION: '2.0.0',
  user: null,
  receipts: [],
  items: [],
  pushEnabled: false,

  /**
   * Spustí aplikaci po přihlášení — načte data a vykreslí UI.
   */
  async boot() {
    document.getElementById('loginScreen').style.display  = 'none';
    document.getElementById('appScreen').style.display    = 'block';

    App.receipts    = await Storage.getReceipts();
    App.items       = await Storage.getItems();
    App.pushEnabled = await Storage.getPushEnabled();

    document.getElementById('headerSub').textContent = 'Ahoj, ' + App.user.name + '!';

    Receipts.buildFilters();
    Receipts.render();
    Receipts.checkExpiryBanner();
    Items.buildFilters();
    Items.render();
    Warranty_Tab.render();

    if (App.pushEnabled) {
      Notifications.checkAndNotify();
    }
  }
};

// Inicializace — zkontroluje uložené přihlášení
(async () => {
  const savedUser = await Storage.getUser();
  if (savedUser) {
    App.user = savedUser;
    await App.boot();
  }
})();

// Nastav dnešní datum jako výchozí pro formulář
document.addEventListener('DOMContentLoaded', () => {
  const rDate = document.getElementById('rDate');
  if (rDate) rDate.value = new Date().toISOString().split('T')[0];
});
