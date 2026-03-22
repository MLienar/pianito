import { expect, test } from "@playwright/test";

test.describe("Home Page", () => {
  test("displays the hero section with title and subtitle", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.locator("h1")).toContainText("pianito");
    await expect(
      page.locator("text=Learn piano, read music, master chords."),
    ).toBeVisible();
  });

  test("displays all three feature cards", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "Read Music" }),
    ).toBeVisible();
    await expect(
      page.getByText(
        "Learn to read music notation with interactive exercises.",
      ),
    ).toBeVisible();

    await expect(page.getByRole("heading", { name: "Chords" })).toBeVisible();
    await expect(
      page.getByText("Visualize and learn chords with scale degrees."),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "Play Songs" }),
    ).toBeVisible();
    await expect(
      page.getByText("Play along with backing tracks and accompaniment."),
    ).toBeVisible();
  });

  test("navbar shows sign in and sign up links when logged out", async ({
    page,
  }) => {
    await page.goto("/");

    const nav = page.locator("nav");
    await expect(nav.getByText("pianito")).toBeVisible();
    await expect(nav.getByText("Sign in")).toBeVisible();
    await expect(nav.getByText("Sign up")).toBeVisible();
  });

  test("navbar logo links to home", async ({ page }) => {
    await page.goto("/login");
    await page.locator("nav").getByText("pianito").click();
    await expect(page).toHaveURL("/");
  });
});
