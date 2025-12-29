// Reflections Tests (Feature #7: Hide reflections by default)
import { test, expect } from '@playwright/test';
import { waitForDemoLogin, createDeck, createCard, uniqueName, timeTravel, futureDate } from './helpers.js';

test.describe('Reflections', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForDemoLogin(page);
    // Default interval is 2 days (helper doesn't actually set interval)
    await createDeck(page, { name: uniqueName('ReflectionTest') });
  });

  test('reflections are hidden by default', async ({ page }) => {
    await createCard(page, 'Card for reflection test');
    
    // Time travel 2 days to make card due (default interval is 2)
    await timeTravel(page, futureDate(2));
    
    // Complete a review with reflection
    await page.locator('.reflection-input').fill('My first reflection');
    await page.getByRole('button', { name: /done|complete/i }).click();
    await page.waitForTimeout(500);
    
    // Time travel again for next review (interval was 2, so now it's 3)
    await timeTravel(page, futureDate(5));
    
    // Card should be showing, but reflection should be hidden
    await expect(page.locator('.card-content')).toContainText('Card for reflection test');
    
    // Should see "Show past reflection(s)" button, not the reflection itself
    await expect(page.locator('.reflections-reveal')).toBeVisible();
    await expect(page.locator('.reflections-reveal')).toContainText('Show');
    
    // Reflection text should NOT be visible yet
    await expect(page.locator('.reflection-text')).not.toBeVisible();
  });

  test('clicking show reveals reflections', async ({ page }) => {
    await createCard(page, 'Card to reveal reflection');
    
    // Time travel 2 days to make card due
    await timeTravel(page, futureDate(2));
    await page.locator('.reflection-input').fill('Hidden reflection');
    await page.getByRole('button', { name: /done|complete/i }).click();
    await page.waitForTimeout(500);
    
    // Time travel for next review
    await timeTravel(page, futureDate(5));
    
    // Click show button
    await page.locator('.reflections-reveal').click();
    
    // Now should see the reflection
    await expect(page.locator('.reflection-text')).toBeVisible();
    await expect(page.locator('.reflection-text')).toContainText('Hidden reflection');
  });

  test('can hide reflections after showing', async ({ page }) => {
    await createCard(page, 'Card to hide reflection');
    
    // Time travel 2 days to make card due
    await timeTravel(page, futureDate(2));
    await page.locator('.reflection-input').fill('Will be hidden again');
    await page.getByRole('button', { name: /done|complete/i }).click();
    await page.waitForTimeout(500);
    
    // Time travel for next review
    await timeTravel(page, futureDate(5));
    
    // Show reflections
    await page.locator('.reflections-reveal').click();
    await expect(page.locator('.reflection-text')).toBeVisible();
    
    // Click hide button
    await page.getByRole('button', { name: /hide/i }).click();
    
    // Reflection should be hidden again
    await expect(page.locator('.reflection-text')).not.toBeVisible();
    await expect(page.locator('.reflections-reveal')).toBeVisible();
  });

  test('no reflection UI shown when card has no history', async ({ page }) => {
    await createCard(page, 'Brand new card');
    
    // Time travel to make card due
    await timeTravel(page, futureDate(2));
    
    // Should see the card
    await expect(page.locator('.card-content')).toContainText('Brand new card');
    
    // Should NOT see any reflection controls
    await expect(page.locator('.reflections-reveal')).not.toBeVisible();
    await expect(page.locator('.past-reflections')).not.toBeVisible();
  });
});

