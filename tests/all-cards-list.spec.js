// All Cards List Tests
import { test, expect } from '@playwright/test';
import { waitForDemoLogin, createDeck, createCard, uniqueName, timeTravel, futureDate } from './helpers.js';

test.describe('All Cards List', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForDemoLogin(page);
    await createDeck(page, { name: uniqueName('AllCardsTest'), interval: 2 });
  });

  test('show all cards button opens panel with cards', async ({ page }) => {
    await createCard(page, 'Test card for list');
    
    // Click "Show all cards" button
    await page.locator('button:has-text("Show all cards")').click();
    await page.waitForTimeout(500);
    
    // Should see the panel with card content
    await expect(page.locator('.panel-title')).toContainText('All Cards');
    await expect(page.locator('.panel-body')).toContainText('Test card for list');
  });

  test('empty deck shows active count of 0', async ({ page }) => {
    // No cards created
    await page.getByRole('button', { name: 'Show all cards' }).click();
    await page.waitForTimeout(500);
    
    // Should show ACTIVE (0)
    await expect(page.locator('.cards-section-title')).toContainText('ACTIVE (0)');
  });

  test('card list shows due date', async ({ page }) => {
    await createCard(page, 'Card with due date');
    
    await page.getByRole('button', { name: 'Show all cards' }).click();
    await page.waitForTimeout(500);
    
    // Should show due info
    await expect(page.locator('.card-list-due')).toContainText(/Due:|in \d+ days/);
  });

  test('clicking card opens detail view', async ({ page }) => {
    await createCard(page, 'Card for detail');
    
    await page.getByRole('button', { name: 'Show all cards' }).click();
    await page.waitForTimeout(500);
    
    // Click on the card
    await page.locator('.card-list-item').first().click();
    await page.waitForTimeout(300);
    
    // Should open detail view (different panel)
    await expect(page.locator('.panel-title')).toContainText('Card Detail');
  });
  
  test('can edit card from detail view', async ({ page }) => {
    await createCard(page, 'Original content');
    
    // Open all cards and click on card
    await page.getByRole('button', { name: 'Show all cards' }).click();
    await page.waitForTimeout(500);
    await page.locator('.card-list-item').first().click();
    await page.waitForTimeout(300);
    
    // Should see Card Detail
    await expect(page.locator('.panel-title')).toContainText('Card Detail');
    await expect(page.locator('.detail-content')).toContainText('Original content');
    
    // Click Edit
    await page.locator('.panel-action').click();
    
    // Should see textarea with content
    await expect(page.locator('.edit-textarea')).toBeVisible();
    
    // Clear and type new content
    await page.locator('.edit-textarea').fill('Updated content');
    
    // Click Save
    await page.locator('.panel-action').click();
    await page.waitForTimeout(500);
    
    // Should show updated content (exit edit mode)
    await expect(page.locator('.detail-content')).toContainText('Updated content');
    await expect(page.locator('.edit-textarea')).not.toBeVisible();
  });
  
  test('cancel edit preserves original content', async ({ page }) => {
    await createCard(page, 'Keep this content');
    
    // Open all cards and click on card
    await page.getByRole('button', { name: 'Show all cards' }).click();
    await page.waitForTimeout(500);
    await page.locator('.card-list-item').first().click();
    await page.waitForTimeout(300);
    
    // Click Edit
    await page.locator('.panel-action').click();
    
    // Type something different
    await page.locator('.edit-textarea').fill('Changed content');
    
    // Click Cancel
    await page.getByRole('button', { name: 'Cancel' }).click();
    
    // Original content should be preserved
    await expect(page.locator('.detail-content')).toContainText('Keep this content');
  });
});
