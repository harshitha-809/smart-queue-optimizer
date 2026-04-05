/**
 * data/rides.js
 * Central data store for all park rides.
 * In production: replace `crowd` values with a live API feed.
 *
 * @typedef {Object} Ride
 * @property {number}  id          - Unique ride identifier
 * @property {string}  name        - Display name
 * @property {string}  emoji       - Icon emoji
 * @property {string}  category    - Ride category tag
 * @property {number}  rideDuration  - Actual ride length in minutes
 * @property {number}  crowd       - Current occupancy 0–100 (live feed)
 * @property {number[]} peakHours  - Hours (24h) when this ride is busiest
 * @property {string}  tip         - Static insider tip
 */

const RIDES_DATA = [
  {
    id: 1,
    name: "Thunder Coaster",
    emoji: "🎢",
    category: "Thrill",
    rideDuration: 3,
    crowd: 72,
    peakHours: [11, 12, 14, 15],
    tip: "Best experienced in the front car."
  },
  {
    id: 2,
    name: "Splash Canyon",
    emoji: "💦",
    category: "Water",
    rideDuration: 5,
    crowd: 45,
    peakHours: [13, 14, 15, 16],
    tip: "Bring a dry bag — you will get soaked."
  },
  {
    id: 3,
    name: "Sky Drop Tower",
    emoji: "🚀",
    category: "Thrill",
    rideDuration: 2,
    crowd: 88,
    peakHours: [10, 11, 15, 16],
    tip: "Queue moves fast — short ride time."
  },
  {
    id: 4,
    name: "Haunted Mansion",
    emoji: "👻",
    category: "Family",
    rideDuration: 8,
    crowd: 30,
    peakHours: [12, 17, 18],
    tip: "Great for all ages, rarely crowded."
  },
  {
    id: 5,
    name: "Dino Safari",
    emoji: "🦕",
    category: "Family",
    rideDuration: 12,
    crowd: 55,
    peakHours: [11, 13, 14],
    tip: "Long ride with lots of detail to spot."
  },
  {
    id: 6,
    name: "Pirate Bay",
    emoji: "🏴‍☠️",
    category: "Classic",
    rideDuration: 4,
    crowd: 65,
    peakHours: [12, 13, 16],
    tip: "Go on a hot day — there's a water splash."
  },
  {
    id: 7,
    name: "Magic Carousel",
    emoji: "🎠",
    category: "Family",
    rideDuration: 6,
    crowd: 20,
    peakHours: [10, 16, 17],
    tip: "Hidden gem — almost never has a line."
  },
  {
    id: 8,
    name: "Laser Arena",
    emoji: "🔫",
    category: "Arcade",
    rideDuration: 10,
    crowd: 40,
    peakHours: [14, 15, 18],
    tip: "Team up for better scores."
  }
];

// Expose globally (no bundler)
window.RIDES_DATA = RIDES_DATA;
