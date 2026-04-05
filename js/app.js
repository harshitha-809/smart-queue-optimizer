/**
 * js/app.js
 * Root application controller.
 * Owns state, wires up event listeners, and coordinates modules.
 */

const App = (() => {

  /* ── State ── */
  const state = {
    rides        : Utils.clone(window.RIDES_DATA), // Mutable live copy
    selected     : new Set(),
    currentPlan  : null,   // { items, stats, arrivalMins, departureMins }
    previousPlan : null,   // Snapshot kept for delta comparison after recalc
    planVersion  : 0,      // 0 = original plan; increments on each recalculate
    dataChangedWhileViewing: false,
  };

  /* ── Init ── */

  function init() {
    Background.init();
    _renderSetupPage();
    _bindSetupEvents();
    Admin.init(state.rides, _onAdminSave);
  }

  /* ── Setup Page ── */

  function _renderSetupPage() {
    UI.renderRidesGrid(state.rides, state.selected);
    UI.updateSelectionCount(state.selected.size);
    UI.updateDurationChip(
      document.getElementById('arrivalTime').value,
      document.getElementById('leaveTime').value
    );
  }

  function _bindSetupEvents() {
    document.getElementById('ridesGrid').addEventListener('click', e => {
      const card = e.target.closest('.ride-card');
      if (!card) return;
      _toggleRide(parseInt(card.dataset.rideId, 10));
    });

    document.getElementById('ridesGrid').addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        const card = e.target.closest('.ride-card');
        if (card) { e.preventDefault(); _toggleRide(parseInt(card.dataset.rideId, 10)); }
      }
    });

    ['arrivalTime', 'leaveTime'].forEach(id => {
      document.getElementById(id).addEventListener('change', () => {
        UI.updateDurationChip(
          document.getElementById('arrivalTime').value,
          document.getElementById('leaveTime').value
        );
      });
    });
  }

  function _toggleRide(id) {
    if (state.selected.has(id)) state.selected.delete(id);
    else state.selected.add(id);

    const card = document.querySelector(`.ride-card[data-ride-id="${id}"]`);
    if (card) {
      const sel = state.selected.has(id);
      card.classList.toggle('selected', sel);
      card.setAttribute('aria-pressed', String(sel));
    }
    UI.updateSelectionCount(state.selected.size);
    document.getElementById('planBtn').disabled = state.selected.size === 0;
  }

  /* ── Plan Generation ── */

  /**
   * Build and display an itinerary.
   * @param {boolean} isRecalc - true when triggered by "Recalculate Plan"
   */
  function generatePlan(isRecalc = false) {
    const arrivalMins   = Utils.toMinutes(document.getElementById('arrivalTime').value);
    const departureMins = Utils.toMinutes(document.getElementById('leaveTime').value);

    if (departureMins <= arrivalMins) {
      UI.showToast('⚠ Departure must be after arrival');
      return;
    }
    if (state.selected.size === 0) return;

    const loaderSteps = isRecalc
      ? ['Re-checking live crowd data…', 'Recalculating optimal order…', 'Comparing to previous plan…', 'Applying updates…']
      : ['Fetching live crowd data…', 'Analyzing queue patterns…', 'Optimizing ride order…', 'Building your schedule…'];

    document.getElementById('loaderTitle').textContent =
      isRecalc ? 'Recalculating your route…' : 'Optimizing your route…';

    UI.showPage('pageLoading');
    UI.setStep(3);

    _runLoadingSequence(loaderSteps, () => {
      const result = Planner.buildItinerary(
        [...state.selected],
        arrivalMins,
        departureMins,
        state.rides
      );

      // Snapshot current plan before overwriting (used for delta display)
      state.previousPlan = state.currentPlan;
      state.currentPlan  = { ...result, arrivalMins, departureMins };

      if (isRecalc) state.planVersion++;

      _renderItinerary(isRecalc);
      UI.showPage('pageItinerary');
      UI.hideRecalcBanner();
      state.dataChangedWhileViewing = false;
    });
  }

  function _runLoadingSequence(steps, callback) {
    const container = document.getElementById('loaderSteps');
    container.innerHTML = steps.map((s, i) => `
      <div class="loader-step" id="ls-${i}">
        <div class="loader-step-dot"></div>
        <span>${s}</span>
      </div>`).join('');

    let i = 0;
    const interval = setInterval(() => {
      if (i > 0) document.getElementById(`ls-${i - 1}`)?.classList.add('done');
      document.getElementById(`ls-${i}`)?.classList.add('visible');
      i++;
      if (i >= steps.length) {
        clearInterval(interval);
        setTimeout(callback, 400);
      }
    }, 380);
  }

  /* ── Itinerary Render ── */

  function _renderItinerary(isRecalc) {
    const { items, stats, arrivalMins, departureMins } = state.currentPlan;
    const prevPlan  = state.previousPlan;
    const selectedRides = state.rides.filter(r => state.selected.has(r.id));

    UI.renderPlanVersionBadge(state.planVersion);
    UI.renderSavingsHeadline(isRecalc, stats, prevPlan?.stats);
    UI.renderStats(stats, arrivalMins, departureMins);
    UI.renderTimeline(items, prevPlan?.items);
    UI.renderHeatmap(selectedRides, arrivalMins, departureMins);

    document.getElementById('heroSub').textContent = isRecalc
      ? `Recalculated with latest crowd data · Plan v${state.planVersion}`
      : 'Optimized to save you the most time in queues';
  }

  /* ── Recalculate ── */

  /** Called by the Recalculate banner button. */
  function recalculate() {
    generatePlan(true);
  }

  /** Called when the user dismisses the recalc banner without acting. */
  function dismissRecalc() {
    UI.hideRecalcBanner();
    UI.showToast('Banner dismissed — tap ⚙️ to update data anytime');
  }

  /* ── Admin callback ── */

  function _onAdminSave() {
    UI.renderRidesGrid(state.rides, state.selected);
    // If the visitor is already viewing an itinerary, show the recalc banner
    const onItinerary = document.getElementById('pageItinerary').classList.contains('active');
    if (onItinerary && state.currentPlan) {
      _showRecalcBanner();
    }
  }

  /**
   * Preview what recalculating would save and surface the banner.
   * Computes a quick diff without changing any state.
   */
  function _showRecalcBanner() {
    const { arrivalMins, departureMins, stats: currentStats } = state.currentPlan;
    const preview = Planner.buildItinerary([...state.selected], arrivalMins, departureMins, state.rides);
    const diff    = currentStats.totalWaitMins - preview.stats.totalWaitMins; // positive = improvement

    let chipHtml, subText;
    if (diff > 0) {
      chipHtml = `<span class="diff-chip diff-better">👉 Updated plan saves ${diff} more minutes</span>`;
      subText  = `Current wait: ${currentStats.totalWaitMins}m → New wait: ${preview.stats.totalWaitMins}m`;
    } else if (diff < 0) {
      chipHtml = `<span class="diff-chip diff-worse">⚠ New plan adds ${Math.abs(diff)} min wait</span>`;
      subText  = `Some rides got busier — may not be worth recalculating`;
    } else {
      chipHtml = `<span class="diff-chip diff-same">↔ Same total wait time</span>`;
      subText  = `Crowd shifted but total wait is unchanged`;
    }

    document.getElementById('recalcSub').textContent =
      `Operator updated live data — ${subText}`;
    document.getElementById('recalcDiff').innerHTML = chipHtml;
    UI.showRecalcBanner();
    state.dataChangedWhileViewing = true;
  }

  /* ── Public actions ── */

  function reset() {
    state.selected.clear();
    state.currentPlan  = null;
    state.previousPlan = null;
    state.planVersion  = 0;
    state.dataChangedWhileViewing = false;
    UI.hideRecalcBanner();
    document.getElementById('savingsHeadline').style.display = 'none';
    UI.setStep(1);
    UI.showPage('pageSetup');
    _renderSetupPage();
    document.getElementById('planBtn').disabled = true;
  }

  function sharePlan() {
    if (!state.currentPlan) return;
    const text = _buildShareText();
    if (navigator.share) {
      navigator.share({ title: 'My ParkPal Plan', text }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => UI.showToast('📋 Plan copied to clipboard!'));
    } else {
      UI.showToast('📋 Sharing not supported on this device');
    }
  }

  function _buildShareText() {
    const { items, stats } = state.currentPlan;
    const lines = ['🎢 My ParkPal Itinerary', ''];
    items.forEach(item => {
      if (item.type === 'break') {
        lines.push(`${Utils.toTimeLabel(item.startTime)}  ☕ Rest Break`);
      } else {
        lines.push(`${Utils.toTimeLabel(item.startTime)}  ${item.ride.emoji} ${item.ride.name} (~${item.wait}m wait)`);
      }
    });
    lines.push('', `Total wait: ${stats.totalWaitMins}m · Saved: ${stats.savedMins}m`);
    return lines.join('\n');
  }

  // Expose public API
  return { init, generatePlan, recalculate, dismissRecalc, reset, sharePlan };
})();

// Boot
document.addEventListener('DOMContentLoaded', App.init);
window.App = App;
