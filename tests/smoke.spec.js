// Smoke Tests: Sidebar, Theme, Sign Out
import { test, expect } from '@playwright/test';
import { waitForDemoLogin, createDeck, uniqueName } from './helpers.js';

test.describe('Sidebar Navigation', () => {

  test('hamburger opens sidebar, overlay closes it', async ({ page }) => {
    await page.goto('/');
    await waitForDemoLogin(page);
    
    // Open sidebar
    await page.locator('.icon-btn').filter({ hasText: '≡' }).click();
    await expect(page.locator('.sidebar')).toHaveClass(/open/);
    await expect(page.locator('.sidebar-overlay')).toBeVisible();
    
    // Close via overlay
    await page.locator('.sidebar-overlay').click();
    await expect(page.locator('.sidebar')).not.toHaveClass(/open/);
  });

  test('X button closes sidebar', async ({ page }) => {
    await page.goto('/');
    await waitForDemoLogin(page);
    
    await page.locator('.icon-btn').filter({ hasText: '≡' }).click();
    await expect(page.locator('.sidebar')).toHaveClass(/open/);
    
    await page.locator('.sidebar-header .icon-btn').click();
    await expect(page.locator('.sidebar')).not.toHaveClass(/open/);
  });

  test('sidebar shows My Decks section with New Deck button', async ({ page }) => {
    await page.goto('/');
    await waitForDemoLogin(page);
    
    await page.locator('.icon-btn').filter({ hasText: '≡' }).click();
    
    await expect(page.getByText('My Decks', { exact: true })).toBeVisible();
    await expect(page.locator('.new-deck-btn')).toBeVisible();
  });

  test('clicking deck in sidebar switches to it', async ({ page }) => {
    await page.goto('/');
    await waitForDemoLogin(page);
    
    // Create two decks
    await createDeck(page, { name: uniqueName('DeckA') });
    
    await page.locator('.icon-btn').filter({ hasText: '≡' }).click();
    await page.getByRole('button', { name: /new deck/i }).click();
    await page.locator('.form-input').first().fill(uniqueName('DeckB'));
    await page.locator('.panel-action').click();
    await page.waitForTimeout(300);
    
    // Currently on DeckB, switch to DeckA via sidebar
    await page.locator('.icon-btn').filter({ hasText: '≡' }).click();
    await page.locator('.deck-list .deck-item').first().click();
    
    // Header should show DeckA
    await expect(page.locator('.header-title')).toContainText('DeckA');
  });
});

test.describe('Theme Switcher', () => {

  test('theme can be changed via sidebar', async ({ page }) => {
    await page.goto('/');
    await waitForDemoLogin(page);
    
    // Open sidebar
    await page.locator('.icon-btn').filter({ hasText: '≡' }).click();
    
    // Theme swatches should be visible
    await expect(page.locator('.theme-swatch')).toHaveCount(6);
    
    // Click dark theme (2nd swatch)
    await page.locator('.theme-swatch').nth(1).click();
    
    // HTML element should have theme attribute
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('theme persists after refresh', async ({ page }) => {
    await page.goto('/');
    await waitForDemoLogin(page);
    
    // Open sidebar and change theme to ocean (3rd)
    await page.locator('.icon-btn').filter({ hasText: '≡' }).click();
    await page.locator('.theme-swatch').nth(2).click();
    
    // Refresh
    await page.reload();
    await waitForDemoLogin(page);
    
    // Theme should persist
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ocean');
  });
});

test.describe('Sign Out', () => {

  test('sign out returns to sign-in screen', async ({ page }) => {
    await page.goto('/');
    await waitForDemoLogin(page);
    
    // Ensure we're logged in (create a deck first)
    await createDeck(page, { name: uniqueName('SignOutTest') });
    
    // Open sidebar
    await page.locator('.icon-btn').filter({ hasText: '≡' }).click();
    
    // Click Sign Out
    await page.getByRole('button', { name: /sign out/i }).click();
    
    // Should see sign-in prompt
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });
});

test.describe('Edge Cases', () => {

  test('empty deck name is rejected', async ({ page }) => {
    await page.goto('/');
    await waitForDemoLogin(page);
    
    await page.getByRole('button', { name: /create deck/i }).click();
    await page.locator('.form-input').first().fill('');
    await page.locator('.panel-action').click();
    
    // Panel should stay open (creation blocked)
    await expect(page.locator('.panel')).toBeVisible();
  });

  test('panel can be closed via X button', async ({ page }) => {
    await page.goto('/');
    await waitForDemoLogin(page);
    
    await page.getByRole('button', { name: /create deck/i }).click();
    await expect(page.locator('.panel')).toBeVisible();
    
    // Close via X button in panel header
    await page.locator('.panel-header .icon-btn').click();
    await expect(page.locator('.panel')).not.toBeVisible();
  });

  test('unicode in deck names works', async ({ page }) => {
    await page.goto('/');
    await waitForDemoLogin(page);
    
    await page.getByRole('button', { name: /create deck/i }).click();
    await page.locator('.form-input').first().fill('日本語テスト');
    await page.locator('.panel-action').click();
    
    await expect(page.locator('.header-title')).toContainText('日本語テスト');
  });
});

