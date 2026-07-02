import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('rubik-lang', 'zh-TW');
      window.localStorage.setItem('rubik-theme', 'dark');
    });
    await page.goto('/');
  });

  test('should load page with correct initial elements', async ({ page }) => {
    // Check main title
    const title = page.locator('h2[data-i18n="home.title"]');
    await expect(title).toBeVisible();
    await expect(title).toHaveText('魔術方塊解題器');

    // 3D Canvas previews should be mounted
    await expect(page.locator('#preview2 canvas')).toBeVisible();
    await expect(page.locator('#preview3 canvas')).toBeVisible();
  });

  test('should support language switching (zh-TW <-> en)', async ({ page }) => {
    const langBtn = page.locator('button[aria-label="Switch Language"]');
    await expect(langBtn).toBeVisible();
    await expect(langBtn).toHaveText('EN');

    // Toggle to English
    await langBtn.click();
    await expect(langBtn).toHaveText('繁中');

    // Check title updated to English
    const title = page.locator('h2[data-i18n="home.title"]');
    await expect(title).toHaveText("Rubik's Cube Solver");

    // Toggle back to Chinese
    await langBtn.click();
    await expect(langBtn).toHaveText('EN');
    await expect(title).toHaveText('魔術方塊解題器');
  });

  test('should support theme toggling (light <-> dark)', async ({ page }) => {
    const themeBtn = page.locator('button[aria-label="Toggle Theme"]');
    await expect(themeBtn).toBeVisible();

    const html = page.locator('html');
    
    // Toggle theme
    const isInitiallyDark = await html.evaluate(el => el.classList.contains('dark'));
    await themeBtn.click();
    
    if (isInitiallyDark) {
      await expect(html).toHaveClass(/light/);
    } else {
      await expect(html).toHaveClass(/dark/);
    }

    // Toggle back
    await themeBtn.click();
    if (isInitiallyDark) {
      await expect(html).toHaveClass(/dark/);
    } else {
      await expect(html).toHaveClass(/light/);
    }
  });

  test('should navigate to 2x2 and 3x3 solver pages', async ({ page }) => {
    // 2x2 link
    const enter2x2 = page.locator('a[href="./two-by-two.html"]');
    await expect(enter2x2).toBeVisible();
    await enter2x2.click();
    await expect(page).toHaveURL(/\/two-by-two\.html/);

    // Go back
    await page.goto('/');

    // 3x3 link
    const enter3x3 = page.locator('a[href="./three-by-three.html"]');
    await expect(enter3x3).toBeVisible();
    await enter3x3.click();
    await expect(page).toHaveURL(/\/three-by-three\.html/);
  });
});
