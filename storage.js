// js/storage.js — lokální perzistence přes localForage

const Storage = (() => {
  const key = (name) => `${name}_${App.user?.email || 'anon'}`;

  async function getReceipts() {
    return (await localforage.getItem(key('receipts'))) || [];
  }
  async function setReceipts(data) {
    App.receipts = data;
    return localforage.setItem(key('receipts'), data);
  }

  async function getItems() {
    return (await localforage.getItem(key('items'))) || [];
  }
  async function setItems(data) {
    App.items = data;
    return localforage.setItem(key('items'), data);
  }

  async function getUser() {
    return localforage.getItem('user');
  }
  async function setUser(user) {
    return localforage.setItem('user', user);
  }

  async function getPushEnabled() {
    return (await localforage.getItem(key('pushEnabled'))) || false;
  }
  async function setPushEnabled(val) {
    return localforage.setItem(key('pushEnabled'), val);
  }

  /**
   * Export dat — fotky jsou přiloženy jako base64.
   * Upozornění: velké fotky mohou soubor značně zvětšit.
   */
  function exportJSON() {
    const data = {
      version: 2,
      exportedAt: new Date().toISOString(),
      user: { name: App.user.name, email: App.user.email },
      receipts: App.receipts,
      items: App.items
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pamet-export-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Import dat — sloučí záznamy, přeskočí duplicity (podle id).
   */
  async function importJSON(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (!data.receipts && !data.items) throw new Error('Neplatný formát');

          const newReceipts = (data.receipts || []).filter(r => !App.receipts.find(x => x.id === r.id));
          const newItems    = (data.items    || []).filter(i => !App.items.find(x => x.id === i.id));

          await setReceipts([...newReceipts, ...App.receipts]);
          await setItems([...newItems, ...App.items]);

          resolve({ receipts: newReceipts.length, items: newItems.length });
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Chyba čtení souboru'));
      reader.readAsText(file);
    });
  }

  return { getReceipts, setReceipts, getItems, setItems, getUser, setUser, getPushEnabled, setPushEnabled, exportJSON, importJSON };
})();
