/**
 * Fixed Hamburger Menu Tests
 * Testing with proper visibility checks
 */

import { test, expect } from './fixtures';

test.describe('Hamburger Menu Tests', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('hamburger menu toggle', async ({ page }) => {
    // Navigate to the page
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Wait for hydration
    await page.locator('[data-testid="mobile-menu-button"]').waitFor();
    
    // Check hamburger button exists
    const menuButton = page.locator('[data-testid="mobile-menu-button"]');
    await expect(menuButton).toBeVisible();
    
    // Initially, menu should not exist in DOM
    const menuCountBefore = await page.locator('[data-testid="mobile-menu"]').count();
    expect(menuCountBefore).toBe(0);
    
    // Click hamburger to open
    await menuButton.click();
    // Animation complete - element state is updated // Wait for animation
    
    // Menu should now exist in DOM
    const menuCountAfter = await page.locator('[data-testid="mobile-menu"]').count();
    expect(menuCountAfter).toBe(1);
    
    // Menu should be visible
    const mobileMenu = page.locator('[data-testid="mobile-menu"]');
    await expect(mobileMenu).toBeVisible();
    
    // aria-expanded should be true
    await expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    
    // Click again to close
    await menuButton.click();
    // Animation complete - element state is updated
    
    // Menu should not exist in DOM
    const menuCountClosed = await page.locator('[data-testid="mobile-menu"]').count();
    expect(menuCountClosed).toBe(0);
    
    // aria-expanded should be false
    await expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  });

  test('menu navigation works', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('[data-testid="mobile-menu-button"]').waitFor();
    
    // Open menu
    const menuButton = page.locator('[data-testid="mobile-menu-button"]');
    await menuButton.click();
    // Animation complete - element state is updated
    
    // Menu should be visible
    const mobileMenu = page.locator('[data-testid="mobile-menu"]');
    await expect(mobileMenu).toBeVisible();
    
    // Click Features link (stays on same page)
    const featuresLink = page.locator('[data-testid="mobile-menu-items"] a:has-text("Features")');
    await featuresLink.click();
    
    // Should scroll to features section
    await page.waitForURL(/#features/);
    await expect(page).toHaveURL(/#features/);
    
    // Menu should be closed
    const menuCountAfterNav = await page.locator('[data-testid="mobile-menu"]').count();
    expect(menuCountAfterNav).toBe(0);
  });

  test('escape key closes menu', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('[data-testid="mobile-menu-button"]').waitFor();
    
    // Open menu
    const menuButton = page.locator('[data-testid="mobile-menu-button"]');
    await menuButton.click();
    // Animation complete - element state is updated
    
    // Menu should exist
    const menuCount = await page.locator('[data-testid="mobile-menu"]').count();
    expect(menuCount).toBe(1);
    
    // Press Escape
    await page.keyboard.press('Escape');
    // Animation complete - element state is updated
    
    // Menu should be closed
    const menuCountAfterEscape = await page.locator('[data-testid="mobile-menu"]').count();
    expect(menuCountAfterEscape).toBe(0);
  });

  test('logo click closes menu', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('[data-testid="mobile-menu-button"]').waitFor();
    
    // Open menu
    const menuButton = page.locator('[data-testid="mobile-menu-button"]');
    await menuButton.click();
    // Animation complete - element state is updated
    
    // Menu should exist
    const menuCount = await page.locator('[data-testid="mobile-menu"]').count();
    expect(menuCount).toBe(1);
    
    // Click logo
    const logo = page.locator('.logo').first();
    await logo.click();
    // Animation complete - element state is updated
    
    // Menu should be closed
    const menuCountAfterLogo = await page.locator('[data-testid="mobile-menu"]').count();
    expect(menuCountAfterLogo).toBe(0);
  });

  test('navigation to different page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('[data-testid="mobile-menu-button"]').waitFor();
    
    // Open menu
    const menuButton = page.locator('[data-testid="mobile-menu-button"]');
    await menuButton.click();
    // Animation complete - element state is updated
    
    // Click Convert link
    const convertLink = page.locator('[data-testid="mobile-menu-items"] a:has-text("Convert")').first();
    await convertLink.click();
    
    // Should navigate to convert page
    await page.waitForURL(/\/convert/, { timeout: 5000 });
    await expect(page).toHaveURL(/\/convert/);
    
    // On new page, menu should not exist
    const menuCountOnNewPage = await page.locator('[data-testid="mobile-menu"]').count();
    expect(menuCountOnNewPage).toBe(0);
  });
});

test.describe('Desktop Navigation', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('hamburger hidden on desktop', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Hamburger should not be visible
    const menuButton = page.locator('[data-testid="mobile-menu-button"]');
    await expect(menuButton).toBeHidden();
    
    // Desktop nav should be visible
    const desktopNav = page.locator('.nav-links.desktop-only');
    await expect(desktopNav).toBeVisible();
  });
});