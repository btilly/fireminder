// Import/Export Tests
import { test, expect } from '@playwright/test';
import { waitForDemoLogin, createDeck, createCard, uniqueName } from './helpers.js';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Export Deck', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForDemoLogin(page);
  });

  test('export button downloads markdown file', async ({ page }) => {
    const deckName = uniqueName('ExportTest');
    await createDeck(page, { name: deckName });
    await createCard(page, 'Test card for export');
    
    // Open settings (button is visible in deck view)
    await page.getByRole('button', { name: '⚙ Settings' }).click();
    await page.waitForTimeout(300);
    
    // Start waiting for download before clicking
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /export deck/i }).click();
    
    const download = await downloadPromise;
    
    // Verify filename contains deck name
    expect(download.suggestedFilename()).toContain('export.md');
  });

  test('exported file contains deck info and cards', async ({ page }) => {
    const deckName = uniqueName('ExportContent');
    await createDeck(page, { name: deckName });
    await createCard(page, 'First card content');
    await createCard(page, 'Second card content');
    
    // Open settings and export
    await page.getByRole('button', { name: '⚙ Settings' }).click();
    await page.waitForTimeout(300);
    
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /export deck/i }).click();
    const download = await downloadPromise;
    
    // Read the downloaded file
    const filePath = await download.path();
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Verify content
    expect(content).toContain(deckName);
    expect(content).toContain('Starting interval');
    expect(content).toContain('2 days'); // Default interval
    expect(content).toContain('First card content');
    expect(content).toContain('Second card content');
    expect(content).toContain('Cards (2)');
  });
});

test.describe('Import Cards', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForDemoLogin(page);
  });

  test('import button accepts file upload', async ({ page }) => {
    await createDeck(page, { name: uniqueName('ImportTest') });
    
    // Open settings
    await page.getByRole('button', { name: '⚙ Settings' }).click();
    await page.waitForTimeout(300);
    
    // Verify import button exists with file input
    const importLabel = page.locator('label').filter({ hasText: /import cards/i });
    await expect(importLabel).toBeVisible();
    
    const fileInput = importLabel.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();
  });

  test('importing file creates cards', async ({ page }) => {
    await createDeck(page, { name: uniqueName('ImportCards') });
    
    // Open settings
    await page.getByRole('button', { name: '⚙ Settings' }).click();
    await page.waitForTimeout(300);
    
    // Create a temp file with card content
    const testContent = `First imported card

Second imported card

Third imported card`;
    
    // Handle the confirm dialog
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('3 card');
      await dialog.accept();
    });
    
    // Upload the file
    const fileInput = page.locator('input[type="file"][accept=".md,.txt"]');
    await fileInput.setInputFiles({
      name: 'test-import.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from(testContent)
    });
    
    // Wait for success alert
    await page.waitForTimeout(500);
    
    // Close settings and check all cards
    await page.locator('.panel .icon-btn').click();
    await page.waitForTimeout(300);
    
    await page.getByRole('button', { name: 'Show all cards' }).click();
    await page.waitForTimeout(500);
    
    // Should see all 3 imported cards
    await expect(page.locator('.panel-body')).toContainText('First imported card');
    await expect(page.locator('.panel-body')).toContainText('Second imported card');
    await expect(page.locator('.panel-body')).toContainText('Third imported card');
  });

  test('duplicate cards are skipped', async ({ page }) => {
    await createDeck(page, { name: uniqueName('ImportDupe') });
    await createCard(page, 'Already exists');
    
    // Open settings
    await page.getByRole('button', { name: '⚙ Settings' }).click();
    await page.waitForTimeout(300);
    
    // Try to import a file with the same content
    const testContent = `Already exists

New card only`;
    
    // Handle the confirm dialog - should only show 1 new card
    page.on('dialog', async dialog => {
      if (dialog.type() === 'confirm') {
        expect(dialog.message()).toContain('1 card');
        await dialog.accept();
      } else {
        await dialog.accept();
      }
    });
    
    const fileInput = page.locator('input[type="file"][accept=".md,.txt"]');
    await fileInput.setInputFiles({
      name: 'test-dupe.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from(testContent)
    });
    
    await page.waitForTimeout(500);
  });

  test('empty/invalid file shows no cards message', async ({ page }) => {
    await createDeck(page, { name: uniqueName('ImportEmpty') });
    
    // Open settings
    await page.getByRole('button', { name: '⚙ Settings' }).click();
    await page.waitForTimeout(300);
    
    // Import empty file
    const testContent = `# Just a header
- Some metadata
---`;
    
    // Handle alert for no cards
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('No new cards');
      await dialog.accept();
    });
    
    const fileInput = page.locator('input[type="file"][accept=".md,.txt"]');
    await fileInput.setInputFiles({
      name: 'test-empty.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from(testContent)
    });
    
    await page.waitForTimeout(500);
  });
});

