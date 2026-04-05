/**
 * js/admin.js
 * Operator panel logic — open/close modal and push live crowd updates.
 */

const Admin = (() => {

  const BACKDROP_ID = 'adminBackdrop';
  const ADMIN_BTN   = 'adminBtn';
  const CLOSE_BTN   = 'closeAdminBtn';
  const SAVE_BTN    = 'saveAdminBtn';

  function init(rides, onSave) {
    document.getElementById(ADMIN_BTN).addEventListener('click', () => open(rides));
    document.getElementById(CLOSE_BTN).addEventListener('click', close);
    document.getElementById(SAVE_BTN).addEventListener('click', () => save(rides, onSave));

    // Close on backdrop click
    document.getElementById(BACKDROP_ID).addEventListener('click', e => {
      if (e.target === e.currentTarget) close();
    });

    // Close on Escape key
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') close();
    });
  }

  function open(rides) {
    UI.renderAdminModal(rides);
    const backdrop = document.getElementById(BACKDROP_ID);
    backdrop.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    // Focus trap: focus first slider
    setTimeout(() => {
      const firstSlider = backdrop.querySelector('.crowd-slider');
      if (firstSlider) firstSlider.focus();
    }, 100);
  }

  function close() {
    document.getElementById(BACKDROP_ID).setAttribute('hidden', '');
    document.body.style.overflow = '';
  }

  /**
   * Read slider values and push updates back to rides array.
   * @param {Object[]} rides  - Live rides array (mutated in place)
   * @param {Function} onSave - Callback after save (triggers recalc banner if needed)
   */
  function save(rides, onSave) {
    rides.forEach(r => {
      const slider = document.getElementById(`sl-${r.id}`);
      if (slider) r.crowd = parseInt(slider.value, 10);
    });
    close();
    if (typeof onSave === 'function') onSave();
    UI.showToast('✅ Live crowd data updated!');
  }

  /**
   * Update the slider value label in real time as user drags.
   * Called inline from rendered HTML.
   * @param {number} id
   * @param {string|number} val
   */
  function updateSliderDisplay(id, val) {
    const label  = document.getElementById(`sv-${id}`);
    const slider = document.getElementById(`sl-${id}`);
    const n = parseInt(val, 10);
    if (label)  label.textContent  = `${n}%`;
    if (slider) {
      const lvl = Utils.crowdLevel(n);
      const colorMap = { low: 'var(--crowd-low)', med: 'var(--crowd-med)', high: 'var(--crowd-high)' };
      slider.style.setProperty('--thumb-color', colorMap[lvl]);
    }
  }

  return { init, open, close, save, updateSliderDisplay };
})();

window.Admin = Admin;
