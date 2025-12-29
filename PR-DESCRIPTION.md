# PR: New Screens & Demo Bug Fixes

**Branch:** `marvin/new-screens` → `main`

## Summary

Implements new UI screens and fixes demo feedback bugs.

## Changes

### Demo Bug Fixes
- **≡ hamburger menu** - Replaced ••• with ≡ for better visibility
- **Interval styling** - Default interval (e.g., "3 days") now styled as selected badge with accent border
- **Color-coded buttons** - Shorter hovers blue, Longer hovers orange
- **Save Edit fix** - Now saves text only, does NOT complete the review (returns to review screen)

### New Screens Implemented
- **View History panel** - Full takeover, shows CURRENT content + past reviews with reflections
- **All Cards List** - Shows active/retired cards with due dates
- **Card Detail View** - Tap card from list to see details, interval, history

### New Helper Functions
- `formatDateLong()` - "Dec 28, 2025"
- `formatDateRelative()` - "in 3 days", "tomorrow", "overdue"
- `saveEdit()` - Separate from `reviewCard()` for clean edit flow

## Test Scenarios Added (for Trevor)

New test files documented in `TESTS.md`:

| Test File | Scenarios |
|-----------|-----------|
| `view-history.spec.js` | Open panel, current content, empty state, history entries, rephrased diffs, close |
| `all-cards-list.spec.js` | Show all button, active/retired lists, tap to detail, due dates, empty state |
| `card-detail.spec.js` | Full content, interval, due date, history, edit/retire/delete from detail |
| `interval-controls.spec.js` | Default styling, blue Shorter, orange Longer, toggle behavior |

### Updated Tests
- `card-actions.spec.js` - Updated for ≡ menu and fixed Save Edit behavior

### Recently Fixed Bugs (in TESTS.md)
1. ~~Save Edit completes review~~ → Fixed
2. ~~"3 days" not styled~~ → Fixed  
3. ~~••• not visible~~ → Fixed
4. ~~View history not implemented~~ → Fixed

## Still TODO (next PR)
- Settings Panel (edit deck)
- Move to Deck modal
- Skip toast with undo

---

**Note:** Push with deploy key once Ben adds it as a repository deploy key (not personal SSH key).

