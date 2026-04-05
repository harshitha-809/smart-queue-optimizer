# 🎢 ParkPal — Smart Amusement Park Planner

> A real-time crowd-aware itinerary planner that helps visitors maximize their time at amusement parks by minimizing wait times.

![ParkPal Preview](https://img.shields.io/badge/status-live-brightgreen) ![HTML](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white) ![CSS](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white) ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)

---

## 📖 Problem Statement

Amusement parks suffer from uneven crowd distribution — popular rides attract massive queues while other attractions stay empty. Visitors often waste 50–70% of their park time waiting in lines, missing rides entirely. ParkPal solves this by building an optimized, time-slotted itinerary based on **live crowd data** fed in by park operators.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🗺 Smart Itinerary | Greedy scheduling algorithm routes visitors through low-crowd rides first |
| 📊 Live Crowd Data | Ride operators update occupancy in real-time via the Operator Panel |
| ⏱ Wait Estimation | Dynamic wait time model based on crowd score |
| 📅 Heatmap | Hourly crowd forecast across the full park day |
| 📤 Share Plan | Native share sheet (or clipboard fallback) |
| ♿ Accessible | ARIA roles, keyboard navigation, `prefers-reduced-motion` support |
| 📶 Offline-friendly | Zero external API calls — loads on slow park Wi-Fi |

---

## 🏗 Architecture

```
parkpal/
├── index.html          # App shell & semantic markup
├── css/
│   ├── reset.css       # Modern CSS reset
│   ├── variables.css   # Design tokens (colors, spacing, radius…)
│   ├── layout.css      # App shell, header, step nav, page structure
│   ├── components.css  # All UI components (cards, buttons, timeline…)
│   └── animations.css  # Keyframes & utility animation classes
├── js/
│   ├── utils.js        # Pure functions (time conversion, crowd math)
│   ├── planner.js      # Core scheduling algorithm
│   ├── ui.js           # All DOM rendering — no business logic
│   ├── admin.js        # Operator panel (modal, slider, save)
│   ├── background.js   # Canvas particle background
│   └── app.js          # Root controller — state & event wiring
└── data/
    └── rides.js        # Ride definitions + live crowd state
```

**Design principles:**
- **Separation of concerns** — data, logic, rendering are fully decoupled
- **Module pattern** — each file exposes a single IIFE namespace
- **Event delegation** — single listener on the grid container vs one per card
- **No framework dependency** — vanilla JS, ships as a single folder

---

## 🧠 Algorithm

`planner.js` implements a **greedy scheduling** approach:

1. Filter the visitor's selected rides
2. Sort by ascending crowd score (lowest wait → do first)
3. Slot rides sequentially with walk buffers (`5 min`) between each
4. Skip any ride that would overrun the departure time
5. Insert 15-minute rest breaks every 3 rides

**Wait time model:**

| Crowd Score | Formula |
|---|---|
| 0 – 39 (Low) | `crowd × 0.35` min |
| 40 – 69 (Moderate) | `10 + (crowd − 40) × 0.6` min |
| 70 – 100 (High) | `28 + (crowd − 70) × 1.0` min |

---

## 🚀 Getting Started

No build step required. Open `index.html` in any modern browser:

```bash
git clone https://github.com/YOUR_USERNAME/parkpal.git
cd parkpal
open index.html        # macOS
# or
start index.html       # Windows
# or serve with any static server:
npx serve .
```

---

## 🔌 Connecting a Real Backend

The `data/rides.js` file is the only integration point. To connect a live backend:

```js
// Replace static data in data/rides.js with a fetch call:
async function loadRides() {
  const res = await fetch('https://your-api.com/rides/live');
  window.RIDES_DATA = await res.json();
}
```

Suggested stack: **Firebase Realtime Database** (operators update crowd %, visitors see changes instantly via WebSocket).

---

## 📱 Screenshots

| Setup | Itinerary | Operator Panel |
|---|---|---|
| Pick rides + set time | Optimized schedule | Live crowd control |

---

## 🛣 Roadmap

- [ ] QR code entry with pre-assigned visitor ID
- [ ] Backend integration (Firebase / REST)
- [ ] Park map with walking directions between rides
- [ ] Push notifications: "Head to Thunder Coaster now — queue just dropped!"
- [ ] Historical crowd analytics dashboard for park managers
- [ ] Multi-language support

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first.

1. Fork the repo
2. Create your branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push and open a PR

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details.

---

*Built as a solution to real crowd management problems in high-traffic entertainment venues.*
