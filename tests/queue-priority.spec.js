// Queue Priority: Overdue cards appear first
import { test, expect } from '@playwright/test';
import { waitForDemoLogin, createDeck, createCard, uniqueName, timeTravel, futureDate, completeReview } from './helpers.js';

test.describe('Queue Priority', () => {

  test('cards not due are hidden until time travel', async ({ page }) => {
    await page.goto('/');
    await waitForDemoLogin(page);
    
    // Create deck with 2-day interval
    await createDeck(page, { name: uniqueName('Priority'), interval: 2 });
    
    // Create a card
    await createCard(page, 'Future card');
    
    // Card is NOT visible today (scheduled for future)
    await expect(page.getByText(/all caught up/i)).toBeVisible();
    
    // Time travel to when it's due
    await timeTravel(page, futureDate(2));
    
    // Now the card should appear
    await expect(page.locator('.card-content')).toContainText('Future card');
  });

  test('queue count reflects all due cards', async ({ page }) => {
    await page.goto('/');
    await waitForDemoLogin(page);
    
    await createDeck(page, { name: uniqueName('QueueCount'), interval: 2 });
    
    // Create 3 cards
    await createCard(page, 'Card 1');
    await createCard(page, 'Card 2');
    await createCard(page, 'Card 3');
    
    // Time travel to when all are due
    await timeTravel(page, futureDate(2));
    
    // Should show 2 more (current + 2)
    await expect(page.locator('.queue-status')).toContainText('2 more today');
    
    // Review one
    await completeReview(page);
    
    // Should show 1 more
    await expect(page.locator('.queue-status')).toContainText('1 more today');
  });
});


  test('card created today is due after starting interval', async ({ page }) => {
    await page.goto('/');
    await waitForDemoLogin(page);
    
    // Create deck with 2-day interval
    await createDeck(page, { name: uniqueName('IntervalBug'), interval: 2 });
    
    // Create a card today
    await createCard(page, 'Should be due in 2 days');
    
    // Verify it's NOT due today
    await expect(page.getByText(/all caught up/i)).toBeVisible();
    
    // Time travel exactly 2 days forward (Dec 28 → Dec 30)
    await timeTravel(page, futureDate(2));
    
    // Card SHOULD be due now - this is the bug!
    await expect(page.locator('.card-content')).toContainText('Should be due in 2 days');
  });

  test('BUG: time travel to Dec 30 shows card created Dec 28', async ({ page }) => {
    await page.goto('/');
    await waitForDemoLogin(page);
    
    // Create deck with 2-day interval
    await createDeck(page, { name: uniqueName('Dec30Bug'), interval: 2 });
    
    // Create card (today is Dec 28)
    await createCard(page, 'Dec 28 card');
    
    // Time travel to exactly Dec 30, 2025
    await timeTravel(page, '2025-12-30');
    
    // Should show the card
    await expect(page.locator('.card-content')).toContainText('Dec 28 card');
  });
