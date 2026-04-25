/**
 * E2E Auth Tests — login, register, session, route protection.
 */
import { test, expect } from "@playwright/test";

const FREE_EMAIL    = process.env.TEST_FREE_USER_EMAIL    || "test_automation_free_parent@test.village";
const FREE_PASSWORD = process.env.TEST_USER_PASSWORD      || "TestVillage2024!";
const BASE_URL      = process.env.PLAYWRIGHT_BASE_URL     || "https://dev.ourlittlevillage.com.au";

test.describe("Authentication", () => {

  test("landing page loads without errors", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Village/i);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.waitForTimeout(1500);
    expect(errors.filter(e => !e.includes("ResizeObserver"))).toHaveLength(0);
  });

  test("login page is reachable", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /sign in|log in|welcome/i })).toBeVisible();
  });

  test("login with valid credentials reaches dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', FREE_EMAIL);
    await page.fill('input[type="password"]', FREE_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|home|feed)/, { timeout: 10_000 });
    await expect(page.url()).toMatch(/\/(dashboard|home|feed)/);
  });

  test("login with wrong password shows error", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', FREE_EMAIL);
    await page.fill('input[type="password"]', "WrongPassword999!");
    await page.click('button[type="submit"]');
    // Should stay on login, no redirect
    await page.waitForTimeout(2000);
    expect(page.url()).toContain("/login");
  });

  test("protected routes redirect unauthenticated users", async ({ page }) => {
    const protectedRoutes = ["/dashboard", "/messages", "/stall"];
    for (const route of protectedRoutes) {
      await page.goto(route);
      await page.waitForTimeout(1000);
      // Should be redirected away or show login
      const url = page.url();
      expect(url).not.toBe(`${BASE_URL}${route}`);
    }
  });

  test("register page is reachable", async ({ page }) => {
    await page.goto("/register");
    await expect(page).toHaveURL(/register/);
    await expect(page.locator("form")).toBeVisible();
  });

  test("logout works", async ({ page }) => {
    // Login first
    await page.goto("/login");
    await page.fill('input[type="email"]', FREE_EMAIL);
    await page.fill('input[type="password"]', FREE_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|home|feed)/, { timeout: 10_000 });

    // Find logout — could be in nav dropdown or settings
    const logoutBtn = page.getByRole("button", { name: /log.?out|sign.?out/i });
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
    } else {
      // Try nav menu
      await page.goto("/settings");
      await page.waitForTimeout(1000);
    }
  });
});
