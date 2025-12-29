// Move to Deck Tests
import { test, expect } from '@playwright/test';
import { waitForDemoLogin, createDeck, createCard, uniqueName, timeTravel, futureDate } from './helpers.js';

test.describe('Move to Deck', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForDemoLogin(page);
    
    // Create two decks
    await createDeck(page, { name: uniqueName('SourceDeck'), interval: 2 });
    
    // Create second deck via sidebar
    await page.locator('.icon-btn').filter({ hasText: '≡' }).click();
    await page.getByRole('button', { name: /new deck/i }).click();
    await page.locator('.form-input').first().fill(uniqueName('TargetDeck'));
    await page.locator('.panel-action').click();
    await page.waitForTimeout(500);
    
    // Switch back to first deck and create a card
    await page.locator('.icon-btn').filter({ hasText: '≡' }).click();
    await page.locator('.deck-item').first().click();
    await page.waitForTimeout(300);
    
    await createCard(page, 'Card to move');
    await timeTravel(page, futureDate(2));
  });

  test('move to deck opens modal from menu', async ({ page }) => {
    await page.locator('.menu-btn').click();
    await page.getByRole('button', { name: /move to deck/i }).click();
    
    // Modal should appear
    await expect(page.locator('.modal')).toBeVisible();
    await expect(page.locator('.modal-header')).toContainText('Move Card');
  });

  test('current deck is disabled in modal', async ({ page }) => {
    await page.locator('.menu-btn').click();
    await page.getByRole('button', { name: /move to deck/i }).click();
    
    // Find the disabled radio button (current deck)
    const disabledOption = page.locator('.deck-option input:disabled');
    await expect(disabledOption).toHaveCount(1);
  });

  test('can move card to different deck', async ({ page }) => {
    await page.locator('.menu-btn').click();
    await page.getByRole('button', { name: /move to deck/i }).click();
    
    // Select the other deck (the enabled one)
    await page.locator('.deck-option input:not(:disabled)').click();
    
    // Click Move
    await page.getByRole('button', { name: 'Move' }).click();
    
    // Modal closes
    await expect(page.locator('.modal')).not.toBeVisible();
    
    // Card should be gone from current deck
    await expect(page.getByText(/all caught up/i)).toBeVisible();
  });

  test('cancel closes modal without moving', async ({ page }) => {
    await page.locator('.menu-btn').click();
    await page.getByRole('button', { name: /move to deck/i }).click();
    
    // Click cancel
    await page.getByRole('button', { name: /cancel/i }).click();
    
    // Modal closes
    await expect(page.locator('.modal')).not.toBeVisible();
    
    // Card still in review
    await expect(page.locator('.card-content')).toContainText('Card to move');
  });
});

