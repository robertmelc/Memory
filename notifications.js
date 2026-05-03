// js/notifications.js — push notifikace pro záruční lhůty

const Notifications = (() => {

  function isSupported() {
    return 'Notification' in window;
  }

  async function request() {
    if (!isSupported()) {
      UI.toast('Prohlížeč nepodporuje push notifikace');
      return false;
    }
    const perm = await Notification.requestPermission();
    App.pushEnabled = (perm === 'granted');
    await Storage.setPushEnabled(App.pushEnabled);

    if (App.pushEnabled) {
      UI.toast('✓ Push notifikace aktivní');
      checkAndNotify();
    } else {
      UI.toast('Notifikace byly zamítnuty v prohlížeči');
    }
    return App.pushEnabled;
  }

  async function disable() {
    App.pushEnabled = false;
    await Storage.setPushEnabled(false);
    UI.toast('Notifikace vypnuty');
  }

  function send(title, body) {
    if (!App.pushEnabled || Notification.permission !== 'granted') return;
    new Notification(title, {
      body,
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🧠</text></svg>'
    });
  }

  /**
   * Projde účtenky a pošle notifikaci pro ty, jimž záruka vyprší do 30 dní.
   * Volá se při startu aplikace a při aktivaci notifikací.
   */
  function checkAndNotify() {
    if (!App.pushEnabled) return;

    const expiring = App.receipts.filter(r => {
      const d = Warranty.daysLeft(r);
      return d !== null && d >= 0 && d <= 30;
    });

    // Odesílej s malým zpožděním, aby nedošlo k zahlcení
    expiring.forEach((r, idx) => {
      const d = Warranty.daysLeft(r);
      setTimeout(() => {
        send('⏰ Záruční lhůta brzy vyprší', `${r.name} — zbývá ${d} dní`);
      }, idx * 600);
    });
  }

  async function toggle() {
    if (App.pushEnabled) {
      await disable();
    } else {
      await request();
    }
    Profile.render();
  }

  return { isSupported, request, disable, send, checkAndNotify, toggle };
})();
