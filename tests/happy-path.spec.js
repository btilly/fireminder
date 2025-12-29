// Happy Path: Full User Journey
// Combines: First-time user, create card, review flow, interval controls
import { test, expect } from '@playwright/test';
import { waitForDemoLogin, createCard, uniqueName, timeTravel, futureDate } from './helpers.js';

test.describe('Happy Path: Onboarding → Review', () => {

  test('complete user journey from first deck to first review', async ({ page }) => {
    await page.goto('/');
    await waitForDemoLogin(page);
    
    // === STEP 1: First-time user sees welcome ===
    await expect(page.getByText(/welcome/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /create deck/i })).toBeVisible();
    
    // === STEP 2: Create first deck ===
    const deckName = uniqueName('HappyPath');
    await page.getByRole('button', { name: /create deck/i }).click();
    await expect(page.locator('.panel-title')).toHaveText('New Deck');
    
    await page.locator('.form-input').first().fill(deckName);
    await page.locator('.panel-action').click();
    
    // Panel closes, deck selected
    await expect(page.locator('.panel')).not.toBeVisible();
    await expect(page.locator('.header-title')).toContainText('HappyPath');
    
    // === STEP 3: Empty deck state ===
    await expect(page.getByText(/all caught up/i)).toBeVisible();
    
    // === STEP 4: Create a card ===
    await createCard(page, 'The obstacle is the way');
    
    // Card is scheduled for future (not immediately due)
    await expect(page.getByText(/all caught up/i)).toBeVisible();
    await expect(page.locator('.stats')).toContainText('in 2 days');
    
    // === STEP 5: Time travel to when card is due ===
    await timeTravel(page, futureDate(2));
    
    // Banner shows we're time traveling
    await expect(page.locator('.time-travel-banner')).toBeVisible();
    
    // === STEP 6: Card appears for review ===
    await expect(page.locator('.card-content')).toContainText('The obstacle is the way');
    
    // === STEP 7: Interval controls work ===
    // Default should show 3 days (next Fibonacci after 2)
    await expect(page.locator('.interval-current')).toContainText('3 days');
    
    // Click Shorter - goes to previous Fibonacci (2 → 1 if never reviewed, but may vary)
    await page.locator('.interval-btn').first().click();
    // Just verify the button activates
    await expect(page.locator('.interval-btn').first()).toHaveClass(/active/);
    
    // Click Longer
    await page.locator('.interval-btn').last().click();
    await expect(page.locator('.interval-btn').last()).toHaveClass(/active/);
    
    // === STEP 8: Complete review ===
    await page.getByRole('button', { name: /review done/i }).click();
    
    // Back to empty state
    await expect(page.getByText(/all caught up/i)).toBeVisible();
  });

  test('deck appears in sidebar and footer after creation', async ({ page }) => {
    await page.goto('/');
    await waitForDemoLogin(page);
    
    const deckName = uniqueName('SidebarCheck');
    await page.getByRole('button', { name: /create deck/i }).click();
    await page.locator('.form-input').first().fill(deckName);
    await page.locator('.panel-action').click();
    
    // Check footer
    await expect(page.locator('.footer-tabs')).toContainText('SidebarCheck');
    
    // Check sidebar
    await page.locator('.icon-btn').filter({ hasText: '≡' }).click();
    await expect(page.locator('.deck-list')).toContainText('SidebarCheck');
  });

  test('multiple cards queue correctly', async ({ page }) => {
    await page.goto('/');
    await waitForDemoLogin(page);
    
    // Create deck
    const deckName = uniqueName('QueueTest');
    await page.getByRole('button', { name: /create deck/i }).click();
    await page.locator('.form-input').first().fill(deckName);
    await page.locator('.panel-action').click();
    
    // Create 3 cards
    await createCard(page, 'First card');
    await createCard(page, 'Second card');
    await createCard(page, 'Third card');
    
    // Time travel to see them
    await timeTravel(page, futureDate(2));
    
    // Should show first card
    await expect(page.locator('.card-content')).toContainText('First card');
    
    // Queue shows 2 more
    await expect(page.locator('.queue-status')).toContainText('2 more today');
    
    // Review first
    await page.getByRole('button', { name: /review done/i }).click();
    
    // Second card appears
    await expect(page.locator('.card-content')).toContainText('Second card');
    await expect(page.locator('.queue-status')).toContainText('1 more today');
  });
});

