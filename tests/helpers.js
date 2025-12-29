// Test helpers for Fireminder E2E tests

/**
 * Generate unique name to avoid test collisions
 */
export function uniqueName(base) {
  return `${base}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Wait for the app to auto-login with demo user (emulator mode)
 */
export async function waitForDemoLogin(page) {
  // App auto-signs in as demo user after 500ms in emulator mode
  await page.waitForTimeout(800);
}

/**
 * Clear all test data by reloading with fresh state
 * Note: Firebase emulator persists data until restart
 */
export async function freshStart(page) {
  await page.goto('/');
  await waitForDemoLogin(page);
}

/**
 * Create a deck via the UI
 */
export async function createDeck(page, { name, interval = 2 }) {
  // Look for "Create Deck" button (empty state) or "+ New Deck" in sidebar
  const createBtn = page.getByRole('button', { name: /create deck/i });
  const hasCreateBtn = await createBtn.isVisible().catch(() => false);
  
  if (hasCreateBtn) {
    await createBtn.click();
  } else {
    // Open sidebar and click new deck
    await page.locator('.icon-btn').filter({ hasText: '≡' }).click();
    await page.getByRole('button', { name: /new deck/i }).click();
  }
  
  // Fill the form
  await page.locator('.form-input').first().fill(name);
  
  // Create (use panel action button)
  await page.locator('.panel-action').click();
  
  // Wait for panel to close
  await page.waitForTimeout(500);
}

/**
 * Create a card via the UI
 */
export async function createCard(page, content) {
  // Click + in header
  await page.locator('.header-right .icon-btn').first().click();
  
  // Wait for panel to open
  await page.locator('.panel').waitFor({ state: 'visible' });
  
  // Fill content (use first textarea = content field)
  await page.locator('.panel-body textarea.reflection-input').fill(content);
  
  // Save (use panel action button, same as createDeck)
  await page.locator('.panel-action').click();
  
  // Wait for panel to close
  await page.locator('.panel').waitFor({ state: 'hidden' });
}

/**
 * Get the current displayed interval
 */
export async function getCurrentInterval(page) {
  const text = await page.locator('.interval-current').textContent();
  return parseInt(text);
}

/**
 * Complete a review with default interval
 */
export async function completeReview(page) {
  await page.getByRole('button', { name: /review done/i }).click();
}

/**
 * Time travel to a specific date
 * @param {Page} page - Playwright page
 * @param {string} date - Date in YYYY-MM-DD format
 */
export async function timeTravel(page, date) {
  // Open sidebar
  await page.locator('.icon-btn').filter({ hasText: '≡' }).click();
  await page.locator('.sidebar').waitFor({ state: 'visible' });
  
  // Find and fill the time travel date input
  await page.fill('input[type="date"]', date);
  await page.press('input[type="date"]', 'Tab');
  
  // Wait for date to register
  await page.waitForTimeout(300);
  
  // Close sidebar using X button (more reliable than overlay)
  await page.locator('.sidebar-header .icon-btn').click();
  await page.waitForTimeout(300);
}

/**
 * Calculate a future date string
 * @param {number} daysFromNow - Days to add
 * @returns {string} Date in YYYY-MM-DD format
 */
export function futureDate(daysFromNow) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
}

/**
 * Clear time travel (back to today)
 */
export async function clearTimeTravel(page) {
  const banner = page.locator('.time-travel-banner');
  const hasBanner = await banner.isVisible().catch(() => false);
  
  if (hasBanner) {
    await page.locator('.time-travel-banner button').click();
    await page.waitForTimeout(300);
  }
}
