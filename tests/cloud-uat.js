// Cloud UAT Script - Run with: node tests/cloud-uat.js
// This tests the production site with interactive auth

import { chromium } from 'playwright';

const CLOUD_URL = 'http://fireminder.com';

async function runUAT() {
  console.log('🔥 Fireminder Cloud UAT\n');
  
  const browser = await chromium.launch({ 
    headless: false,  // See what's happening
    slowMo: 500       // Slow down for observation
  });
  
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }  // iPhone 14 Pro size
  });
  
  const page = await context.newPage();
  const findings = [];
  
  function log(category, msg) {
    const entry = `[${category}] ${msg}`;
    console.log(entry);
    findings.push(entry);
  }
  
  try {
    // Navigate to site
    console.log('📍 Navigating to', CLOUD_URL);
    await page.goto(CLOUD_URL);
    await page.waitForTimeout(2000);
    
    // Check initial state
    const signInBtn = page.getByRole('button', { name: /sign in/i });
    const isSignedOut = await signInBtn.isVisible().catch(() => false);
    
    if (isSignedOut) {
      log('AUTH', 'Shows sign-in screen - expected for fresh session');
      console.log('\n⏳ Please sign in manually in the browser window...');
      console.log('   (Waiting up to 60 seconds for auth)\n');
      
      // Wait for sign-in to complete
      await page.waitForSelector('.sidebar', { timeout: 60000 }).catch(() => {
        log('AUTH', '❌ Timeout waiting for sign-in');
        return null;
      });
    }
    
    // Now should be signed in
    console.log('\n✅ Signed in! Starting UAT...\n');
    await page.waitForTimeout(1000);
    
    // ===== TEST 1: Header elements =====
    console.log('--- TEST 1: Header Layout ---');
    const hamburger = page.locator('.icon-btn').filter({ hasText: '≡' });
    const addBtn = page.locator('.header-right .icon-btn').first();
    
    if (await hamburger.isVisible()) {
      log('UI', '✅ Hamburger menu visible');
    } else {
      log('BUG', '❌ Hamburger menu missing');
    }
    
    if (await addBtn.isVisible()) {
      log('UI', '✅ Add (+) button visible');
    } else {
      log('BUG', '❌ Add button missing');
    }
    
    // ===== TEST 2: Sidebar =====
    console.log('\n--- TEST 2: Sidebar ---');
    await hamburger.click();
    await page.waitForTimeout(500);
    
    const sidebar = page.locator('.sidebar');
    if (await sidebar.isVisible()) {
      log('UI', '✅ Sidebar opens');
      
      // Check sidebar contents
      const myDecks = page.locator('.sidebar-section-title').filter({ hasText: /my decks/i });
      const newDeckBtn = page.getByRole('button', { name: /new deck/i });
      const signOutBtn = page.getByRole('button', { name: /sign out/i });
      const themeSection = page.locator('text=🎨 Theme');
      
      if (await myDecks.isVisible()) log('UI', '✅ "My Decks" section present');
      else log('BUG', '❌ "My Decks" section missing');
      
      if (await newDeckBtn.isVisible()) log('UI', '✅ "New Deck" button present');
      else log('BUG', '❌ "New Deck" button missing');
      
      if (await signOutBtn.isVisible()) log('UI', '✅ "Sign Out" button present');
      else log('BUG', '❌ "Sign Out" button missing');
      
      if (await themeSection.isVisible()) log('UI', '✅ Theme switcher present');
      else log('BUG', '❌ Theme switcher missing');
      
    } else {
      log('BUG', '❌ Sidebar does not open');
    }
    
    // Close sidebar
    const closeBtn = page.locator('.sidebar-header .icon-btn');
    await closeBtn.click();
    await page.waitForTimeout(500);
    
    // ===== TEST 3: Create a deck =====
    console.log('\n--- TEST 3: Create Deck Flow ---');
    await hamburger.click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: /new deck/i }).click();
    await page.waitForTimeout(500);
    
    const panel = page.locator('.panel');
    if (await panel.isVisible()) {
      log('UI', '✅ New Deck panel opens');
      
      // Check form fields
      const nameInput = page.locator('.form-input').first();
      const intervalInput = page.locator('input[type="number"]').first();
      const queueLimitInput = page.locator('input[placeholder*="Unlimited"], input[type="number"]').last();
      
      if (await nameInput.isVisible()) log('UI', '✅ Name input present');
      else log('BUG', '❌ Name input missing');
      
      if (await intervalInput.isVisible()) log('UI', '✅ Interval input present');
      else log('BUG', '❌ Interval input missing');
      
      // Fill and create
      const testDeckName = `UAT-Deck-${Date.now()}`;
      await nameInput.fill(testDeckName);
      await page.locator('.panel-action').click();
      await page.waitForTimeout(1000);
      
      // Verify deck was created
      await hamburger.click();
      await page.waitForTimeout(500);
      
      const deckInSidebar = page.locator('.sidebar-deck').filter({ hasText: testDeckName });
      if (await deckInSidebar.isVisible()) {
        log('UI', '✅ Deck appears in sidebar after creation');
      } else {
        log('BUG', '❌ Deck not showing in sidebar after creation');
      }
      
      await closeBtn.click();
      await page.waitForTimeout(300);
    } else {
      log('BUG', '❌ New Deck panel did not open');
    }
    
    // ===== TEST 4: Create a card =====
    console.log('\n--- TEST 4: Create Card Flow ---');
    await addBtn.click();
    await page.waitForTimeout(500);
    
    if (await panel.isVisible()) {
      log('UI', '✅ Add Card panel opens');
      
      const cardContent = `UAT Test Card ${Date.now()}`;
      await page.locator('.panel-body textarea').fill(cardContent);
      await page.locator('.panel-action').click();
      await page.waitForTimeout(1000);
      
      // Card should now be visible in review
      const cardEl = page.locator('.card-content');
      if (await cardEl.isVisible()) {
        const content = await cardEl.textContent();
        if (content.includes('UAT Test Card')) {
          log('UI', '✅ Card appears in review view');
        } else {
          log('BUG', '❌ Card content not matching');
        }
      } else {
        log('BUG', '❌ Card not visible after creation');
      }
    } else {
      log('BUG', '❌ Add Card panel did not open');
    }
    
    // ===== TEST 5: Review flow =====
    console.log('\n--- TEST 5: Review Flow ---');
    const intervalControls = page.locator('.interval-controls');
    const reviewBtn = page.getByRole('button', { name: /review done/i });
    const menuBtn = page.locator('.menu-btn');
    const reflectionInput = page.locator('textarea[placeholder*="reflection"]');
    
    if (await intervalControls.isVisible()) {
      log('UI', '✅ Interval controls visible');
      
      // Check shorter/longer buttons
      const shorterBtn = page.locator('.interval-btn').first();
      const longerBtn = page.locator('.interval-btn').last();
      const currentInterval = page.locator('.interval-current');
      
      if (await shorterBtn.isVisible()) log('UI', '✅ Shorter button visible');
      if (await longerBtn.isVisible()) log('UI', '✅ Longer button visible');
      if (await currentInterval.isVisible()) {
        const intervalText = await currentInterval.textContent();
        log('UI', `✅ Current interval shown: ${intervalText}`);
      }
    } else {
      log('BUG', '❌ Interval controls not visible');
    }
    
    if (await reviewBtn.isVisible()) log('UI', '✅ Review Done button visible');
    else log('BUG', '❌ Review Done button missing');
    
    if (await menuBtn.isVisible()) log('UI', '✅ ••• menu button visible');
    else log('BUG', '❌ ••• menu button missing');
    
    if (await reflectionInput.isVisible()) log('UI', '✅ Reflection input visible');
    else log('BUG', '❌ Reflection input missing');
    
    // ===== TEST 6: Menu options =====
    console.log('\n--- TEST 6: Card Menu ---');
    await menuBtn.click();
    await page.waitForTimeout(300);
    
    const menu = page.locator('.dropdown-menu');
    if (await menu.isVisible()) {
      log('UI', '✅ Dropdown menu opens');
      
      const rephrase = page.locator('.dropdown-item').filter({ hasText: /rephrase/i });
      const viewHistory = page.locator('.dropdown-item').filter({ hasText: /history/i });
      const skip = page.locator('.dropdown-item').filter({ hasText: /skip/i });
      const moveToDeck = page.locator('.dropdown-item').filter({ hasText: /move to deck/i });
      const retire = page.locator('.dropdown-item').filter({ hasText: /retire/i });
      const deleteBtn = page.locator('.dropdown-item').filter({ hasText: /delete/i });
      
      if (await rephrase.isVisible()) log('UI', '✅ "Rephrase card" option');
      else log('BUG', '❌ "Rephrase card" missing');
      
      if (await viewHistory.isVisible()) log('UI', '✅ "View history" option');
      else log('BUG', '❌ "View history" missing');
      
      if (await skip.isVisible()) log('UI', '✅ "Skip" option');
      else log('BUG', '❌ "Skip" missing');
      
      if (await moveToDeck.isVisible()) log('UI', '✅ "Move to deck" option');
      else log('BUG', '❌ "Move to deck" missing');
      
      if (await retire.isVisible()) log('UI', '✅ "Retire" option');
      else log('BUG', '❌ "Retire" missing');
      
      if (await deleteBtn.isVisible()) log('UI', '✅ "Delete" option');
      else log('BUG', '❌ "Delete" missing');
      
      // Close menu by clicking elsewhere
      await page.locator('body').click({ position: { x: 10, y: 10 } });
      await page.waitForTimeout(300);
    } else {
      log('BUG', '❌ Dropdown menu did not open');
    }
    
    // ===== SUMMARY =====
    console.log('\n========================================');
    console.log('UAT SUMMARY');
    console.log('========================================\n');
    
    const bugs = findings.filter(f => f.includes('BUG'));
    const passes = findings.filter(f => f.includes('UI] ✅'));
    
    console.log(`✅ Passed: ${passes.length}`);
    console.log(`❌ Bugs: ${bugs.length}`);
    
    if (bugs.length > 0) {
      console.log('\nBugs found:');
      bugs.forEach(b => console.log('  ' + b));
    }
    
    console.log('\n⏳ Browser will stay open for manual inspection...');
    console.log('   Press Ctrl+C to close.\n');
    
    // Keep browser open for inspection
    await page.waitForTimeout(300000);
    
  } catch (error) {
    console.error('❌ UAT Error:', error.message);
  } finally {
    await browser.close();
  }
}

runUAT();

