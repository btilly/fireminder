# Fireminder Test Suite

## Running Tests

```bash
# Install (first time)
cd ~/code/fireminder
npm install
npx playwright install chromium

# Run all tests
npm test

# Run specific test file
npx playwright test tests/happy-path.spec.js

# Run with visible browser (debugging)
npm run test:headed
```

**Prerequisites:** Firebase emulators must be running:
```bash
export PATH="/opt/homebrew/opt/openjdk/bin:$PATH"
firebase emulators:start --project demo-fireminder
```

---

## Time Travel

Cards aren't immediately due after creation - they're scheduled for `today + startingInterval`. Use **time travel** to test review flows.

```javascript
import { timeTravel, futureDate } from './helpers.js';

// Travel 2 days forward to see newly created cards
await timeTravel(page, futureDate(2));
```

---

## Test Status

**38 passing, 11 blocked** (as of Dec 28, 2025)

| Test File | Status | Notes |
|-----------|--------|-------|
| `happy-path.spec.js` | ✅ 3/3 | Core user journey |
| `card-actions.spec.js` | ✅ 6/6 | Rephrase, retire, delete |
| `queue-priority.spec.js` | ⚠️ 3/4 | 1 test flaky on date edge |
| `time-travel.spec.js` | ✅ 4/4 | Developer feature |
| `smoke.spec.js` | ✅ 10/10 | Sidebar, theme, edge cases |
| `settings-panel.spec.js` | ✅ 5/5 | Deck settings |
| `move-to-deck.spec.js` | ✅ 4/4 | Move card between decks |
| `view-history.spec.js` | ⚠️ 3/5 | 2 blocked on empty state text |
| `skip-card.spec.js` | ❌ 0/4 | **BLOCKED** - click not working |
| `all-cards-list.spec.js` | ❌ 0/4 | **BLOCKED** - click not working |

### Blocked Issues

1. **"Show all cards" button** - Click fires but panel doesn't open. Vue reactivity issue?
2. **Skip card menu item** - Same issue - click happens, no effect.
3. **View history empty state** - Looking for wrong text pattern.

---

## Test Files

### 1. `happy-path.spec.js` ✅
**The critical path.** Creates deck → creates card → time travels → reviews with intervals.

| Test | Status |
|------|--------|
| Complete user journey | ✅ |
| Deck in sidebar/footer | ✅ |
| Multiple cards queue | ✅ |

### 2. `card-actions.spec.js` ✅
Card menu actions: rephrase, retire, delete.

| Test | Status |
|------|--------|
| Menu opens | ✅ |
| Rephrase + save | ✅ |
| Rephrase + cancel | ✅ |
| Retire | ✅ |
| Delete + confirm | ✅ |
| Delete + cancel | ✅ |

### 3. `queue-priority.spec.js` ⚠️
Time travel and queue behavior.

| Test | Status |
|------|--------|
| Cards not due are hidden | ✅ |
| Queue count decrements | ✅ |
| Card due after interval | ✅ |
| Hardcoded date test | ⚠️ Flaky |

### 4. `time-travel.spec.js` ✅
Developer feature for testing/demos.

| Test | Status |
|------|--------|
| Banner appears | ✅ |
| Sidebar shows controls | ✅ |
| Back to today | ✅ |
| Any date works | ✅ |

### 5. `smoke.spec.js` ✅
Quick sanity checks: sidebar, theme, sign out, edge cases.

| Test | Status |
|------|--------|
| Sidebar open/close | ✅ |
| X button closes sidebar | ✅ |
| My Decks section | ✅ |
| Deck switching | ✅ |
| Theme change | ✅ |
| Theme persists | ✅ |
| Sign out | ✅ |
| Empty deck name rejected | ✅ |
| Panel close via X | ✅ |
| Unicode deck names | ✅ |

### 6. `view-history.spec.js` ⚠️
Card history panel.

| Test | Status |
|------|--------|
| Open from menu | ✅ |
| Shows current content | ✅ |
| Empty history message | ❌ Wrong text pattern |
| History after review | ❌ Wrong selector |
| Close button | ✅ |

### 7. `all-cards-list.spec.js` ❌ BLOCKED
All cards view. **Button click not triggering panel.**

### 8. `settings-panel.spec.js` ✅
Deck settings screen.

| Test | Status |
|------|--------|
| Opens panel | ✅ |
| Edit deck name | ✅ |
| Edit starting interval | ✅ |
| Delete deck | ✅ |
| Cancel closes | ✅ |

### 9. `move-to-deck.spec.js` ✅
Card reassignment modal.

| Test | Status |
|------|--------|
| Opens modal from menu | ✅ |
| Current deck disabled | ✅ |
| Move updates card | ✅ |
| Cancel closes modal | ✅ |

### 10. `skip-card.spec.js` ❌ BLOCKED
Skip and undo. **Menu click not triggering skip.**

---

## Latest Test Run (marvin/new-screens branch)

**44 passed, 5 failed** (Dec 29, 2025)

### Passing Tests
- `happy-path.spec.js` - All pass ✓
- `card-actions.spec.js` - All pass ✓
- `smoke.spec.js` - All pass ✓
- `time-travel.spec.js` - All pass ✓
- `settings-panel.spec.js` - All pass ✓
- `move-to-deck.spec.js` - All pass ✓
- `skip-card.spec.js` - All pass ✓
- `view-history.spec.js` - 2/4 pass (2 flaky)

### Flaky Tests (timing issues - for Trevor to investigate)
| Test File | Test | Issue |
|-----------|------|-------|
| `all-cards-list.spec.js` | show all cards button opens panel | Panel not opening after click (timing?) |
| `all-cards-list.spec.js` | empty deck shows active count of 0 | Same issue |
| `all-cards-list.spec.js` | card list shows due date | Same issue |
| `all-cards-list.spec.js` | clicking card opens detail view | Same issue |

### Known Bug (expected failure)
| Test | Description |
|------|-------------|
| `queue-priority.spec.js:73` | Timezone date calculation bug - cards created on Dec 28 with 2-day interval don't appear on Dec 30 |

---

## Not Yet Implemented

- Cross-deck "All" view

---

## Recently Fixed Bugs

1. ~~**Save Edit completes review**~~ - Fixed: `saveEdit()` now saves text only
2. ~~**"3 days" not styled as selected**~~ - Fixed: accent border on default interval
3. ~~**≡ not visible**~~ - Fixed: replaced ••• with ≡ hamburger icon
4. ~~**View history not implemented**~~ - Fixed: full history panel with reflections

---

## Data Structure

```
users/(uid)/
  decks/
    deck_123/
      name: "Stoic Quotes"
      startingInterval: 2
      createdAt: "2025-12-29T..."
  cards/
    card_456/
      deckId: "deck_123"
      content: "The obstacle is the way"
      currentInterval: 3
      nextDueDate: "2025-12-31"
      lastReviewDate: "2025-12-28"
      retired: false
      history: [
        {
          date: "2025-12-28",
          interval: 3,
          reflection: "This really resonated today",
          previousContent: null  // or old text if rephrased
        }
      ]
```
