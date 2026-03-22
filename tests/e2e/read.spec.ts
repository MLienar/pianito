import { expect, type Page, test } from "@playwright/test";

const MOCK_EXERCISE = {
  id: "test-exercise-id",
  clef: "treble" as const,
  tempo: 60,
  notes: ["C4", "E4", "G4", "A4", "F4", "D4", "B4", "C5", "E4", "G4"],
  allowedNotes: ["C", "D", "E", "F", "G", "A", "B"],
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

test.describe("Level List Page", () => {
  test("renders heading, description, and scale groups", async ({ page }) => {
    await page.goto("/read");

    await expect(page.locator("h1")).toContainText("Read Music");
    await expect(page.getByText("Progress through scales")).toBeVisible();

    // There should be 10 scale group cards
    const groups = page.locator("h2");
    await expect(groups).toHaveCount(10);

    // First group is "First Notes"
    await expect(groups.first()).toContainText("First Notes");
  });

  test("each group has 4 step cards", async ({ page }) => {
    await page.goto("/read");

    // First group should show 4 step labels
    await expect(page.getByText("Introduction").first()).toBeVisible();
    await expect(page.getByText("Practice").first()).toBeVisible();
    await expect(page.getByText("Consolidation").first()).toBeVisible();
    await expect(page.getByText("Mastery").first()).toBeVisible();
  });

  test("clicking a level card navigates to the exercise page", async ({
    page,
  }) => {
    await mockExerciseApi(page);
    await page.goto("/read");

    // Click the first level card (level 1)
    await page.getByText("Introduction").first().click();

    await expect(page).toHaveURL(/\/read\/1$/);
    await expect(page.locator("h1")).toContainText("Level 1/");
  });
});

test.describe("Read Exercise Page", () => {
  test("displays idle state with staff, answer buttons, and instructions", async ({
    page,
  }) => {
    await mockExerciseApi(page);
    await page.goto("/read/1");

    await expect(page.locator("h1")).toContainText("Level 1/");
    await expect(page.getByText("Score: 0/10")).toBeVisible();
    await expect(
      page.locator("svg[role='img'][aria-label='Musical staff with notes']"),
    ).toBeVisible();
    await expect(page.getByText("Press any note button to begin")).toBeVisible();
  });

  test("shows back link to levels", async ({ page }) => {
    await mockExerciseApi(page);
    await page.goto("/read/1");

    const backLink = page.getByRole("link", { name: /Levels/ });
    await expect(backLink).toBeVisible();
  });

  test("displays all 7 answer buttons (C through B) enabled before start", async ({
    page,
  }) => {
    await mockExerciseApi(page);
    await page.goto("/read/1");

    for (const note of ["C", "D", "E", "F", "G", "A", "B"]) {
      const btn = page.getByRole("button", { name: note, exact: true });
      await expect(btn).toBeVisible();
      await expect(btn).toBeEnabled();
    }
  });

  test("pressing an answer button starts the exercise", async ({
    page,
  }) => {
    await mockExerciseApi(page);
    await page.goto("/read/1");

    // First note is C4 → answer C to start the exercise
    await page.getByRole("button", { name: "C", exact: true }).click();

    // Instructions should disappear once playing
    await expect(page.getByText("Press any note button to begin")).toBeHidden();
    await expect(page.getByText("Score: 1/10")).toBeVisible();
  });

  test("answering correctly shows feedback and increments score", async ({
    page,
  }) => {
    await mockExerciseApi(page);
    await page.goto("/read/1");

    // First note is C4 → answer C (also starts the exercise)
    await page.getByRole("button", { name: "C", exact: true }).click();

    await expect(page.getByText("Correct!")).toBeVisible();
    await expect(page.getByText("Score: 1/10")).toBeVisible();
  });

  test("answering incorrectly shows wrong feedback without incrementing score", async ({
    page,
  }) => {
    await mockExerciseApi(page);
    await page.goto("/read/1");

    // First note is C4 → answer D (wrong, also starts the exercise)
    await page.getByRole("button", { name: "D", exact: true }).click();

    await expect(page.getByText("Wrong!")).toBeVisible();
    await expect(page.getByText("Score: 0/10")).toBeVisible();
  });

  test("keyboard input works for answering notes", async ({ page }) => {
    await mockExerciseApi(page);
    await page.goto("/read/1");

    // First note is C4 → press "c" key (also starts the exercise)
    await page.keyboard.press("c");

    await expect(page.getByText("Correct!")).toBeVisible();
    await expect(page.getByText("Score: 1/10")).toBeVisible();
  });

  test("completing all notes shows results with Retry and Next Level buttons", async ({
    page,
  }) => {
    await mockExerciseApi(page);
    await page.goto("/read/1");
    // At tempo 60 and NOTE_SPACING 100, each note takes 1s.
    // First answer also starts the exercise.
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
    await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Next Level" }),
    ).toBeVisible();
  });

  test("Retry button resets and fetches a new exercise", async ({ page }) => {
    await mockExerciseApi(page);
    await page.goto("/read/1");

    // At tempo 60 and NOTE_SPACING 100, each note takes 1s.
    // First answer also starts the exercise.
    for (let i = 0; i < EXPECTED_LETTERS.length; i++) {
      if (i > 0) {
        await page.waitForTimeout(1050);
      }
      await page.keyboard.press(EXPECTED_LETTERS[i].toLowerCase());
    }

    await expect(page.getByText("Exercise Complete!")).toBeVisible({
      timeout: 15000,
    });

    // Click Retry
    const apiRequest = page.waitForRequest("**/api/exercises/notation*");
    await page.getByRole("button", { name: "Retry" }).click();
    await apiRequest;

    // Should be back in idle state
    await expect(page.getByText("Press any note button to begin")).toBeVisible();
    await expect(page.getByText("Score: 0/10")).toBeVisible();
  });

  test("Next Level button navigates to next level", async ({ page }) => {
    await mockExerciseApi(page);
    await page.goto("/read/1");

    // At tempo 60 and NOTE_SPACING 100, each note takes 1s.
    // First answer also starts the exercise.
    for (let i = 0; i < EXPECTED_LETTERS.length; i++) {
      if (i > 0) {
        await page.waitForTimeout(1050);
      }
      await page.keyboard.press(EXPECTED_LETTERS[i].toLowerCase());
    }

    await expect(page.getByText("Exercise Complete!")).toBeVisible({
      timeout: 15000,
    });

    // Click Next Level
    await page.getByRole("button", { name: "Next Level" }).click();

    await expect(page).toHaveURL(/\/read\/2$/);
  });

  test("back link navigates to level list", async ({ page }) => {
    await mockExerciseApi(page);
    await page.goto("/read/1");

    await page.getByRole("link", { name: /Levels/ }).click();

    await expect(page).toHaveURL(/\/read$/);
    await expect(page.locator("h1")).toContainText("Read Music");
  });

  test("shows error state with retry button when API fails", async ({
    page,
  }) => {
    await mockExerciseApiError(page);
    await page.goto("/read/1");

    await expect(page.getByText(/Failed to load exercise/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
  });

  test("retry button re-fetches the exercise on error", async ({ page }) => {
    await mockExerciseApiError(page);
    await page.goto("/read/1");

    await expect(page.getByText(/Failed to load exercise/)).toBeVisible();

    // Now mock a successful response and retry
    await page.unrouteAll();
    await mockExerciseApi(page);
    await page.getByRole("button", { name: "Retry" }).click();

    await expect(page.getByText("Press any note button to begin")).toBeVisible();
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
    await page.goto("/read/1");

    await expect(page.getByText("Loading exercise...")).toBeVisible();
    await expect(page.getByText("Press any note button to begin")).toBeVisible({
      timeout: 5000,
    });
  });
});
