// Card Actions: Rephrase, Retire, Delete
import { test, expect } from '@playwright/test';
import { waitForDemoLogin, createDeck, createCard, uniqueName, timeTravel, futureDate } from './helpers.js';

test.describe('Card Actions', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForDemoLogin(page);
    await createDeck(page, { name: uniqueName('CardActions') });
    await createCard(page, 'Test action card');
    // Time travel to see the card
    await timeTravel(page, futureDate(2));
  });

  test('menu opens and shows all actions', async ({ page }) => {
    await page.locator('.menu-btn').click();
    
    const menu = page.locator('.dropdown-menu');
    await expect(menu).toBeVisible();
    await expect(menu).toContainText(/rephrase/i);
    await expect(menu).toContainText(/retire/i);
    await expect(menu).toContainText(/delete/i);
  });

  test('rephrase: edit and save updates card', async ({ page }) => {
    // Open menu and click rephrase
    await page.locator('.menu-btn').click();
    await page.getByRole('button', { name: /rephrase/i }).click();
    
    // Should be in edit mode
    await expect(page.getByText(/editing/i)).toBeVisible();
    
    // Modify content
    const textarea = page.locator('.card-editing textarea');
    await textarea.clear();
    await textarea.fill('Updated content');
    
    // Save
    await page.getByRole('button', { name: /save edit/i }).click();
    
    // Card reviewed and gone
    await expect(page.getByText(/all caught up/i)).toBeVisible();
  });

  test('rephrase: cancel preserves original', async ({ page }) => {
    await page.locator('.menu-btn').click();
    await page.getByRole('button', { name: /rephrase/i }).click();
    
    // Modify
    const textarea = page.locator('.card-editing textarea');
    await textarea.clear();
    await textarea.fill('Should not save');
    
    // Cancel
    await page.getByRole('button', { name: /cancel/i }).click();
    
    // Original content still there
    await expect(page.locator('.card-content')).toContainText('Test action card');
    await expect(page.getByRole('button', { name: /review done/i })).toBeVisible();
  });

  test('retire removes card permanently', async ({ page }) => {
    await page.locator('.menu-btn').click();
    await page.getByRole('button', { name: /retire/i }).click();
    
    // Card gone
    await expect(page.getByText(/all caught up/i)).toBeVisible();
  });

  test('delete with confirmation removes card', async ({ page }) => {
    // Set up dialog handler
    page.on('dialog', async dialog => {
      await dialog.accept();
    });
    
    await page.locator('.menu-btn').click();
    await page.getByRole('button', { name: /delete/i }).click();
    
    // Card gone
    await expect(page.getByText(/all caught up/i)).toBeVisible();
  });

  test('delete cancelled keeps card', async ({ page }) => {
    // Set up dialog handler to dismiss
    page.on('dialog', async dialog => {
      await dialog.dismiss();
    });
    
    await page.locator('.menu-btn').click();
    await page.getByRole('button', { name: /delete/i }).click();
    
    // Card still there
    await expect(page.locator('.card-content')).toContainText('Test action card');
  });
});

