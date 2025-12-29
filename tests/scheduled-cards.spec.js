// Scheduled Cards Tests (Feature #4: Future card queue)
import { test, expect } from '@playwright/test';
import { waitForDemoLogin, createDeck, uniqueName, timeTravel, futureDate } from './helpers.js';

test.describe('Scheduled Cards', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForDemoLogin(page);
    await createDeck(page, { name: uniqueName('ScheduleTest') });
  });

  test('can schedule card for future date', async ({ page }) => {
    // Open add card panel
    await page.locator('.header-right .icon-btn').first().click();
    await page.locator('.panel').waitFor({ state: 'visible' });
    
    // Fill content
    await page.locator('.panel-body textarea.reflection-input').fill('Scheduled card content');
    
    // Set schedule date (7 days in future) - use the one in the panel
    const futureScheduleDate = new Date();
    futureScheduleDate.setDate(futureScheduleDate.getDate() + 7);
    const dateStr = futureScheduleDate.toISOString().split('T')[0];
    await page.locator('.panel-body input[type="date"]').fill(dateStr);
    
    // Save
    await page.locator('.panel-action').click();
    await page.waitForTimeout(500);
    
    // Card should NOT be due today
    await expect(page.getByText(/all caught up/i)).toBeVisible();
  });

  test('scheduled cards appear in SCHEDULED section', async ({ page }) => {
    // Create a scheduled card
    await page.locator('.header-right .icon-btn').first().click();
    await page.locator('.panel').waitFor({ state: 'visible' });
    await page.locator('.panel-body textarea.reflection-input').fill('Future card');
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    await page.locator('.panel-body input[type="date"]').fill(futureDate.toISOString().split('T')[0]);
    
    await page.locator('.panel-action').click();
    await page.waitForTimeout(500);
    
    // Open all cards
    await page.getByRole('button', { name: 'Show all cards' }).click();
    await page.waitForTimeout(500);
    
    // Should see SCHEDULED section
    await expect(page.locator('.cards-section-title').first()).toContainText('SCHEDULED');
    await expect(page.locator('.card-list-item.scheduled')).toContainText('Future card');
  });

  test('scheduled card becomes due after time travel', async ({ page }) => {
    // Create a scheduled card for 3 days out
    await page.locator('.header-right .icon-btn').first().click();
    await page.locator('.panel').waitFor({ state: 'visible' });
    await page.locator('.panel-body textarea.reflection-input').fill('Time travel scheduled');
    
    const scheduleDate = new Date();
    scheduleDate.setDate(scheduleDate.getDate() + 3);
    await page.locator('.panel-body input[type="date"]').fill(scheduleDate.toISOString().split('T')[0]);
    
    await page.locator('.panel-action').click();
    await page.waitForTimeout(500);
    
    // Not due today
    await expect(page.getByText(/all caught up/i)).toBeVisible();
    
    // Time travel 3 days forward
    await timeTravel(page, futureDate(3));
    
    // Now should be due
    await expect(page.locator('.card-content')).toContainText('Time travel scheduled');
  });

  test('reminder field is optional', async ({ page }) => {
    // Open add card panel
    await page.locator('.header-right .icon-btn').first().click();
    await page.locator('.panel').waitFor({ state: 'visible' });
    
    // Reminder textarea should exist
    const reminderField = page.locator('textarea').filter({ hasText: '' }).nth(1);
    await expect(reminderField).toBeVisible();
    
    // Can create card without reminder
    await page.locator('.panel-body textarea.reflection-input').fill('No reminder card');
    await page.locator('.panel-action').click();
    await page.waitForTimeout(500);
    
    // Card created successfully
    await page.getByRole('button', { name: 'Show all cards' }).click();
    await expect(page.locator('.panel-body')).toContainText('No reminder card');
  });

  test('reminder shows on first review', async ({ page }) => {
    // Create card with reminder, scheduled for today (so it's due now-ish)
    await page.locator('.header-right .icon-btn').first().click();
    await page.locator('.panel').waitFor({ state: 'visible' });
    
    await page.locator('.panel-body textarea.reflection-input').fill('Card with reminder');
    
    // Add reminder text (second textarea)
    await page.locator('.panel-body textarea.form-input').fill('Remember: this is important context');
    
    await page.locator('.panel-action').click();
    await page.waitForTimeout(500);
    
    // Time travel to when card is due
    await timeTravel(page, futureDate(2));
    
    // Should see the card
    await expect(page.locator('.card-content')).toContainText('Card with reminder');
    
    // Should see the reminder
    await expect(page.locator('.card-reminder')).toContainText('Remember: this is important context');
  });
});

