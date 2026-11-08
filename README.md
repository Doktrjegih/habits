# Habits

An installable, offline habit tracker. Add or edit habits with an icon and optional daily time goal, mark each day as completed, and record the total minutes spent. Browse past days using the week strip or date picker. Filter completed and pending habits, delete habits, and export a JSON backup.

## Run locally

Requires Node.js 20 or newer. No runtime packages or build dependencies are needed.

```sh
npm run dev
```

Open http://localhost:4173. Run `npm test` for data model tests.

## Build and host

```sh
npm run build
SERVE_DIST=1 npm start
```

Deploy the contents of `dist/` to any static host over **HTTPS**. Relative assets support hosting at `/` or under a subdirectory such as `/habits/`. The manifest and service worker enable installation and offline use after the first visit. On iOS, use Safari → Share → Add to Home Screen. In Chrome/Edge, use the install control or browser menu.

## Data

Habits and daily entries are stored in localStorage on the current browser/device. No account, analytics, backend, or cross-device sync. Export data using the footer button for a backup; clearing browser data removes local records. Time is entered in whole minutes (0–1440 per habit per day) and is separate from completion. A habit appears from its creation date onward; creating one while viewing a past day uses that date. Deleting a habit also deletes its history after confirmation.

## Implementation

Vanilla JavaScript ES modules, responsive CSS, a web app manifest, and a service worker with a cached app shell. `src/store.js` holds data rules; `src/app.js` handles the UI. `server.mjs` is a small development/preview server. When changing cached assets for a release, bump the cache version in `public/sw.js`; close existing tabs to activate an update.
