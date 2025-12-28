// Test 1: First-Time User Flow
import { test, expect } from '@playwright/test';
import { waitForDemoLogin } from './helpers.js';

test.describe('First-Time User Flow', () => {
  
  test('shows welcome message when no decks exist', async ({ page }) => {
    await page.goto('/');
    await waitForDemoLogin(page);
    
    // Should see welcome message
    await expect(page.getByText(/welcome/i)).toBeVisible();
    await expect(page.getByText(/create your first deck/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /create deck/i })).toBeVisible();
  });

  test('can create first deck from welcome screen', async ({ page }) => {
    await page.goto('/');
    await waitForDemoLogin(page);
    
    // Click Create Deck
    await page.getByRole('button', { name: /create deck/i }).click();
    
    // New Deck panel should open
    await expect(page.locator('.panel')).toBeVisible();
    await expect(page.locator('.panel-title')).toHaveText('New Deck');
    
    // Fill form
    await page.locator('.form-input').first().fill('Test Deck');
    await page.locator('.form-input').nth(1).clear();
    await page.locator('.form-input').nth(1).fill('📝');
    
    // Create (use exact match for panel action button)
    await page.locator('.panel-action').click();
    
    // Panel should close
    await expect(page.locator('.panel')).not.toBeVisible();
    
    // Deck should be selected - header shows deck name
    await expect(page.locator('.header-title')).toContainText('Test Deck');
    
    // Should see empty deck state
    await expect(page.getByText(/all caught up/i)).toBeVisible();
    
    // Deck should appear in footer tabs
    await expect(page.locator('.footer-tabs')).toContainText('Test Deck');
  });

  test('deck appears in sidebar after creation', async ({ page }) => {
    await page.goto('/');
    await waitForDemoLogin(page);
    
    // Create a deck first
    await page.getByRole('button', { name: /create deck/i }).click();
    await page.locator('.form-input').first().fill('Sidebar Test');
    await page.locator('.panel-action').click();
    
    // Open sidebar
    await page.locator('.icon-btn').filter({ hasText: '≡' }).click();
    
    // Deck should be in sidebar
    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('.deck-list')).toContainText('Sidebar Test');
  });
});

