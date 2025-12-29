// Test 3 & 4: Review Flow + Interval Controls
import { test, expect } from '@playwright/test';
import { waitForDemoLogin, createDeck, createCard, uniqueName } from './helpers.js';

test.describe('Review Flow', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForDemoLogin(page);
  });

  test('reviewing card removes it from queue', async ({ page }) => {
    // Setup: create deck and card
    await createDeck(page, { name: uniqueName('ReviewTest') });
    await createCard(page, 'Card to review');
    
    // Verify card is showing
    await expect(page.locator('.card-content')).toContainText('Card to review');
    
    // Complete review
    await page.getByRole('button', { name: /review done/i }).click();
    
    // Should show empty state
    await expect(page.getByText(/all caught up/i)).toBeVisible();
  });

  test('queue count decrements after review', async ({ page }) => {
    // Setup: create deck and multiple cards
    await createDeck(page, { name: uniqueName('CountTest') });
    await createCard(page, 'First card');
    await createCard(page, 'Second card');
    await createCard(page, 'Third card');
    
    // Should show "2 more today"
    await expect(page.locator('.queue-status')).toContainText('2 more today');
    
    // Review first card
    await page.getByRole('button', { name: /review done/i }).click();
    
    // Should now show "1 more today"
    await expect(page.locator('.queue-status')).toContainText('1 more today');
  });

  test('next card appears after reviewing current', async ({ page }) => {
    await createDeck(page, { name: uniqueName('NextCardTest') });
    await createCard(page, 'First card content');
    await createCard(page, 'Second card content');
    
    // First card showing
    await expect(page.locator('.card-content')).toContainText('First card');
    
    // Review it
    await page.getByRole('button', { name: /review done/i }).click();
    
    // Second card should now show
    await expect(page.locator('.card-content')).toContainText('Second card');
  });
});

test.describe('Interval Controls', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForDemoLogin(page);
    await createDeck(page, { name: uniqueName('IntervalTest'), interval: 2 });
    await createCard(page, 'Test interval card');
  });

  test('default interval shows next Fibonacci step', async ({ page }) => {
    // Starting interval is 2, so default next should be 3
    await expect(page.locator('.interval-current')).toContainText('3 days');
  });

  test('clicking Shorter decreases interval', async ({ page }) => {
    // Click Shorter
    await page.locator('.interval-btn').first().click();
    
    // Should show 2 days (current interval, not advancing)
    await expect(page.locator('.interval-current')).toContainText('2 days');
    
    // Button should be active
    await expect(page.locator('.interval-btn').first()).toHaveClass(/active/);
  });

  test('clicking Longer increases interval', async ({ page }) => {
    // Click Longer
    await page.locator('.interval-btn').last().click();
    
    // Should show 5 days (skip one ahead)
    await expect(page.locator('.interval-current')).toContainText('5 days');
  });

  test('clicking active button deselects it', async ({ page }) => {
    // Click Shorter to activate
    await page.locator('.interval-btn').first().click();
    await expect(page.locator('.interval-btn').first()).toHaveClass(/active/);
    
    // Click again to deselect
    await page.locator('.interval-btn').first().click();
    await expect(page.locator('.interval-btn').first()).not.toHaveClass(/active/);
    
    // Should return to default
    await expect(page.locator('.interval-current')).toContainText('3 days');
  });

  test('Shorter and Longer are mutually exclusive', async ({ page }) => {
    // Click Shorter
    await page.locator('.interval-btn').first().click();
    await expect(page.locator('.interval-btn').first()).toHaveClass(/active/);
    
    // Click Longer - Shorter should deactivate
    await page.locator('.interval-btn').last().click();
    await expect(page.locator('.interval-btn').first()).not.toHaveClass(/active/);
    await expect(page.locator('.interval-btn').last()).toHaveClass(/active/);
  });
});

