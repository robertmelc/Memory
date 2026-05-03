// js/ui.js — sdílené UI pomůcky

const UI = (() => {

  function toast(msg, dur = 2500) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), dur);
  }

  function openModal(id)  { document.getElementById('modal-' + id).classList.add('open'); }
  function closeModal(id) { document.getElementById('modal-' + id).classList.remove('open'); }

  function switchTab(tab, btn) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('screen-' + tab).classList.add('active');
    btn.classList.add('active');
    document.getElementById('headerTitle').textContent = TAB_TITLES[tab];
    if (tab === 'profile') Profile.render();
    if (tab === 'zaruka')  Warranty_Tab.render();
  }

  function previewPhoto(inputId, boxId, dataId) {
    const file = document.getElementById(inputId).files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const box = document.getElementById(boxId);
      let img = box.querySelector('img');
      if (!img) { img = document.createElement('img'); box.appendChild(img); }
      img.src = e.target.result;
      const svg = box.querySelector('svg');
      const span = box.querySelector('span');
      if (svg)  svg.style.display  = 'none';
      if (span) span.style.display = 'none';
      document.getElementById(dataId).value = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function clearPhotoBox(boxId) {
    const box = document.getElementById(boxId);
    const img  = box.querySelector('img');
    const svg  = box.querySelector('svg');
    const span = box.querySelector('span');
    if (img)  img.remove();
    if (svg)  svg.style.display  = '';
    if (span) span.style.display = '';
  }

  return { toast, openModal, closeModal, switchTab, previewPhoto, clearPhotoBox };
})();
