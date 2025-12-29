// Settings Panel Tests
import { test, expect } from '@playwright/test';
import { waitForDemoLogin, createDeck, uniqueName } from './helpers.js';

test.describe('Settings Panel', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForDemoLogin(page);
    await createDeck(page, { name: uniqueName('SettingsTest'), interval: 2 });
  });

  test('settings button opens panel', async ({ page }) => {
    // Click settings button (exact match to avoid matching deck name)
    await page.getByRole('button', { name: '⚙ Settings' }).click();
    
    // Panel should open
    await expect(page.locator('.panel')).toBeVisible();
    await expect(page.locator('.panel-title')).toHaveText('Settings');
  });

  test('can edit deck name', async ({ page }) => {
    await page.getByRole('button', { name: '⚙ Settings' }).click();
    
    // Change name
    const nameInput = page.locator('.panel-body input[type="text"]').first();
    await nameInput.clear();
    await nameInput.fill('Renamed Deck');
    
    // Save
    await page.getByRole('button', { name: /done/i }).click();
    
    // Panel closes
    await expect(page.locator('.panel')).not.toBeVisible();
    
    // Header shows new name
    await expect(page.locator('.header-title')).toContainText('Renamed Deck');
  });

  test('can edit starting interval', async ({ page }) => {
    await page.getByRole('button', { name: '⚙ Settings' }).click();
    
    // Find interval input
    const intervalInput = page.locator('.interval-number');
    await intervalInput.clear();
    await intervalInput.fill('5');
    
    // Save
    await page.getByRole('button', { name: /done/i }).click();
    
    // Verify by reopening settings
    await page.getByRole('button', { name: '⚙ Settings' }).click();
    await expect(page.locator('.interval-number')).toHaveValue('5');
  });

  test('can delete deck with confirmation', async ({ page }) => {
    // Set up dialog handler
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Delete');
      await dialog.accept();
    });
    
    await page.getByRole('button', { name: '⚙ Settings' }).click();
    
    // Click delete
    await page.getByRole('button', { name: /delete deck/i }).click();
    
    // Should return to welcome screen (no decks)
    await expect(page.getByText(/welcome/i)).toBeVisible();
  });

  test('cancel closes without saving', async ({ page }) => {
    await page.getByRole('button', { name: '⚙ Settings' }).click();
    
    // Change name but don't save
    const nameInput = page.locator('.panel-body input[type="text"]').first();
    const originalName = await nameInput.inputValue();
    await nameInput.clear();
    await nameInput.fill('Should Not Save');
    
    // Click X to close
    await page.locator('.panel-header .icon-btn').click();
    
    // Reopen and verify original name
    await page.getByRole('button', { name: '⚙ Settings' }).click();
    await expect(page.locator('.panel-body input[type="text"]').first()).toHaveValue(originalName);
  });
});

