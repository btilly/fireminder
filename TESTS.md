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

## Test Files

### 1. `happy-path.spec.js`
**The critical path.** Creates deck → creates card → time travels → reviews with intervals.

| Test | What it covers |
|------|----------------|
| Complete user journey | Welcome → deck → card → time travel → interval controls → review |
| Deck in sidebar/footer | Deck appears in both locations after creation |
| Multiple cards queue | Queue count, card progression |

### 2. `card-actions.spec.js`
Card menu actions: rephrase, retire, delete.

| Test | What it covers |
|------|----------------|
| Menu opens | ≡ hamburger shows all options |
| Rephrase + save | Edit mode, Save Edit updates card text, returns to review (does NOT complete review) |
| Rephrase + cancel | Cancel preserves original |
| Retire | Card removed, never returns |
| Delete + confirm | Permanent removal |
| Delete + cancel | Card stays |

### 3. `queue-priority.spec.js`
Overdue cards appear first.

| Test | What it covers |
|------|----------------|
| Overdue first | More overdue cards appear before less overdue |
| Queue count | Decrements correctly as cards reviewed |

### 4. `time-travel.spec.js`
Developer feature for testing/demos.

| Test | What it covers |
|------|----------------|
| Banner appears | Shows simulated date |
| Sidebar shows date | TODAY box reflects simulation |
| Back to today | Clears simulation |
| Any date works | Can travel to 2030 |

### 5. `smoke.spec.js`
Quick sanity checks: sidebar, theme, sign out, edge cases.

| Test | What it covers |
|------|----------------|
| Sidebar open/close | Hamburger, overlay, X button |
| Deck switching | Click deck in sidebar |
| Theme change | 6 themes, persists after refresh |
| Sign out | Returns to sign-in screen |
| Empty deck name | Rejected (panel stays open) |
| Escape closes panel | Keyboard shortcut |
| Unicode deck names | 日本語 works |

### 6. `view-history.spec.js`
Card history panel (full takeover).

| Test | What it covers |
|------|----------------|
| Open from menu | ≡ → "View history" opens panel |
| Current content shown | CURRENT section displays card text |
| Empty state | "No history yet" for unreviewed cards |
| History entries | Shows date, interval, reflection for each review |
| Previous content shown | If card was rephrased, shows diff |
| Close panel | ✕ returns to review screen |

### 7. `all-cards-list.spec.js`
All cards view from empty deck screen.

| Test | What it covers |
|------|----------------|
| Show all cards button | Visible on empty deck screen |
| Lists active cards | Shows card content, due date |
| Lists retired cards | Separate section, grayed out |
| Tap opens detail | Clicking card opens Card Detail view |
| Due date formatting | "in 3 days", "tomorrow", "overdue by 2 days" |
| Empty state | "No cards yet" for empty deck |
| Close panel | ✕ returns to deck screen |

### 8. `card-detail.spec.js`
Card detail view from All Cards list.

| Test | What it covers |
|------|----------------|
| Shows full content | Card text displayed prominently |
| Shows current interval | "Current interval: X days" |
| Shows next due date | "Next due: Jan 3, 2025" |
| History section | Expandable list of past reviews |
| Edit from detail | Can enter edit mode |
| Retire from detail | Can retire card |
| Delete from detail | Can delete card |
| Close panel | ✕ returns to All Cards list |

### 9. `interval-controls.spec.js`
Interval button styling and behavior.

| Test | What it covers |
|------|----------------|
| Default interval styled | Middle badge has accent border |
| Shorter button hover | Blue tint on hover |
| Longer button hover | Orange tint on hover |
| Click Shorter | Button highlighted blue, interval updates |
| Click Longer | Button highlighted orange, interval updates |
| Toggle off | Clicking same button returns to default |

---

## Not Yet Implemented

- Settings Panel (edit deck name, interval, limit, delete)
- Skip toast (snackbar with undo)
- Move to deck modal
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
