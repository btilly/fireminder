# Fireminder Test Cases

## Time Travel: The Key to Testing

**Cards don't appear immediately after creation.** They're scheduled for `today + startingInterval` (default 2 days). To see cards for review, use **Time Travel**.

### Time Travel Demo Story 🕐

This story demonstrates the full user journey using time travel:

```
Day 1 (Today - Dec 29, 2025):
├── Create deck "Stoic Quotes" with 2-day starting interval
├── Add card "The obstacle is the way"
├── Add card "Memento mori"
└── Status: "All caught up" (cards scheduled for Day 3)

Day 3 (Time travel → Dec 31, 2025):
├── Both cards now appear for review
├── Review first card, select "Longer [3]" → scheduled for Day 6
├── Review second card, default interval → scheduled for Day 6
└── Status: "All caught up"

Day 6 (Time travel → Jan 3, 2026):
├── Both cards appear again
├── First card: interval now shows [2] Shorter | 5 days | Longer [5]
├── Add new card "Amor fati" (will be due Day 8)
└── Review both cards

Day 8 (Time travel → Jan 5, 2026):
├── "Amor fati" appears (first review)
├── Other cards not yet due (scheduled for Day 11+)
└── This demonstrates queue priority: new cards appear after overdue
```

### How to Use Time Travel in Tests

```javascript
// 1. Open sidebar
await page.click('button:has-text("≡")');

// 2. Set simulated date
await page.fill('input[type="date"]', '2026-01-05');
await page.press('input[type="date"]', 'Tab');

// 3. Verify date changed
await expect(page.locator('.time-travel-banner')).toContainText('2026-01-05');

// 4. Close sidebar (optional)
await page.click('button:has-text("✕")');
```

---

## Local Setup for Playwright

```bash
# Terminal 1: Start Firebase emulators
cd ~/code/fireminder
export PATH="/opt/homebrew/opt/openjdk/bin:$PATH"
firebase emulators:start --project demo-fireminder

# Terminal 2: Serve the app (or let Playwright do it)
cd ~/code/fireminder
python3 -m http.server 3000
```

**Test against:** http://localhost:3000

**Note:** In emulator mode, the app auto-signs in anonymously.

---

## Running Automated Tests

```bash
# Install (first time)
cd ~/code/fireminder
npm install
npx playwright install chromium

# Run specific test
npx playwright test tests/01-first-time-user.spec.js

# Run all tests (slow - ask Kate first!)
npm test

# Run with visible browser
npm run test:headed
```

---

## User Flows to Test

### 1. First-Time User Flow ✅

**Uses time travel:** No (just deck creation)

**Steps:**
1. Load app → see "Welcome! Create your first deck"
2. Click "Create Deck"
3. Fill: Name="Test Deck", Starting interval=2
4. Click "Create"

**Expected:**
- Panel closes
- Deck created and selected
- Empty state shows ("All caught up")
- "Next due: in 2 days"

---

### 2. Create Card Flow ✅

**Uses time travel:** No (verifying scheduling, not review)

**Steps:**
1. Click [+] in header
2. Add Card panel opens (full takeover)
3. Enter "Test card content"
4. Select deck
5. Click "Save"

**Expected:**
- Panel closes
- Returns to previous screen (review card or empty state)
- Card count increments in sidebar
- Card is NOT visible for review yet (scheduled for future)
- "Next due: in 2 days" shows in empty state

---

### 3. Basic Review Flow 🕐

**Uses time travel:** YES

**Setup:**
1. Create deck with 2-day interval
2. Create card
3. Time travel 2 days forward

**Steps:**
1. Card appears for review
2. Enter optional reflection
3. Click "✓ Review Done"

**Expected:**
- Card disappears from queue
- Shows next card or empty state
- "X more today" decrements

---

### 4. Interval Controls 🕐

**Uses time travel:** YES

**Setup:** Time travel to have a card visible

**Steps:**
1. Note current interval (e.g., "3 days")
2. Click "[2] Shorter" → interval shows "2 days"
3. Click "Longer [5]" → interval shows "5 days"
4. Complete review

**Expected:**
- Buttons toggle selection
- Middle display shows selected interval
- Fibonacci sequence: 1, 2, 3, 5, 8, 13, 21...
- Review uses selected interval for next due date

---

### 5. Rephrase Card (Inline Edit) 🕐

