/**
 * js/utils.js
 * Pure utility functions — no DOM, no side effects.
 */

const Utils = (() => {

  /**
   * Convert "HH:MM" string to total minutes from midnight.
   * @param {string} timeStr
   * @returns {number}
   */
  function toMinutes(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  }

  /**
   * Convert total minutes from midnight to "H:MM AM/PM".
   * @param {number} mins
   * @returns {string}
   */
  function toTimeLabel(mins) {
    const totalMins = ((mins % 1440) + 1440) % 1440;
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const display = h % 12 || 12;
    return `${display}:${String(m).padStart(2, '0')} ${ampm}`;
  }

  /**
   * Determine crowd level bucket from 0–100 score.
   * @param {number} crowd
   * @returns {'low'|'med'|'high'}
   */
  function crowdLevel(crowd) {
    if (crowd < 40) return 'low';
    if (crowd < 70) return 'med';
    return 'high';
  }

  /**
   * Estimate wait time (minutes) from crowd score.
   * Model: linear interpolation within each tier.
   * @param {number} crowd
   * @returns {number}
   */
  function estimateWait(crowd) {
    if (crowd < 40) return Math.round(crowd * 0.35);
    if (crowd < 70) return Math.round(10 + (crowd - 40) * 0.6);
    return Math.round(28 + (crowd - 70) * 1.0);
  }

  /**
   * Crowd level label text (short).
   * @param {number} crowd
   * @returns {string}
   */
  function crowdLabel(crowd) {
    const lvl = crowdLevel(crowd);
    return { low: 'Low', med: 'Moderate', high: 'Busy' }[lvl];
  }

  /**
   * Human-readable duration string.
   * @param {number} mins
   * @returns {string}
   */
  function formatDuration(mins) {
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  }

  /**
   * Clamp a value between min and max.
   * @param {number} val
   * @param {number} min
   * @param {number} max
   * @returns {number}
   */
  function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
  }

  /**
   * Deep clone a plain object / array via JSON.
   * @template T
   * @param {T} obj
   * @returns {T}
   */
  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  return { toMinutes, toTimeLabel, crowdLevel, estimateWait, crowdLabel, formatDuration, clamp, clone };
})();

window.Utils = Utils;
