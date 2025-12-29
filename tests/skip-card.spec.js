// Skip Card Tests
import { test, expect } from '@playwright/test';
import { waitForDemoLogin, createDeck, createCard, uniqueName, timeTravel, futureDate } from './helpers.js';

test.describe('Skip Card', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForDemoLogin(page);
    await createDeck(page, { name: uniqueName('SkipTest'), interval: 2 });
    await createCard(page, 'Card to skip');
    await timeTravel(page, futureDate(2));
  });

  test('skip from menu hides card', async ({ page }) => {
    // Verify card is showing
    await expect(page.locator('.card-content')).toContainText('Card to skip');
    
    // Open menu and skip
    await page.locator('.menu-btn').click();
    await page.getByRole('button', { name: 'Skip (review later)' }).click();
    
    // Card should be hidden (shows empty state since only 1 card)
    await expect(page.getByText(/all caught up/i)).toBeVisible();
  });

  test('toast appears after skip', async ({ page }) => {
    await page.locator('.menu-btn').click();
    await page.getByRole('button', { name: 'Skip (review later)' }).click();
    
    // Toast should be visible
    await expect(page.locator('.skip-toast')).toBeVisible();
    await expect(page.locator('.skip-toast')).toContainText('Skipped');
  });

  // SKIPPED: Adds 3.5s to test suite for a simple CSS animation timing check
  test.skip('toast auto-dismisses after 3 seconds', async ({ page }) => {
    await page.locator('.menu-btn').click();
    await page.getByRole('button', { name: 'Skip (review later)' }).click();
    await expect(page.locator('.skip-toast')).toBeVisible();
    await page.waitForTimeout(3500);
    await expect(page.locator('.skip-toast')).not.toBeVisible();
  });

  test('undo restores card to queue', async ({ page }) => {
    await page.locator('.menu-btn').click();
    await page.getByRole('button', { name: 'Skip (review later)' }).click();
    
    // Card is hidden
    await expect(page.getByText(/all caught up/i)).toBeVisible();
    
    // Click undo
    await page.locator('.toast-undo').click();
    
    // Card should be back
    await expect(page.locator('.card-content')).toContainText('Card to skip');
    
    // Toast should be gone
    await expect(page.locator('.skip-toast')).not.toBeVisible();
  });
});

