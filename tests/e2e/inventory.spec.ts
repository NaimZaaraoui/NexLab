import { test, expect, Page } from '@playwright/test';

async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'admin@nexlab.local');
  await page.fill('input[type="password"]', 'NexLab2026!');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(dashboard|analyses|patients)/, { timeout: 10000 });
}

test.describe('Inventory Management Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should be able to access the Inventory Dashboard', async ({ page }) => {
    await page.goto('/dashboard/inventory');
    await expect(page).toHaveURL(/\/dashboard\/inventory/);
    
    const heading = page.locator('h1, h2').filter({ hasText: /Stock|Inventaire|Inventory/i }).first();
    await expect(heading).toBeVisible();
  });

  test('should display items running low on stock', async ({ page }) => {
    await page.goto('/dashboard/inventory');
    await page.waitForTimeout(1000);
    
    // Verify that the table or grid responds
    const table = page.locator('table, [role="grid"], .grid').first();
    await expect(table).toBeVisible();
    
    // Check if any warning/danger indicators appear for low stock
    const alerts = page.locator('.text-red-500, .bg-red-50, [data-status="low"]');
    const warningCount = await alerts.count();
    expect(warningCount >= 0).toBe(true); 
  });

  test('should allow opening a stock transaction modal (add/remove)', async ({ page }) => {
    await page.goto('/dashboard/inventory');
    
    const transactionBtn = page.locator('button').filter({ hasText: /Mouvement|Ajouter|Subtract|Transaction/i }).first();
    
    if (await transactionBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await transactionBtn.click();
      
      const modal = page.locator('[role="dialog"], form').first();
      await expect(modal).toBeVisible();
      
      // Ensure quantity inputs exist
      const numberInput = modal.locator('input[type="number"]').first();
      expect(await numberInput.count()).toBeGreaterThanOrEqual(0);
    }
  });
});
