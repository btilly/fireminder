# Fireminder

*FI-bonacci Reminder + Fire Minder* 🔥🧠

Mobile-first web app for spaced repetition review using Fibonacci intervals.

---

## Quick Start (Local Development)

```bash
# 1. Start Firebase emulators (requires Java)
export PATH="/opt/homebrew/opt/openjdk/bin:$PATH"
firebase emulators:start --project demo-fireminder

# 2. In another terminal, serve the app
python3 -m http.server 3000

# 3. Open in browser
open http://localhost:3000
```

**URLs:**
- App: http://localhost:3000
- Firebase Emulator UI: http://localhost:4000

---

## Design Philosophy

- **Clean, minimal interface** - no clutter
- **Mobile-first** - thumb-friendly, responsive
- **Advanced options unobtrusive** - hidden until needed
- **Settings behind a gear** - out of the way

---

## Core Features (v1)

### Fibonacci Sequence
- Sequence: 1, 2, 3, 5, 8, 13, 21...
- Default starting position: **2** (first review after 2 units)

### Records
- **Markdown storage** with WYSIWYG editor (human-readable during dev)
- Future: may convert to structured JSON
- Each record surfaces for review on Fibonacci schedule
- One record shown at a time during review

### Review Flow
- View current record
- **Minimum interaction:** Submit button (confirms review)
- **Optional:** Add comment/reflection
- **Optional:** Rephrase record (keeps full history)
- **Interval controls:**
  - **Default:** Next natural Fibonacci step
  - **Shorter:** Step back one Fibonacci number (shows target days)
  - **Longer:** Step forward one Fibonacci number (shows target days)
- **Card actions (in ••• menu):**
  - **Rephrase card** - edit with history
  - **View history** - slide-out drawer
  - **Skip** - review later today, no interval change
  - **Move to deck** - reassign to different deck
  - **Retire** - mark complete, never show again
  - **Delete** - true delete, requires confirmation

### History
- All rephrases preserved with timestamps
- Slide-out drawer for history view

### Decks/Streams
- Multiple independent collections
- Per-deck settings:
  - Starting interval (minimum: days)
  - Interval unit (days, weeks, etc.)
  - Queue limit (max items per day)
  - Queue ordering (random vs. overdue ratio)
- Deck management: create, rename, edit settings, delete
- Always visible: add new entry button

### Queue Behavior (Single Pass)
- **Sort order:**
  1. Previously-reviewed items by overdue ratio (time overdue ÷ interval)
  2. Never-reviewed items (oldest first / FIFO)
- Items can't be "overdue" if never reviewed
- **Queue limits (per deck):**
  - Default: unlimited
  - Limit cuts off wherever it lands
  - Overflow items pushed out by one unit

### Overdue Decay
When reviewing an overdue item, the "natural" next interval drops based on how overdue:

**Example:** Current interval = 8
- Reviewed within 8 days overdue → next = 13 (normal)
- Overdue by 8+ days (1× interval) → next = 5 (drop one)
- Overdue by 16+ days (2× interval) → next = 3 (drop two)
- ...continues dropping, floors at deck's starting interval

**Logic:** For each full interval-length you're overdue, drop one Fibonacci step.

### Cross-Deck View
- Optional aggregate view ("everything due today")
- Default: per-deck view

### Auth
- Multi-user
- Google login (v1)

---

## v2 Features

### Notifications
- Push notifications when review is due
- Reply to notification = comment + completes review

---

## Technical Stack

- **Frontend:** Vue 3 (via CDN)
- **Backend:** Firebase (Firestore + Auth)
- **Hosting:** GitHub Pages or Firebase Hosting
- **Project name:** `fireminder`

---

## UI Mockups

### Main Review Screen

```
┌─────────────────────────────┐
│  ≡  Fireminder    [+]  ⚙️   │  ← + is ever-present "add card"
├─────────────────────────────┤
│                             │
│  ┌───────────────────────┐  │
│  │                       │  │
│  │   "The obstacle is    │  │
│  │      the way"         │  │
│  │                       │  │
│  │   ── Marcus Aurelius  │  │
│  │                       │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │ Add reflection...     │  │
│  └───────────────────────┘  │
│                             │
│  [5] Shorter │ 8 days │ Longer [13]
│                             │
│  [ ✓ Review Done ]    •••   │  ← ••• opens menu
│                             │
│  3 more today               │
│                             │
├─────────────────────────────┤
│ 📚 Stoic  │ 💼 Work  │ 🌍 All │
└─────────────────────────────┘
```

### ••• Menu Options

```
┌─────────────────────┐
│ Rephrase card       │
│ View history        │
│ Skip (review later) │
│ Move to deck...     │
│ ─────────────────── │
│ Retire              │
│ Delete...           │  ← requires confirmation
└─────────────────────┘
```

See full mockups in the spec document.

