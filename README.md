# KiroFishing 🎣

A Swiss fishing companion web app built with React + TypeScript + Vite.

## Features

### 🗺️ Canton-based Fishing Laws
- Interactive OpenStreetMap where you can click any location in Switzerland
- Automatically detects the Swiss canton from the selected coordinates (via Nominatim reverse geocoding)
- Displays canton-specific fishing laws, legal sources, permit information, and minimum catch sizes for all 26 cantons

### 📋 Fishing Session Tracker
- Create fishing sessions with date, start time, and location
- Log weather conditions: temperature, wind speed, humidity, and weather state (sunny/cloudy/rainy/stormy)
- Log water conditions: temperature, clarity, level, and current strength
- All data persisted locally (like Strava for sports)

### 🐟 Catch Log
- Log individual catches per session: species, length, weight, time, and release status
- Choose from a comprehensive list of Swiss freshwater fish species
- Add notes to individual catches
- View catch history per session

## Tech Stack

- **React 19** + **TypeScript** – Modern frontend framework
- **Vite** – Fast build tool
- **Leaflet** + **OpenStreetMap** – Interactive maps and reverse geocoding
- **lucide-react** – Icons
- **localStorage** – Client-side data persistence (no backend required)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Build

```bash
npm run build
```

## Fishing Regulations

All 26 Swiss cantons have their own fishing laws based on the federal **Bundesgesetz über die Fischerei (BGF)**. The app provides:
- Links to cantonal fishing authority websites
- Minimum catch sizes per species
- Permit information
- General fishing guidance

> **Note:** Always verify current regulations with the official cantonal authority before fishing. Laws can change.
