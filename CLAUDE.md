# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the App

Open `index.html` directly in a browser — no build step, no server required. For local development with auto-reload, any static file server works:

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

## Architecture

Three-file vanilla JS SPA with no dependencies, no bundler, no framework.

- **`index.html`** — static markup only; no inline scripts or styles. All DOM IDs referenced in JS are defined here.
- **`script.js`** — all application logic. Single global state array (`messages`) persisted to `localStorage` under the key `futureMessages`. Initializes on `DOMContentLoaded`, then drives two recurring intervals: quote rotation (30 s) and countdown updates (1 s).
- **`style.css`** — CSS custom properties on `:root` for theming; `body.dark-mode` overrides them. Responsive via two breakpoints (`768px`, `480px`).

## Key Patterns

**State flow:** `messages[]` → `saveMessages()` (localStorage) → `renderMessages()` (full re-render of the messages container). There is no partial update; every state change triggers a full re-render.

**Message lifecycle:** A message is "locked" until `new Date(msg.revealDate) <= new Date()`. The `isRead` flag on a message is set to `true` the first time the countdown loop detects it has unlocked, which also triggers a re-render and save.

**XSS prevention:** User-supplied text (`name`, `message`) is always passed through `escapeHtml()` before being set as `innerHTML`. The modal's delete button uses an `onclick` attribute with a numeric `msg.id` (always `Date.now()`, so always an integer) — safe but worth noting if the pattern is extended.

**Theme:** Stored in `localStorage` under `theme` (`"dark"` | `"light"`). Falls back to `prefers-color-scheme` on first visit.

## Data Structures

**Message object:**
```javascript
{
  id: number,                    // Date.now() when created
  name: string,                  // User's name (XSS-escaped on render)
  message: string,               // Message content (XSS-escaped on render)
  revealDate: string,            // ISO string for reveal time
  category: string,              // One of: personal, career, health, goals, other
  created: string,               // ISO string for creation time
  isRead: boolean                // true after first unlock detection
}
```

**localStorage keys:**
- `futureMessages` — JSON array of all message objects
- `theme` — `"dark"` or `"light"` (or unset to use system preference)

## Recurring Updates

- **Quote rotation (30s):** `rotateQuote()` cycles through the `quotes` array. Animation trigger works by toggling `style.animation` to re-trigger the CSS animation defined in `style.css`.
- **Countdown updates (1s):** `updateCountdowns()` updates all `.countdown` elements with remaining time and checks if any locked messages need to unlock (sets `isRead`, triggers re-render if needed).

## Filtering and Categories

Messages are filtered by `currentFilter` (`'all'`, `'locked'`, `'unlocked'`) via click handlers on filter buttons. Categories (selected in the form) are displayed as badges on cards but don't affect filtering. Available categories are hardcoded in `index.html` as `<select>` options.

## Extending the App

To add new message categories, edit the `<select id="category">` options in `index.html` — the category value is stored as-is in the message object and rendered on cards and modals.

To add quotes, push new objects to the `quotes` array in `script.js` (format: `{ text: string, author: string }`).

To add new time-based features, use the same interval pattern: define a function, call it on `DOMContentLoaded`, and register it with `setInterval()`.
