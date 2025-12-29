// View History Tests
import { test, expect } from '@playwright/test';
import { waitForDemoLogin, createDeck, createCard, uniqueName, timeTravel, futureDate, completeReview } from './helpers.js';

test.describe('View History', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForDemoLogin(page);
    await createDeck(page, { name: uniqueName('HistoryTest'), interval: 2 });
    await createCard(page, 'Card with history');
    await timeTravel(page, futureDate(2));
  });

  test('view history opens from menu', async ({ page }) => {
    await page.locator('.menu-btn').click();
    await page.getByRole('button', { name: /view history/i }).click();
    
    // History panel should open
    await expect(page.locator('.panel')).toBeVisible();
    await expect(page.locator('.panel-title')).toContainText('History');
  });

  test('shows current content', async ({ page }) => {
    await page.locator('.menu-btn').click();
    await page.getByRole('button', { name: /view history/i }).click();
    
    // Should show the card content
    await expect(page.locator('.panel-body')).toContainText('Card with history');
  });

  test('empty history shows message', async ({ page }) => {
    // Card has never been reviewed, so history is empty
    await page.locator('.menu-btn').click();
    await page.getByRole('button', { name: /view history/i }).click();
    
    // Should indicate no history yet
    await expect(page.locator('.panel-body')).toContainText(/no history yet|hasn't been reviewed/i);
  });

  test('history shows after review', async ({ page }) => {
    // Complete a review first
    await completeReview(page);
    
    // Time travel forward again to see the card
    await timeTravel(page, futureDate(5));
    
    // Open history
    await page.locator('.menu-btn').click();
    await page.getByRole('button', { name: /view history/i }).click();
    
    // Should show at least one history entry
    const count = await page.locator('.history-section').count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('close button returns to review', async ({ page }) => {
    await page.locator('.menu-btn').click();
    await page.getByRole('button', { name: /view history/i }).click();
    
    // Close panel
    await page.locator('.panel-header .icon-btn').click();
    
    // Should be back to review screen
    await expect(page.locator('.panel')).not.toBeVisible();
    await expect(page.locator('.card-content')).toBeVisible();
  });
});

