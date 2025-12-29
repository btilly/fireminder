# Fireminder Test Cases

## Current Test Status (2025-12-28)

**Summary:** 9 passing, 18 failing

| Test File | Status | Notes |
|-----------|--------|-------|
| 01-first-time-user.spec.js | ✅ 3/3 passing | Works |
| 02-create-card.spec.js | ⚠️ 2/4 passing | 2 fail due to card scheduling change |
| 03-review-flow.spec.js | ❌ 0/8 passing | All fail - no cards available (scheduled for future) |
| 05-card-actions.spec.js | ❌ 0/8 passing | All fail - no cards available |
| 09-sidebar-navigation.spec.js | ✅ 4/4 passing | Works |

**Root cause of failures:** Cards are now correctly scheduled for `today + startingInterval` (per Kate's feedback). Tests expected immediate appearance. Tests need updating.

---

## Local Setup for Playwright

```bash
# Terminal 1: Start Firebase emulators
cd ~/code/fireminder
export PATH="/opt/homebrew/opt/openjdk/bin:$PATH"
firebase emulators:start --project demo-fireminder

# Terminal 2: Serve the app
cd ~/code/fireminder
python3 -m http.server 3000
```

**Test against:** http://localhost:3000

**Note:** In emulator mode, the app auto-signs in anonymously - no Google OAuth required.

---

## Running Automated Tests

```bash
# First time only: install Playwright
cd ~/code/fireminder
npm install
npx playwright install chromium

# Run specific test file (recommended)
npx playwright test tests/01-first-time-user.spec.js

# Run all tests (takes ~7 minutes, ask Kate first!)
npm test

# Run tests with browser visible (debugging)
npm run test:headed

# Run with Playwright UI (interactive)
npm run test:ui
```

**Prerequisites:**
- Firebase emulators running (Terminal 1)
- Tests auto-start the web server via playwright.config.js

---

## User Flows to Test

### 1. First-Time User Flow ✅ PASSING

**Test file:** `tests/01-first-time-user.spec.js`
**Run:** `npx playwright test tests/01-first-time-user.spec.js`

**Precondition:** No decks exist

**Steps:**
1. Load app
2. Should see "Welcome! Create your first deck" message
3. Click "Create Deck"
4. Fill in: Name="Test Deck", Emoji="📝", Starting interval=2
5. Click "Create"

**Expected:**
- New Deck panel opens on button click
- Deck is created and selected
- User sees empty deck state ("All caught up")
- Deck appears in sidebar and footer tabs

**Test Results:**
- ✅ Welcome message displays correctly
- ✅ Panel closes after clicking Create
- ✅ Deck is created and selected
- ✅ Empty deck state shows correctly
- ✅ Deck appears in sidebar and footer tabs

**Bugs Fixed:**
- Panel not closing after Create (moved close to before async operation)
- Missing `cards` in Vue return statement (caused render error)

---

### 2. Create Card Flow ⚠️ PARTIAL

**Test file:** `tests/02-create-card.spec.js`
**Run:** `npx playwright test tests/02-create-card.spec.js`

**Precondition:** At least one deck exists

**Steps:**
1. Click [+] in header
2. Add Card panel should open (full takeover, no footer visible)
3. Enter text: "Test card content"
4. Select deck from dropdown
5. Click "Save"

**Expected:**
- Panel closes
- Card is created (but NOT visible immediately - scheduled for future)
- Empty deck state shows ("All caught up")

**Test Results:**
- ✅ Panel opens on + click
- ✅ Footer hidden (full takeover)
- ✅ Deck selection works
- ❌ Tests expecting immediate card appearance fail (correct behavior now)

**Bugs Fixed:**
- Footer visible when panel open (added v-if to hide footer during panel)

**Design Change:**
- Cards are now scheduled for `today + startingInterval`
- They don't appear immediately - this is correct per spec
- Tests need updating to reflect this

---

### 3. Basic Review Flow ❌ TESTS NEED UPDATE

**Test file:** `tests/03-review-flow.spec.js`
**Run:** `npx playwright test tests/03-review-flow.spec.js`

**Precondition:** Deck has at least one card DUE (not just created)

**Steps:**
1. View card content
2. (Optional) Enter reflection text
3. Click "✓ Review Done"

**Expected:**
- Card disappears from queue
- Next card appears (or empty state if no more)
- Queue count decrements ("X more today")
- Card's nextDueDate is set to today + interval

**Test Results:**
- ❌ All 8 tests fail - no cards available (correctly scheduled for future)
- Tests need to create cards with `nextDueDate: today` to simulate due cards

---

### 4. Interval Controls ❌ TESTS NEED UPDATE

**Test file:** `tests/03-review-flow.spec.js`

**Precondition:** Card is showing for review

**Steps:**
1. Note current interval (e.g., "8 days")
2. Click "Shorter" button
3. Verify interval display updates (e.g., "5 days")
4. Click "Shorter" again to deselect
5. Verify returns to default
6. Click "Longer" button
7. Verify interval increases (e.g., "13 days")

**Expected:**
- Buttons toggle on/off
- Interval display reflects selection
- Fibonacci sequence is correct: 1, 2, 3, 5, 8, 13, 21...

**Test Results:**
- ❌ All tests timeout - no card visible to test interval controls

---

### 5. Rephrase Card (Inline Edit) ❌ TESTS NEED UPDATE

**Test file:** `tests/05-card-actions.spec.js`

**Precondition:** Card is showing for review

**Steps:**
1. Click ••• menu
2. Click "Rephrase card"
3. Card content becomes editable
4. Modify the text
5. Click "Save Edit"

**Expected:**
- ••• menu closes
- Card enters edit mode (shows "✎ EDITING" indicator)
- Cancel/Save buttons replace Review Done
- After save: card shows new content
- Review is also completed (card leaves queue)

**Test Results:**
- ❌ All tests timeout - waiting for `.menu-btn` which doesn't exist (no card visible)

---

### 6. Cancel Edit ❌ TESTS NEED UPDATE

**Test file:** `tests/05-card-actions.spec.js`

**Precondition:** Card is in edit mode

**Steps:**
1. Click "Cancel"

**Expected:**
- Edit mode exits
- Original content restored
- Review buttons return

**Test Results:**
- ❌ Blocked - no card visible

---

### 7. Retire Card ❌ TESTS NEED UPDATE

**Test file:** `tests/05-card-actions.spec.js`

**Precondition:** Card is showing for review

**Steps:**
1. Click ••• menu
2. Click "Retire"

**Expected:**
- Card disappears from queue
- Card never appears again
- Stats show incremented "retired" count

**Test Results:**
- ❌ Blocked - no card visible

---

### 8. Delete Card ❌ TESTS NEED UPDATE

**Test file:** `tests/05-card-actions.spec.js`

**Precondition:** Card is showing for review

**Steps:**
1. Click ••• menu
2. Click "Delete..."
3. Confirmation dialog appears
4. Confirm deletion

**Expected:**
- Confirmation prompt shown
- Card is permanently removed
- Card does NOT appear in retired count

**Test Results:**
- ❌ Blocked - no card visible

---

### 9. Sidebar Navigation ✅ PASSING

**Test file:** `tests/09-sidebar-navigation.spec.js`
**Run:** `npx playwright test tests/09-sidebar-navigation.spec.js`

**Steps:**
1. Click ≡ (hamburger) in header
2. Sidebar slides in
3. View deck list with card counts
4. Click different deck
5. Sidebar closes

**Expected:**
- Sidebar opens from left
- Overlay dims background
- Clicking overlay closes sidebar
- Clicking deck selects it and closes sidebar
- Main view updates to show selected deck's cards

**Test Results:**
- ✅ Hamburger menu opens sidebar
- ✅ Sidebar shows "My Decks" section and "+ New Deck" button
- ✅ Clicking overlay closes sidebar
- ✅ Clicking X closes sidebar

---

### 10. Create Deck from Sidebar

**(Not yet automated)**

**Steps:**
1. Open sidebar
2. Click "+ New Deck"
3. Fill form
4. Click "Create"

**Expected:**
- New Deck panel opens
- Sidebar closes
- After create: new deck is selected

---

### 11. Empty Deck State

**(Not yet automated)**

**Precondition:** Deck has cards but none are due

**Expected display:**
- "Status: All caught up ✓"
- Stats: X active cards, X retired
- "Next due: in X days"
- "Show all cards" button visible

---

### 12. Queue Ordering

**(Not yet automated)**

**Precondition:** Multiple cards due (some overdue, some never reviewed)

**Expected:**
- Overdue cards appear first (sorted by overdue ratio)
- Never-reviewed cards appear after all overdue
- Never-reviewed sorted by creation date (oldest first)

---

### 13. Footer Tab Navigation

**(Not yet automated)**

**Precondition:** Multiple decks exist

**Steps:**
1. Click deck tab in footer
2. View updates to show that deck

**Expected:**
- Tab becomes active (highlighted)
- Main content shows selected deck's cards/empty state

---

### 14. Add Reflection

**(Not yet automated)**

**Steps:**
1. With card showing, type in "Add reflection..." textarea
2. Complete review

**Expected:**
- Reflection text is saved to card history
- Text area clears after review

---

### 15. Theme Switcher ✅ IMPLEMENTED

**(Not yet automated)**

**Steps:**
1. Click 🎨 button in header
2. Theme picker appears with 6 color swatches
3. Click a different theme (e.g., "ocean")
4. UI updates to new colors immediately
5. Close picker by clicking a theme or clicking elsewhere
6. Refresh page

**Expected:**
- Theme picker shows 6 options: light, dark, ocean, forest, rose, ember
- Current theme has checkmark
- Clicking theme applies it instantly
- Theme persists after page refresh (saved to localStorage)
- Default theme is "light"

**Themes available:**
- `light` - warm paper, blue accent
- `dark` - soft dark gray, teal accent  
- `ocean` - deep navy, aqua accent
- `forest` - deep green, sage accent
- `rose` - soft pink, magenta accent
- `ember` - the OG, black & orange 🔥

---

## Not Yet Implemented (Skip These)

- View history (drawer)
- Skip (review later)
- Move to deck
- Settings (⚙️)
- "Show all cards" button
- Cross-deck "All" view
- Google OAuth (use emulator auto-login)

---

## Data Verification

After tests, check Firebase Emulator UI at http://localhost:4000/firestore

**Expected structure:**
```
users/
  (anonymous-uid)/
    decks/
      deck_123/
        name: "Test Deck"
        emoji: "📝"
        startingInterval: 2
        queueLimit: null
        createdAt: "2025-..."
    cards/
      card_456/
        deckId: "deck_123"
        content: "Test card content"
        currentInterval: 2
        lastReviewDate: null
        nextDueDate: "2025-12-30"  ← scheduled for future!
        retired: false
        deleted: false
        history: []
```

---

## Test Maintenance Notes

**Card Scheduling Change (2025-12-28):**
Cards are now correctly scheduled for `today + startingInterval` on creation. They don't appear for review until that date passes. Tests that need a card to be visible should create cards with `nextDueDate: today` directly via Firestore, or use a helper function.
