// Test 9: Sidebar Navigation
import { test, expect } from '@playwright/test';
import { waitForDemoLogin } from './helpers.js';

test.describe('Sidebar Navigation', () => {

  test('hamburger menu opens sidebar', async ({ page }) => {
    await page.goto('/');
    await waitForDemoLogin(page);
    
    // Click hamburger menu
    await page.locator('.icon-btn').filter({ hasText: '≡' }).click();
    
    // Sidebar should be visible
    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('.sidebar')).toHaveClass(/open/);
    
    // Overlay should be visible
    await expect(page.locator('.sidebar-overlay')).toBeVisible();
  });

  test('sidebar shows section title and new deck button', async ({ page }) => {
    await page.goto('/');
    await waitForDemoLogin(page);
    
    // Open sidebar
    await page.locator('.icon-btn').filter({ hasText: '≡' }).click();
    
    // Should show "My Decks" section
    await expect(page.locator('.sidebar-section-title').first()).toHaveText(/my decks/i);
    
    // Should have "+ New Deck" button
    await expect(page.locator('.new-deck-btn')).toBeVisible();
    await expect(page.locator('.new-deck-btn')).toContainText('New Deck');
  });

  test('clicking overlay closes sidebar', async ({ page }) => {
    await page.goto('/');
    await waitForDemoLogin(page);
    
    // Open sidebar
    await page.locator('.icon-btn').filter({ hasText: '≡' }).click();
    await expect(page.locator('.sidebar')).toHaveClass(/open/);
    
    // Click overlay
    await page.locator('.sidebar-overlay').click();
    
    // Sidebar should close
    await expect(page.locator('.sidebar')).not.toHaveClass(/open/);
  });

  test('clicking X closes sidebar', async ({ page }) => {
    await page.goto('/');
    await waitForDemoLogin(page);
    
    // Open sidebar
    await page.locator('.icon-btn').filter({ hasText: '≡' }).click();
    await expect(page.locator('.sidebar')).toHaveClass(/open/);
    
    // Click X button in sidebar header
    await page.locator('.sidebar-header .icon-btn').click();
    
    // Sidebar should close
    await expect(page.locator('.sidebar')).not.toHaveClass(/open/);
  });
});

