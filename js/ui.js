/**
 * js/ui.js
 * All DOM rendering functions.
 * Keeps rendering logic separate from app state / business logic.
 */

const UI = (() => {

  /* ── Ride Grid ── */

  function renderRidesGrid(rides, selectedIds) {
    const grid = document.getElementById('ridesGrid');
    grid.innerHTML = rides.map((r, i) => {
      const lvl  = Utils.crowdLevel(r.crowd);
      const wait = Utils.estimateWait(r.crowd);
      const sel  = selectedIds.has(r.id);
      return `
        <div
          class="ride-card crowd-${lvl} ${sel ? 'selected' : ''} animate-fade-in-up delay-${Math.min(i + 1, 6)}"
          role="listitem"
          aria-pressed="${sel}"
          aria-label="${r.name}, ${Utils.crowdLabel(r.crowd)} crowd, ~${wait} min wait"
          data-ride-id="${r.id}"
          tabindex="0"
        >
          <span class="ride-emoji" aria-hidden="true">${r.emoji}</span>
          <div class="ride-name">${r.name}</div>
          <div class="ride-meta">${r.rideDuration} min · ${r.category}</div>
          <div class="crowd-row">
            <div class="crowd-track">
              <div class="crowd-fill" style="width:${r.crowd}%"></div>
            </div>
            <span class="crowd-tag">${Utils.crowdLabel(r.crowd)}</span>
          </div>
        </div>`;
    }).join('');
  }

  function updateSelectionCount(count) {
    const el = document.getElementById('selectionCount');
    el.textContent = count === 0 ? '0 selected' : `${count} selected`;
    el.classList.toggle('has-selection', count > 0);
  }

  function updateDurationChip(arrivalTime, leaveTime) {
    const chip = document.getElementById('durationChip');
    const diff = Utils.toMinutes(leaveTime) - Utils.toMinutes(arrivalTime);
    if (diff <= 0) {
      chip.textContent = '⚠ Check your times';
      chip.style.color = 'var(--color-red)';
    } else {
      chip.textContent = `${Utils.formatDuration(diff)} available`;
      chip.style.color = '';
    }
  }

  /* ── Itinerary Page ── */

  function renderStats(stats, arrivalMins, departureMins) {
    document.getElementById('statsBar').innerHTML = `
      <div class="stat-card animate-scale-in delay-1">
        <div class="stat-val">${stats.totalRides}</div>
        <div class="stat-label">Rides</div>
      </div>
      <div class="stat-card animate-scale-in delay-2">
        <div class="stat-val">${stats.totalWaitMins}m</div>
        <div class="stat-label">Wait Time</div>
      </div>
      <div class="stat-card animate-scale-in delay-3">
        <div class="stat-val">${stats.savedMins}m</div>
        <div class="stat-label">Time Saved</div>
      </div>
    `;
    document.getElementById('timeRangeBadge').textContent =
      `${Utils.toTimeLabel(arrivalMins)} – ${Utils.toTimeLabel(departureMins)}`;
  }

  /**
   * Render the plan version badge above the timeline.
   * @param {number} version - 0 = original, 1+ = recalculated
   */
  function renderPlanVersionBadge(version) {
    const el = document.getElementById('planVersionBadge');
    if (!el) return;
    if (version === 0) {
      el.innerHTML = `<span class="plan-version-badge original">✦ Original Plan</span>`;
    } else {
      el.innerHTML = `<span class="plan-version-badge updated">✦ Updated Plan · v${version}</span>`;
    }
  }

  /**
   * Show or hide the savings headline after a recalculation.
   * @param {boolean} isRecalc
   * @param {Object}  currentStats
   * @param {Object|null} previousStats
   */
  function renderSavingsHeadline(isRecalc, currentStats, previousStats) {
    const el = document.getElementById('savingsHeadline');
    const sv = document.getElementById('savingsVal');
    if (!el || !sv) return;

    if (isRecalc && previousStats) {
      const gained = previousStats.totalWaitMins - currentStats.totalWaitMins;
      if (gained > 0) {
        sv.textContent = `+${gained}m saved`;
        sv.style.setProperty('-webkit-text-fill-color', 'var(--color-green)');
        el.style.display = 'block';
        el.style.animation = 'none';
        void el.offsetWidth;
        el.style.animation = 'fade-in-up .5s ease both';
      } else if (gained < 0) {
        sv.textContent = `${Math.abs(gained)}m more wait`;
        sv.style.setProperty('-webkit-text-fill-color', 'var(--color-yellow)');
        el.style.display = 'block';
      } else {
        el.style.display = 'none';
      }
    } else {
      el.style.display = 'none';
    }
  }

  /**
   * Render the itinerary timeline with optional wait-time deltas.
   * @param {Object[]} items
   * @param {Object[]|null} prevItems
   */
  function renderTimeline(items, prevItems) {
    const prevWaitMap = {};
    if (prevItems) {
      prevItems.forEach(it => {
        if (it.type === 'ride') prevWaitMap[it.ride.id] = it.wait;
      });
    }

    const wrap = document.getElementById('timeline');
    wrap.innerHTML = items.map((item, idx) => {
      const delay = `delay-${Math.min(idx + 1, 6)}`;
      if (item.type === 'break') return _breakRow(item, delay);
      return _rideRow(item, delay, prevWaitMap);
    }).join('');
  }

  function _rideRow(item, delay, prevWaitMap = {}) {
    let deltaHtml = '';
    const prevWait = prevWaitMap[item.ride.id];
    if (prevWait !== undefined && prevWait !== item.wait) {
      const diff = item.wait - prevWait;
      const cls  = diff < 0 ? 'better' : 'worse';
      const sign = diff < 0 ? '▼' : '▲';
      deltaHtml  = `<span class="wait-delta ${cls}">${sign}${Math.abs(diff)}m</span>`;
    }
    return `
      <div class="tl-item animate-fade-in-up ${delay}" role="listitem">
        <div class="tl-left">
          <div class="tl-time">${Utils.toTimeLabel(item.startTime)}</div>
          <div class="tl-dot ${item.dotClass}"></div>
          <div class="tl-line"></div>
        </div>
        <div class="tl-body ${item.borderClass}">
          <div class="tl-ride-name">${item.ride.emoji} ${item.ride.name}</div>
          <div class="tl-meta">~${item.wait} min wait ${deltaHtml} · ${item.ride.rideDuration} min ride</div>
          <span class="tl-tip ${item.tipClass}">${item.tip.icon} ${item.tip.text}</span>
        </div>
      </div>`;
  }

  function _breakRow(item, delay) {
    return `
      <div class="tl-item animate-fade-in-up ${delay}" role="listitem">
        <div class="tl-left">
          <div class="tl-time">${Utils.toTimeLabel(item.startTime)}</div>
          <div class="tl-dot ${item.dotClass}"></div>
          <div class="tl-line"></div>
        </div>
        <div class="tl-body ${item.borderClass}">
          <div class="tl-ride-name">☕ Rest &amp; Refresh</div>
          <div class="tl-meta">15 min · Grab a snack or rest your legs</div>
          <span class="tl-tip ${item.tipClass}">💡 Great time to check queue apps</span>
        </div>
      </div>`;
  }

  function renderHeatmap(rides) {
    const wrap    = document.getElementById('heatmap');
    const nowHour = new Date().getHours();
    const hours   = Array.from({ length: 13 }, (_, i) => i + 9);
    wrap.innerHTML = hours.map(h => {
      const avgCrowd = rides.reduce((sum, r) => {
        const isPeak = r.peakHours.includes(h);
        return sum + (isPeak ? Math.min(r.crowd + 15, 100) : Math.max(r.crowd - 10, 5));
      }, 0) / Math.max(rides.length, 1);
      const heightPct = Utils.clamp(Math.round(avgCrowd * 0.55), 8, 55);
      const lvl       = Utils.crowdLevel(avgCrowd);
      const colorMap  = { low: 'var(--color-green)', med: 'var(--color-yellow)', high: 'var(--color-red)' };
      const isCurrent = h === nowHour;
      const label     = h <= 12 ? `${h}a` : `${h - 12}p`;
      return `
        <div class="hm-col ${isCurrent ? 'current' : ''}" title="${label} — ${Utils.crowdLabel(Math.round(avgCrowd))}">
          <div class="hm-bar" style="height:${heightPct}px; background:${colorMap[lvl]}; opacity:${isCurrent ? 1 : 0.55}"></div>
          <div class="hm-label">${label}</div>
        </div>`;
    }).join('');
  }

  /* ── Admin Modal ── */

  function renderAdminModal(rides) {
    document.getElementById('adminBody').innerHTML = rides.map(r => `
      <div class="admin-row">
        <div class="admin-row-info">
          <div class="admin-row-name">${r.emoji} ${r.name}</div>
          <div class="admin-row-sub">${r.category} · ${r.rideDuration} min</div>
        </div>
        <div class="admin-row-control">
          <input class="crowd-slider" type="range" min="0" max="100" value="${r.crowd}"
            id="sl-${r.id}" aria-label="${r.name} crowd level"
            oninput="Admin.updateSliderDisplay(${r.id}, this.value)"/>
          <span class="slider-val" id="sv-${r.id}">${r.crowd}%</span>
        </div>
      </div>`).join('');
  }

  /* ── Recalculate Banner ── */

  function showRecalcBanner() {
    document.getElementById('recalcBanner')?.classList.add('visible');
  }

  function hideRecalcBanner() {
    document.getElementById('recalcBanner')?.classList.remove('visible');
  }

  /* ── Steps ── */

  function setStep(step) {
    for (let i = 1; i <= 3; i++) {
      const el = document.querySelector(`.step[data-step="${i}"]`);
      if (!el) continue;
      el.classList.toggle('active', i <= step);
      el.classList.toggle('done',   i < step);
      const conn = document.getElementById(`conn${i}`);
      if (conn) conn.classList.toggle('done', i < step);
    }
  }

  /* ── Page switching ── */

  function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(id);
    if (target) target.classList.add('active');
  }

  /* ── Toast ── */

  let _toastTimer = null;
  function showToast(msg, duration = 2400) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('visible');
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => el.classList.remove('visible'), duration);
  }

  return {
    renderRidesGrid, updateSelectionCount, updateDurationChip,
    renderStats, renderPlanVersionBadge, renderSavingsHeadline,
    renderTimeline, renderHeatmap, renderAdminModal,
    showRecalcBanner, hideRecalcBanner,
    setStep, showPage, showToast,
  };
})();

window.UI = UI;
