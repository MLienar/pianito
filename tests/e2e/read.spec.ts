import { type Page, expect, test } from "@playwright/test";

const MOCK_EXERCISE = {
  id: "test-exercise-id",
  clef: "treble" as const,
  tempo: 60,
  notes: ["C4", "E4", "G4", "A4", "F4", "D4", "B4", "C5", "E4", "G4"],
};

/** Expected letters matching MOCK_EXERCISE.notes */
const EXPECTED_LETTERS = ["C", "E", "G", "A", "F", "D", "B", "C", "E", "G"];

async function mockExerciseApi(page: Page) {
  await page.route("**/api/exercises/notation*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_EXERCISE),
    }),
  );
}

async function mockExerciseApiError(page: Page) {
  await page.route("**/api/exercises/notation*", (route) =>
    route.fulfill({ status: 500, body: "Internal Server Error" }),
  );
}

test.describe("Read Music Page", () => {
  test("displays idle state with staff, start button, and instructions", async ({
    page,
  }) => {
    await mockExerciseApi(page);
    await page.goto("/read");

    await expect(page.locator("h1")).toContainText("Read Music");
    await expect(page.getByText("Score: 0/10")).toBeVisible();
    await expect(page.getByRole("button", { name: "Start" })).toBeVisible();
    await expect(
      page.locator("svg[role='img'][aria-label='Musical staff with notes']"),
    ).toBeVisible();
    await expect(page.getByText("Press Start to begin")).toBeVisible();
  });

  test("displays all 7 answer buttons (C through B) disabled before start", async ({
    page,
  }) => {
    await mockExerciseApi(page);
    await page.goto("/read");

    for (const note of ["C", "D", "E", "F", "G", "A", "B"]) {
      const btn = page.getByRole("button", { name: note, exact: true });
      await expect(btn).toBeVisible();
      await expect(btn).toBeDisabled();
    }
  });

  test("clicking Start begins the exercise and enables answer buttons", async ({
    page,
  }) => {
    await mockExerciseApi(page);
    await page.goto("/read");

    await page.getByRole("button", { name: "Start" }).click();

    await expect(page.getByRole("button", { name: "Start" })).toBeHidden();

    for (const note of ["C", "D", "E", "F", "G", "A", "B"]) {
      await expect(
        page.getByRole("button", { name: note, exact: true }),
      ).toBeEnabled();
    }
  });

  test("answering correctly shows feedback and increments score", async ({
    page,
  }) => {
    await mockExerciseApi(page);
    await page.goto("/read");
    await page.getByRole("button", { name: "Start" }).click();

    // First note is C4 → answer C
    await page.getByRole("button", { name: "C", exact: true }).click();

    await expect(page.getByText("Correct!")).toBeVisible();
    await expect(page.getByText("Score: 1/10")).toBeVisible();
  });

  test("answering incorrectly shows wrong feedback without incrementing score", async ({
    page,
  }) => {
    await mockExerciseApi(page);
    await page.goto("/read");
    await page.getByRole("button", { name: "Start" }).click();

    // First note is C4 → answer D (wrong)
    await page.getByRole("button", { name: "D", exact: true }).click();

    await expect(page.getByText("Wrong!")).toBeVisible();
    await expect(page.getByText("Score: 0/10")).toBeVisible();
  });

  test("keyboard input works for answering notes", async ({ page }) => {
    await mockExerciseApi(page);
    await page.goto("/read");
    await page.getByRole("button", { name: "Start" }).click();

    // First note is C4 → press "c" key
    await page.keyboard.press("c");

    await expect(page.getByText("Correct!")).toBeVisible();
    await expect(page.getByText("Score: 1/10")).toBeVisible();
  });

  test("completing all notes shows results with New Exercise button", async ({
    page,
  }) => {
    await mockExerciseApi(page);
    await page.goto("/read");
    await page.getByRole("button", { name: "Start" }).click();

    // At tempo 60 and NOTE_SPACING 100, each note takes 1s.
    // Answer the first note immediately, then wait ~1s between each subsequent note.
    for (let i = 0; i < EXPECTED_LETTERS.length; i++) {
      if (i > 0) {
        await page.waitForTimeout(1050);
      }
      await page.keyboard.press(EXPECTED_LETTERS[i].toLowerCase());
    }

    // Wait for the exercise to finish scrolling past the last note
    await expect(page.getByText("Exercise Complete!")).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText("Score: 10/10")).toBeVisible();
    await expect(page.getByText("Perfect score!")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "New Exercise" }),
    ).toBeVisible();
  });

  test("New Exercise button resets and fetches a new exercise", async ({
    page,
  }) => {
    await mockExerciseApi(page);
    await page.goto("/read");
    await page.getByRole("button", { name: "Start" }).click();

    // Answer all notes to finish the exercise
    for (let i = 0; i < EXPECTED_LETTERS.length; i++) {
      if (i > 0) {
        await page.waitForTimeout(1050);
      }
      await page.keyboard.press(EXPECTED_LETTERS[i].toLowerCase());
    }

    await expect(page.getByText("Exercise Complete!")).toBeVisible({
      timeout: 15000,
    });

    // Click New Exercise
    const apiRequest = page.waitForRequest("**/api/exercises/notation*");
    await page.getByRole("button", { name: "New Exercise" }).click();
    await apiRequest;

    // Should be back in idle state
    await expect(page.getByRole("button", { name: "Start" })).toBeVisible();
    await expect(page.getByText("Score: 0/10")).toBeVisible();
  });

  test("shows error state with retry button when API fails", async ({
    page,
  }) => {
    await mockExerciseApiError(page);
    await page.goto("/read");

    await expect(page.getByText(/Failed to load exercise/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
  });

  test("retry button re-fetches the exercise", async ({ page }) => {
    await mockExerciseApiError(page);
    await page.goto("/read");

    await expect(page.getByText(/Failed to load exercise/)).toBeVisible();

    // Now mock a successful response and retry
    await page.unrouteAll();
    await mockExerciseApi(page);
    await page.getByRole("button", { name: "Retry" }).click();

    await expect(page.getByRole("button", { name: "Start" })).toBeVisible();
  });

  test("shows loading state while fetching exercise", async ({ page }) => {
    // Delay the API response to observe loading state
    await page.route("**/api/exercises/notation*", async (route) => {
      await new Promise((r) => setTimeout(r, 1000));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_EXERCISE),
      });
    });
    await page.goto("/read");

    await expect(page.getByText("Loading exercise...")).toBeVisible();
    await expect(page.getByRole("button", { name: "Start" })).toBeVisible({
      timeout: 5000,
    });
  });
});
