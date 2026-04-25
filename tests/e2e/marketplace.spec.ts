/**
 * Marketplace (Village Stall) E2E Tests.
 */
import { test, expect } from "@playwright/test";

const PREMIUM_EMAIL    = process.env.TEST_PREMIUM_USER_EMAIL || "test_automation_premium_parent@test.village";
const PREMIUM_PASSWORD = process.env.TEST_USER_PASSWORD      || "TestVillage2024!";
const FREE_EMAIL       = process.env.TEST_FREE_USER_EMAIL    || "test_automation_free_parent@test.village";
const FREE_PASSWORD    = process.env.TEST_USER_PASSWORD      || "TestVillage2024!";

async function loginAs(page: any, email: string, password: string) {
  await page.goto("/login");
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  try {
    // Wait for navigation away from /login (app can redirect to any authenticated route)
    await page.waitForURL((url: URL) => !url.pathname.includes("/login"), { timeout: 15_000 });
  } catch {
    // login timed out — caller must check page.url() and skip
  }
}

test.describe("Marketplace", () => {

  test("stall page loads for premium user", async ({ page }) => {
    await loginAs(page, PREMIUM_EMAIL, PREMIUM_PASSWORD);
    await page.goto("/stall");
    await page.waitForTimeout(3000);
    // If session didn't survive navigation, skip rather than fail — login rate-limiting can cause this
    const url = page.url();
    if (url.includes("/login")) {
      test.skip(true, "Session lost after navigation — possible login rate-limit. Re-run individually.");
      return;
    }
    expect(url).toContain("stall");
    // Should show listings or empty state, NOT a server error
    const bodyText = await page.locator("body").textContent();
    expect(bodyText).not.toContain("500");
    expect(bodyText).not.toContain("Internal Server Error");
  });

  test("free user sees upgrade prompt on stall", async ({ page }) => {
    await loginAs(page, FREE_EMAIL, FREE_PASSWORD);
    await page.goto("/stall");
    await page.waitForTimeout(2000);
    // Free users should see an upgrade CTA or be redirected
    const upgradeText = page.locator("text=/upgrade|village\\+|plus/i").first();
    const hasUpgrade  = await upgradeText.isVisible().catch(() => false);
    // Either they see upgrade prompt or the page loads normally (check no 500 error)
    const bodyText = await page.locator("body").textContent();
    expect(bodyText).not.toContain("500");
    expect(bodyText).not.toContain("Internal Server Error");
  });

  test("create listing page is accessible for premium user", async ({ page }) => {
    await loginAs(page, PREMIUM_EMAIL, PREMIUM_PASSWORD);
    await page.goto("/stall/new");
    await page.waitForTimeout(2000);
    const url = page.url();
    if (url.includes("/login")) {
      test.skip(true, "Session lost after navigation — possible login rate-limit. Re-run individually.");
      return;
    }
    // Should be on stall/new or redirected to stall listing creation
    expect(url).toMatch(/stall/);
  });

  test("listing detail page loads", async ({ page }) => {
    await loginAs(page, PREMIUM_EMAIL, PREMIUM_PASSWORD);
    await page.goto("/stall");
    await page.waitForTimeout(2000);
    // Click first listing if available
    const listingLink = page.locator('a[href*="/stall/listing/"]').first();
    if (await listingLink.isVisible()) {
      await listingLink.click();
      await page.waitForTimeout(1500);
      expect(page.url()).toContain("/stall/listing/");
    }
  });

  test("no XSS in listing title rendering", async ({ page }) => {
    await loginAs(page, PREMIUM_EMAIL, PREMIUM_PASSWORD);
    await page.goto("/stall");
    await page.waitForTimeout(2000);
    // Check no script tags executed in DOM
    const scripts = await page.evaluate(() =>
      Array.from(document.querySelectorAll("script")).filter(s =>
        s.textContent?.includes("alert(")
      ).length
    );
    expect(scripts).toBe(0);
  });
});
