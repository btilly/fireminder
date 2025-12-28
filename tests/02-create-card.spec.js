// Test 2: Create Card Flow
import { test, expect } from '@playwright/test';
import { waitForDemoLogin, createDeck } from './helpers.js';

test.describe('Create Card Flow', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForDemoLogin(page);
    
    // Ensure a deck exists
    const hasNoDeck = await page.getByText(/welcome/i).isVisible().catch(() => false);
    if (hasNoDeck) {
      await createDeck(page, { name: 'Card Test Deck' });
    }
  });

  test('clicking + opens Add Card panel', async ({ page }) => {
    // Click + in header
    await page.locator('.header-right .icon-btn').first().click();
    
    // Panel should open
    await expect(page.locator('.panel')).toBeVisible();
    await expect(page.getByText('Add Card')).toBeVisible();
    
    // Footer should not be visible (full takeover)
    await expect(page.locator('.footer-tabs')).not.toBeVisible();
  });

  test('can create a card and it appears in queue', async ({ page }) => {
    // Click + in header
    await page.locator('.header-right .icon-btn').first().click();
    
    // Enter card content
    await page.locator('.panel-body textarea').fill('Test card content for review');
    
    // Click Save
    await page.getByRole('button', { name: /save/i }).click();
    
    // Panel should close
    await expect(page.locator('.panel')).not.toBeVisible();
    
    // Card should appear in main review area
    await expect(page.locator('.card-content')).toContainText('Test card content for review');
  });

  test('card shows in review queue with correct count', async ({ page }) => {
    // Create first card
    await page.locator('.header-right .icon-btn').first().click();
    await page.locator('.panel-body textarea').fill('First card');
    await page.getByRole('button', { name: /save/i }).click();
    
    // Create second card
    await page.locator('.header-right .icon-btn').first().click();
    await page.locator('.panel-body textarea').fill('Second card');
    await page.getByRole('button', { name: /save/i }).click();
    
    // Queue status should show correct count
    await expect(page.locator('.queue-status')).toContainText('1 more today');
  });

  test('can select different deck when adding card', async ({ page }) => {
    // Create a second deck first
    await page.locator('.icon-btn').filter({ hasText: '≡' }).click();
    await page.getByRole('button', { name: /new deck/i }).click();
    await page.locator('.form-input').first().fill('Second Deck');
    await page.getByRole('button', { name: /create/i }).click();
    
    // Now open Add Card
    await page.locator('.header-right .icon-btn').first().click();
    
    // Deck dropdown should be visible
    await expect(page.locator('.form-select')).toBeVisible();
    
    // Should contain both decks
    const selectOptions = page.locator('.form-select option');
    await expect(selectOptions).toHaveCount(2);
  });
});

