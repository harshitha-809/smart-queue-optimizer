/**
 * js/planner.js
 * Core itinerary planning algorithm.
 *
 * Strategy: Greedy scheduling — sort selected rides by ascending crowd score
 * (lowest wait first) and slot them into the available time window.
 * Inserts rest breaks every BREAK_INTERVAL rides.
 *
 * Returns a structured itinerary array consumed by ui.js.
 */

const Planner = (() => {

  const WALK_BUFFER_MINS  = 5;   // Walking time between attractions
  const BREAK_INTERVAL    = 3;   // Insert break every N rides
  const BREAK_DURATION    = 15;  // Break length in minutes

  /**
   * Generate an optimized itinerary.
   *
   * @param {number[]} selectedIds   - Ride IDs the visitor chose
   * @param {number}   arrivalMins   - Arrival in minutes from midnight
   * @param {number}   departureMins - Departure in minutes from midnight
   * @param {Object[]} ridesData     - Full rides data array (with live crowd)
   * @returns {{ items: Object[], stats: Object }}
   */
  function buildItinerary(selectedIds, arrivalMins, departureMins, ridesData) {
    const available = departureMins - arrivalMins;
    if (available <= 0) return { items: [], stats: _emptyStats() };

    // Filter and sort: lowest crowd = least wait = do first
    const chosen = ridesData
      .filter(r => selectedIds.includes(r.id))
      .sort((a, b) => a.crowd - b.crowd);

    let cursor      = arrivalMins;
    const items     = [];
    let totalWait   = 0;
    let totalRides  = 0;
    let rideStreak  = 0;

    for (const ride of chosen) {
      if (cursor >= departureMins) break;

      const wait    = Utils.estimateWait(ride.crowd);
      const slot    = wait + ride.rideDuration + WALK_BUFFER_MINS;
      const endTime = cursor + slot;

      // Skip if this ride won't fit
      if (endTime > departureMins) continue;

      const lvl = Utils.crowdLevel(ride.crowd);
      items.push(_buildRideItem(ride, cursor, wait, lvl));

      totalWait  += wait;
      totalRides += 1;
      rideStreak += 1;
      cursor     += slot;

      // Insert break every BREAK_INTERVAL rides
      if (rideStreak >= BREAK_INTERVAL && cursor + BREAK_DURATION <= departureMins) {
        items.push(_buildBreakItem(cursor));
        cursor     += BREAK_DURATION;
        rideStreak  = 0;
      }
    }

    // Naive estimated savings vs random visit order (avg wait penalty = 25 min per ride)
    const naiveWait   = chosen.length * 25;
    const savedMins   = Math.max(0, naiveWait - totalWait);

    const stats = {
      totalRides,
      totalWaitMins : totalWait,
      savedMins,
      totalDurationMins: departureMins - arrivalMins,
    };

    return { items, stats };
  }

  /* ── Private helpers ── */

  function _buildRideItem(ride, startTime, wait, lvl) {
    const tipMap = {
      low  : { icon: '✅', text: `Short queue — ~${wait} min wait` },
      med  : { icon: '⚡', text: `Moderate queue — arrive ~5 min early` },
      high : { icon: '⚠️', text: `Busy — queue now to secure your spot` },
    };
    return {
      type      : 'ride',
      ride,
      startTime,
      endTime   : startTime + wait + ride.rideDuration,
      wait,
      lvl,
      tip       : tipMap[lvl],
      dotClass  : { low: 'dot-go', med: 'dot-med', high: 'dot-busy' }[lvl],
      borderClass: { low: 'border-go', med: 'border-med', high: 'border-busy' }[lvl],
      tipClass  : { low: 'tip-go', med: 'tip-med', high: 'tip-busy' }[lvl],
    };
  }

  function _buildBreakItem(startTime) {
    return {
      type       : 'break',
      startTime,
      endTime    : startTime + BREAK_DURATION,
      dotClass   : 'dot-break',
      borderClass: 'border-break',
      tipClass   : 'tip-break',
    };
  }

  function _emptyStats() {
    return { totalRides: 0, totalWaitMins: 0, savedMins: 0, totalDurationMins: 0 };
  }

  return { buildItinerary };
})();

window.Planner = Planner;
