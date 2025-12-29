// Time Travel: Developer feature for testing and demos
import { test, expect } from '@playwright/test';
import { waitForDemoLogin, timeTravel, futureDate, clearTimeTravel } from './helpers.js';

test.describe('Time Travel', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForDemoLogin(page);
  });

  test('setting date shows time travel banner', async ({ page }) => {
    await timeTravel(page, futureDate(5));
    
    // Banner should be visible with the date
    const banner = page.locator('.time-travel-banner');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('Simulating');
  });

  test('sidebar shows time travel controls', async ({ page }) => {
    // Open sidebar
    await page.locator('.icon-btn').filter({ hasText: '≡' }).click();
    
    // Time travel input should exist in Developer section
    await expect(page.locator('input[type="date"]')).toBeVisible();
    await expect(page.getByText('Time Travel')).toBeVisible();
  });

  test('back to today clears simulation', async ({ page }) => {
    // Time travel
    await timeTravel(page, futureDate(5));
    await expect(page.locator('.time-travel-banner')).toBeVisible();
    
    // Click back to today
    await page.locator('.time-travel-banner button').click();
    
    // Banner should disappear
    await expect(page.locator('.time-travel-banner')).not.toBeVisible();
  });

  test('time travel affects card scheduling', async ({ page }) => {
    // This is more of an integration test - covered in happy-path
    // Here we just verify the UI mechanics work
    
    // Open sidebar
    await page.locator('.icon-btn').filter({ hasText: '≡' }).click();
    
    // Time travel input should exist
    await expect(page.locator('input[type="date"]')).toBeVisible();
    
    // Set a date
    await page.fill('input[type="date"]', '2030-01-01');
    await page.press('input[type="date"]', 'Tab');
    
    // Should work with any date
    await expect(page.locator('.time-travel-banner')).toContainText('2030-01-01');
  });
});

