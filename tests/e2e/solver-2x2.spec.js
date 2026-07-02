import { test, expect } from '@playwright/test';

test.describe('2x2 Solver Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('rubik-lang', 'zh-TW');
      window.localStorage.setItem('rubik-theme', 'dark');
    });
    await page.goto('/two-by-two.html');
    
    // If mobile, ensure panel is expanded before tests
    const isMobile = test.info().project.name.includes('mobile');
    if (isMobile) {
      const toggleBtn = page.locator('#togglePanelBtn');
      await expect(toggleBtn).toBeVisible();
      const text = await toggleBtn.innerText();
      if (text.includes('展開') || text.includes('Expand')) {
        await toggleBtn.click();
      }
    }
  });

  test('should load page layouts and elements', async ({ page }) => {
    // 3D View and panel should be visible
    await expect(page.locator('#viewer canvas')).toBeVisible();
    await expect(page.locator('#controlPanel')).toBeVisible();

    // Mode tabs segmented control
    await expect(page.locator('button[data-i18n="common.editMode"]')).toBeVisible();
    await expect(page.locator('button[data-i18n="common.solveMode"]')).toBeVisible();

    // Palette is shown by default in Edit Mode
    await expect(page.locator('.grid-cols-3 button')).toHaveCount(6);
  });

  test('should run the solver flow', async ({ page }) => {
    // 1. Generate random scramble in Edit mode
    const randomBtn = page.locator('button:has-text("隨機打亂"), button:has-text("Random Scramble")');
    await expect(randomBtn).toBeVisible();
    await randomBtn.click();

    // Verify status indicates scramble was applied
    const statusText = page.locator('.statusBar p');
    await expect(statusText).toBeVisible();
    await expect(statusText).toHaveText(/已套用打亂|Scramble applied/);

    // 2. Switch to Solve Mode
    const solveModeTab = page.locator('button[data-i18n="common.solveMode"]');
    await solveModeTab.click();

    // Verify solve view elements
    const solveBtn = page.locator('button:has([data-i18n="common.solve"])');
    await expect(solveBtn).toBeVisible();

    // SolverToggle should be shown
    await expect(page.locator('button[data-i18n="solver.lbl"]')).toBeVisible();

    // 3. Click Solve
    await solveBtn.click();

    // Verify solver finishes and displays solution
    await expect(statusText).toHaveText(/找到解法|已產生|Optimal solution|LBL tutorial/);

    // Check steps list contains moves
    const steps = page.locator('ol.list-none li');
    await expect(steps.first()).toBeVisible();

    // 4. Verify playback controls are visible and sticky
    const nextBtn = page.locator('button:has-text("下一步"), button:has-text("Next Step")');
    const prevBtn = page.locator('button:has-text("上一步"), button:has-text("Prev")');
    const resetBtn = page.locator('button:has-text("回到起點"), button:has-text("Reset")');

    await expect(nextBtn).toBeVisible();
    await expect(prevBtn).toBeVisible();
    await expect(resetBtn).toBeVisible();

    // Click Next
    await nextBtn.click();
    
    // Verify first step (index 0) is now highlighted
    await expect(steps.first()).toHaveClass(/bg-accent-blue/);

    // Click Next again
    await nextBtn.click();
    
    // Verify highlight moved to next step (index 1)
    await expect(steps.nth(1)).toHaveClass(/bg-accent-blue/);
  });
});
