/**
 * Simplified Hamburger Navigation Test
 * Testing basic hamburger menu functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Hamburger Menu Basic Tests', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('hamburger menu basic functionality', async ({ page }) => {
    // Navigate to the page
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check hamburger button exists
    const menuButton = page.locator('[data-testid="mobile-menu-button"]');
    await expect(menuButton).toBeVisible();
    
    // Check menu is initially hidden
    const mobileMenu = page.locator('[data-testid="mobile-menu"]');
    await expect(mobileMenu).toBeHidden();
    
    // Click hamburger to open
    await menuButton.click();
    
    // Menu should be visible
    await expect(mobileMenu).toBeVisible();
    
    // Check menu items are visible
    const menuItems = page.locator('[data-testid="mobile-menu-items"]');
    await expect(menuItems).toBeVisible();
    
    // Click hamburger again to close
    await menuButton.click();
    
    // Menu should be hidden again
    await expect(mobileMenu).toBeHidden();
  });

  test('navigation through mobile menu', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Open menu
    const menuButton = page.locator('[data-testid="mobile-menu-button"]');
    await menuButton.click();
    
    // Click Convert link
    const convertLink = page.locator('[data-testid="mobile-menu-items"] a:has-text("Convert")').first();
    await convertLink.click();
    
    // Should navigate to convert page
    await page.waitForURL(/\/convert/);
    await expect(page).toHaveURL(/\/convert/);
    
    // Menu should be closed after navigation
    const mobileMenu = page.locator('[data-testid="mobile-menu"]');
    await expect(mobileMenu).toBeHidden();
  });

  test('escape key closes menu', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Open menu
    const menuButton = page.locator('[data-testid="mobile-menu-button"]');
    await menuButton.click();
    
    // Menu should be visible
    const mobileMenu = page.locator('[data-testid="mobile-menu"]');
    await expect(mobileMenu).toBeVisible();
    
    // Press Escape
    await page.keyboard.press('Escape');
    
    // Menu should close
    await expect(mobileMenu).toBeHidden();
  });
});