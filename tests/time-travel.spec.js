// Time Travel: Developer feature for testing and demos
import { test, expect } from '@playwright/test';
import { waitForDemoLogin, timeTravel, futureDate, clearTimeTravel, createDeck, createCard } from './helpers.js';

test.describe('Time Travel', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForDemoLogin(page);
  });

  test('setting date shows time travel banner', async ({ page }) => {
    await timeTravel(page, futureDate(5));
    
    // Banner should be visible with the date
    const banner = page.locator('.time-travel-banner');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('Simulating');
  });

  test('sidebar shows time travel controls', async ({ page }) => {
    // Open sidebar
    await page.locator('.icon-btn').filter({ hasText: '≡' }).click();
    
    // Time travel input should exist in Developer section
    await expect(page.locator('input[type="date"]')).toBeVisible();
    await expect(page.getByText('Time Travel')).toBeVisible();
  });

  test('back to today clears simulation', async ({ page }) => {
    // Time travel
    await timeTravel(page, futureDate(5));
    await expect(page.locator('.time-travel-banner')).toBeVisible();
    
    // Click back to today
    await page.locator('.time-travel-banner button').click();
    
    // Modal should appear with options
    await expect(page.locator('.modal')).toBeVisible();
    await expect(page.getByText('Return to Today')).toBeVisible();
    
    // Click "Keep Changes" to close
    await page.getByRole('button', { name: 'Keep Changes' }).click();
    
    // Banner should disappear
    await expect(page.locator('.time-travel-banner')).not.toBeVisible();
  });
  
  test('discard changes removes cards created during time travel', async ({ page }) => {
    // Create a deck first
    await createDeck(page, { name: 'DiscardTest' });
    
    // Time travel to the future
    await timeTravel(page, futureDate(5));
    
    // Create a card while time traveling
    await createCard(page, 'Time travel card');
    
    // Click back to today
    await page.locator('.time-travel-banner button').click();
    
    // Modal should appear
    await expect(page.locator('.modal')).toBeVisible();
    
    // Click "Discard Changes"
    await page.getByRole('button', { name: 'Discard Changes' }).click();
    
    // Wait for deletion to complete and UI to update
    await page.waitForTimeout(1000);
    
    // Banner should disappear
    await expect(page.locator('.time-travel-banner')).not.toBeVisible();
    
    // Reload page to ensure fresh data from Firebase
    await page.reload();
    await page.waitForTimeout(1000);
    
    // The card we created should be gone - show all cards should show 0
    await page.getByRole('button', { name: 'Show all cards' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('.panel-body')).toContainText(/no cards|ACTIVE \(0\)/i);
  });

  // REMOVED: "time travel affects card scheduling" - redundant with queue-priority tests
});

