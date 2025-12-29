// Test 5-8: Card Actions (Rephrase, Cancel, Retire, Delete)
import { test, expect } from '@playwright/test';
import { waitForDemoLogin, createDeck, createCard, uniqueName } from './helpers.js';

test.describe('Rephrase Card', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForDemoLogin(page);
    await createDeck(page, { name: uniqueName('RephraseTest') });
    await createCard(page, 'Original content');
  });

  test('menu opens on ••• click', async ({ page }) => {
    await page.locator('.menu-btn').click();
    await expect(page.locator('.dropdown-menu')).toBeVisible();
  });

  test('clicking Rephrase enters edit mode', async ({ page }) => {
    await page.locator('.menu-btn').click();
    await page.getByRole('button', { name: /rephrase/i }).click();
    
    // Should show editing indicator
    await expect(page.getByText(/editing/i)).toBeVisible();
    
    // Should have Save Edit button
    await expect(page.getByRole('button', { name: /save edit/i })).toBeVisible();
    
    // Should have Cancel button
    await expect(page.getByRole('button', { name: /cancel/i })).toBeVisible();
  });

  test('saving edit updates card content', async ({ page }) => {
    await page.locator('.menu-btn').click();
    await page.getByRole('button', { name: /rephrase/i }).click();
    
    // Clear and type new content
    const textarea = page.locator('.card-editing textarea');
    await textarea.clear();
    await textarea.fill('Updated content');
    
    // Save
    await page.getByRole('button', { name: /save edit/i }).click();
    
    // Card should be reviewed and gone from queue
    await expect(page.getByText(/all caught up/i)).toBeVisible();
  });
});

test.describe('Cancel Edit', () => {

  test('cancel restores original content and exits edit mode', async ({ page }) => {
    await page.goto('/');
    await waitForDemoLogin(page);
    await createDeck(page, { name: uniqueName('CancelTest') });
    await createCard(page, 'Do not change this');
    
    // Enter edit mode
    await page.locator('.menu-btn').click();
    await page.getByRole('button', { name: /rephrase/i }).click();
    
    // Modify content
    const textarea = page.locator('.card-editing textarea');
    await textarea.clear();
    await textarea.fill('This should not be saved');
    
    // Cancel
    await page.getByRole('button', { name: /cancel/i }).click();
    
    // Should exit edit mode
    await expect(page.getByText(/editing/i)).not.toBeVisible();
    
    // Original content should be shown
    await expect(page.locator('.card-content')).toContainText('Do not change this');
    
    // Review Done button should be back
    await expect(page.getByRole('button', { name: /review done/i })).toBeVisible();
  });
});

test.describe('Retire Card', () => {

  test('retiring card removes it from queue', async ({ page }) => {
    await page.goto('/');
    await waitForDemoLogin(page);
    await createDeck(page, { name: uniqueName('RetireTest') });
    await createCard(page, 'Card to retire');
    
    // Open menu and retire
    await page.locator('.menu-btn').click();
    await page.getByRole('button', { name: /retire/i }).click();
    
    // Should show empty state
    await expect(page.getByText(/all caught up/i)).toBeVisible();
  });

  test('retired count increases in stats', async ({ page }) => {
    await page.goto('/');
    await waitForDemoLogin(page);
    await createDeck(page, { name: uniqueName('RetireStatsTest') });
    await createCard(page, 'Card to retire');
    
    // Retire the card
    await page.locator('.menu-btn').click();
    await page.getByRole('button', { name: /retire/i }).click();
    
    // Check stats show 1 retired
    await expect(page.locator('.stats')).toContainText('1');
  });
});

test.describe('Delete Card', () => {

  test('delete shows confirmation dialog', async ({ page }) => {
    await page.goto('/');
    await waitForDemoLogin(page);
    await createDeck(page, { name: uniqueName('DeleteTest') });
    await createCard(page, 'Card to delete');
    
    // Set up dialog handler BEFORE triggering it
    page.on('dialog', async dialog => {
      expect(dialog.type()).toBe('confirm');
      expect(dialog.message()).toContain('Delete');
      await dialog.accept();
    });
    
    // Open menu and delete
    await page.locator('.menu-btn').click();
    await page.getByRole('button', { name: /delete/i }).click();
    
    // After confirming, card should be gone
    await expect(page.getByText(/all caught up/i)).toBeVisible();
  });

  test('canceling delete keeps card', async ({ page }) => {
    await page.goto('/');
    await waitForDemoLogin(page);
    await createDeck(page, { name: uniqueName('DeleteCancelTest') });
    await createCard(page, 'Do not delete me');
    
    // Set up dialog handler to dismiss
    page.on('dialog', async dialog => {
      await dialog.dismiss();
    });
    
    // Open menu and try to delete
    await page.locator('.menu-btn').click();
    await page.getByRole('button', { name: /delete/i }).click();
    
    // Card should still be there
    await expect(page.locator('.card-content')).toContainText('Do not delete me');
  });
});