**Uses time travel:** YES

**Setup:** Time travel to have a card visible

**Steps:**
1. Click ••• menu
2. Click "Rephrase card"
3. Modify text
4. Click "Save Edit"

**Expected:**
- Card enters edit mode ("✎ EDITING")
- Save returns to review screen with new text
- Review is NOT completed (user must still click Review Done)

**Known Bug:** Currently Save Edit also completes review. Fix needed.

---

### 6. Retire Card 🕐

**Uses time travel:** YES

**Setup:** Time travel to have a card visible

**Steps:**
1. Click ••• menu
2. Click "Retire"

**Expected:**
- Card disappears immediately
- Never appears again
- "Retired" count increments in stats

---

### 7. Delete Card 🕐

**Uses time travel:** YES

**Setup:** Time travel to have a card visible

**Steps:**
1. Click ••• menu
2. Click "Delete..."
3. Confirm in dialog

**Expected:**
- Card permanently removed
- Does NOT count as retired

---

### 8. Sidebar Navigation ✅

**Uses time travel:** No

**Steps:**
1. Click ≡ (hamburger)
2. Sidebar opens
3. View deck list
4. Click deck → switches view
5. Click overlay or ✕ → closes

**Expected:**
- Sidebar slides from left
- Shows decks with card counts
- Today's date displayed at top
- Theme picker and Time Travel in "Developer" section
- Sign Out at bottom

---

### 9. Queue Priority 🕐

**Uses time travel:** YES (critical)

**Setup:**
1. Create 2 cards on Day 1
2. Time travel to Day 3 (both due)
3. DON'T review one card
4. Time travel to Day 5

**Expected:**
- Overdue card appears FIRST
- Never-reviewed cards come after overdue
- "X more today" shows correct count

---

### 10. Adding Cards Mid-Review 🕐

**Uses time travel:** YES

**Setup:** Time travel to have a card visible

**Steps:**
1. Card showing for review
2. Click [+] to add new card
3. Enter content, save

**Expected:**
- Returns to SAME review screen (not the new card)
- Review state preserved
- New card scheduled for future
- Can continue reviewing current card

---

### 11. Time Travel Itself ✅

**Uses time travel:** This IS the test

**Steps:**
1. Open sidebar
2. Note today's date in "TODAY" box
3. Enter future date in Time Travel input
4. Press Tab or click away

**Expected:**
- Orange banner appears: "🕐 Simulating: YYYY-MM-DD"
- "← Back to today" button visible
- TODAY box shows simulated date + "Simulated" label
- Cards due on that date appear for review
- Reset button clears simulation

---

### 12. Theme Switcher ✅

**Uses time travel:** No

**Steps:**
1. Open sidebar
2. Click theme swatch in Developer section
3. UI updates immediately
4. Refresh page

**Expected:**
- 6 themes: light, dark, ocean, forest, rose, ember
- Active theme has checkmark
- Persists after refresh (localStorage)

---

### 13. Sign Out ✅

**Uses time travel:** No

**Steps:**
1. Open sidebar
2. Click "Sign Out"

**Expected:**
- Returns to sign-in screen
- All data cleared from view
- Must sign in again to see decks

---

## Not Yet Implemented

- View history (drawer)
- Skip (review later)
- Move to deck
- "Show all cards" button
- Cross-deck "All" view
- Google OAuth (use emulator auto-login)

---

## Known Bugs to Fix

1. **Save Edit completes review** - Should only save text, return to review
2. **Edit should be overlay** - Not replace review screen
3. **"3 days" not styled as selected** - Default interval needs visual indicator
4. **Reflections saved but not displayed** - Need history view
5. **••• should be ≡** - More noticeable menu icon
6. **Color-code interval buttons** - Shorter/Longer should use different accent colors

---

## Data Structure

```
users/
  (uid)/
    decks/
      deck_123/
        name: "Stoic Quotes"
        startingInterval: 2
        queueLimit: null
        createdAt: "2026-01-03T..."  ← uses simulated date
    cards/
      card_456/
        deckId: "deck_123"
        content: "The obstacle is the way"
        currentInterval: 2
        createdAt: "2026-01-03T..."  ← uses simulated date
        lastReviewDate: null
        nextDueDate: "2026-01-05"
        retired: false
        deleted: false
        history: []
```
