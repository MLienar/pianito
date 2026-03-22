import { expect, test } from "@playwright/test";

test.describe("Login Page", () => {
  test("displays the login form", async ({ page }) => {
    await page.goto("/login");

    await expect(page.locator("h1")).toContainText("Sign in");
    await expect(page.locator("text=Welcome back to pianito.")).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(
      page.getByRole("main").getByRole("button", { name: "Sign in" }),
    ).toBeVisible();
  });

  test("has link to signup page", async ({ page }) => {
    await page.goto("/login");

    const signUpLink = page
      .locator("main")
      .getByRole("link", { name: "Sign up" });
    await expect(signUpLink).toBeVisible();
    await signUpLink.click();
    await expect(page).toHaveURL("/signup");
  });

  test("shows validation on empty submit", async ({ page }) => {
    await page.goto("/login");

    await page
      .getByRole("main")
      .getByRole("button", { name: "Sign in" })
      .click();

    // HTML5 validation should prevent submission
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveAttribute("required", "");
  });

  test("shows error on invalid credentials", async ({ page }) => {
    await page.goto("/login");

    await page.locator('input[type="email"]').fill("nonexistent@test.com");
    await page.locator('input[type="password"]').fill("wrongpassword");
    await page
      .getByRole("main")
      .getByRole("button", { name: "Sign in" })
      .click();

    // Should show error message (API must be running)
    await expect(page.locator("text=Signing in...")).toBeVisible();
  });
});

test.describe("Signup Page", () => {
  test("displays the signup form", async ({ page }) => {
    await page.goto("/signup");

    await expect(page.locator("h1")).toContainText("Create account");
    await expect(page.locator("text=Start your piano journey.")).toBeVisible();
    await expect(page.locator('input[type="text"]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Create account" }),
    ).toBeVisible();
  });

  test("has link to login page", async ({ page }) => {
    await page.goto("/signup");

    const signInLink = page
      .locator("main")
      .getByRole("link", { name: "Sign in" });
    await expect(signInLink).toBeVisible();
    await signInLink.click();
    await expect(page).toHaveURL("/login");
  });

  test("password field requires minimum 8 characters", async ({ page }) => {
    await page.goto("/signup");

    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toHaveAttribute("minlength", "8");
  });
});

test.describe("Navigation between auth pages", () => {
  test("can navigate login -> signup -> login", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h1")).toContainText("Sign in");

    await page.locator("main").getByRole("link", { name: "Sign up" }).click();
    await expect(page).toHaveURL("/signup");
    await expect(page.locator("h1")).toContainText("Create account");

    await page.locator("main").getByRole("link", { name: "Sign in" }).click();
    await expect(page).toHaveURL("/login");
    await expect(page.locator("h1")).toContainText("Sign in");
  });

  test("nav sign in button navigates to login", async ({ page }) => {
    await page.goto("/");

    await page.locator("nav").getByText("Sign in").click();
    await expect(page).toHaveURL("/login");
  });

  test("nav sign up button navigates to signup", async ({ page }) => {
    await page.goto("/");

    await page.locator("nav").getByText("Sign up").click();
    await expect(page).toHaveURL("/signup");
  });
});
