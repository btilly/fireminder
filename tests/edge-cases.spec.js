// Edge Cases and UX Issues
import { test, expect } from '@playwright/test';
import { waitForDemoLogin, createDeck, createCard, uniqueName } from './helpers.js';

test.describe('Edge Cases', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForDemoLogin(page);
  });

  // ⚠️ UX FINDING: New cards aren't immediately reviewable
  test('new card is scheduled for future, not immediately due', async ({ page }) => {
    await createDeck(page, { name: uniqueName('FutureCard'), interval: 2 });
    await createCard(page, 'This card should be due in 2 days');
    
    // Card was created but NOT showing for review - shows empty state instead
    await expect(page.getByText(/all caught up/i)).toBeVisible();
    
    // Stats show 1 active card scheduled for future
    await expect(page.locator('.stats')).toContainText('1'); // 1 active
    await expect(page.locator('.stats')).toContainText('in 2 days');
  });

  test('empty deck name is rejected', async ({ page }) => {
    // Try to create deck with empty name
    await page.getByRole('button', { name: /create deck/i }).click();
    await page.locator('.form-input').first().fill('');
    await page.locator('.panel-action').click();
    
    // Panel should still be open (creation failed) OR show error
    // Current behavior: panel stays open, nothing happens
    await expect(page.locator('.panel')).toBeVisible();
  });

  test('empty card content is rejected', async ({ page }) => {
    await createDeck(page, { name: uniqueName('EmptyCard') });
    
    // Try to create card with empty content
    await page.locator('.header-right .icon-btn').first().click();
    await page.locator('.panel-body textarea').fill('');
    await page.locator('.panel-action').click();
    
    // Panel should still be open (creation failed)
    await expect(page.locator('.panel')).toBeVisible();
  });

  test('very long card content is handled', async ({ page }) => {
    await createDeck(page, { name: uniqueName('LongContent') });
    
    const longContent = 'A'.repeat(5000); // 5000 characters
    await page.locator('.header-right .icon-btn').first().click();
    await page.locator('.panel-body textarea').fill(longContent);
    await page.locator('.panel-action').click();
    
    // Should create successfully (panel closes)
    await expect(page.locator('.panel')).not.toBeVisible();
  });

  test('special characters in deck name', async ({ page }) => {
    const specialName = uniqueName('Test<>&"\'Deck');
    await createDeck(page, { name: specialName });
    
    // Should show in header
    await expect(page.locator('.header-title')).toContainText('Test');
  });

  test('emoji-only deck name', async ({ page }) => {
    await page.getByRole('button', { name: /create deck/i }).click();
    await page.locator('.form-input').first().fill('🔥🧠💡');
    await page.locator('.panel-action').click();
    
    // Should work
    await expect(page.locator('.header-title')).toContainText('🔥🧠💡');
  });

  test('rapid clicking on Review Done', async ({ page }) => {
    // This test documents potential race condition
    await createDeck(page, { name: uniqueName('RapidClick'), interval: 1 });
    // Can't test without immediate-due cards, documenting as known limitation
  });
});

test.describe('Interval Edge Cases', () => {

  test('starting interval of 1 schedules card for tomorrow', async ({ page }) => {
    await page.goto('/');
    await waitForDemoLogin(page);
    
    await createDeck(page, { name: uniqueName('OneDay'), interval: 1 });
    await createCard(page, 'Due tomorrow');
    
    // Should show "in 1 days" (grammar issue?) or "tomorrow"
    await expect(page.locator('.stats')).toContainText('1');
  });
});

test.describe('Usability Issues', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForDemoLogin(page);
  });

  test('clicking outside dropdown menu closes it', async ({ page }) => {
    await createDeck(page, { name: uniqueName('MenuClose'), interval: 1 });
    await createCard(page, 'Test card');
    
    // Can't test review menu without due card - skip for now
    test.skip();
  });

  test('escape key closes panels', async ({ page }) => {
    // Open new deck panel
    await page.getByRole('button', { name: /create deck/i }).click();
    await expect(page.locator('.panel')).toBeVisible();
    
    // Press Escape
    await page.keyboard.press('Escape');
    
    // Panel should close (UX expectation)
    // If this fails, it's a UX improvement opportunity
    await expect(page.locator('.panel')).not.toBeVisible();
  });

  test('back button behavior with panels open', async ({ page }) => {
    // Open panel
    await page.getByRole('button', { name: /create deck/i }).click();
    
    // Navigate back
    await page.goBack();
    
    // Expected: panel closes, stays on app
    // What actually happens? Let's see...
  });
});

