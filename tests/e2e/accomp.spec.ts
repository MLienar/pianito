import { type Page, expect, test } from "@playwright/test";

const MOCK_SESSION = {
	session: {
		id: "test-session-id",
		userId: "test-user-id",
		token: "test-token",
		expiresAt: new Date(Date.now() + 86400000).toISOString(),
	},
	user: {
		id: "test-user-id",
		name: "Test User",
		email: "test@example.com",
		emailVerified: true,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		image: null,
	},
};

const MOCK_GRID = {
	id: "grid-001",
	userId: "test-user-id",
	name: "Test Grid",
	tempo: 120,
	loopCount: 2,
	data: {
		squares: [
			{ chord: "C" },
			{ chord: "Am" },
			{ chord: "F" },
			{ chord: "G" },
		],
		groups: [{ squareCount: 4, repeatCount: 1 }],
	},
	createdAt: new Date().toISOString(),
	updatedAt: new Date().toISOString(),
};

const MOCK_GRID_LIST = {
	grids: [
		{
			id: "grid-001",
			name: "Test Grid",
			tempo: 120,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		},
		{
			id: "grid-002",
			name: "Jazz Standards",
			tempo: 90,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		},
	],
};

async function mockAuthenticated(page: Page) {
	await page.route("**/api/auth/get-session", (route) =>
		route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify(MOCK_SESSION),
		}),
	);
	await page.route("**/api/preferences", (route) =>
		route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({
				userId: "test-user-id",
				language: "en",
				notation: "letter",
				theme: "default",
			}),
		}),
	);
}

async function mockGridApis(page: Page) {
	await page.route("**/api/grids", (route) => {
		if (route.request().method() === "GET") {
			return route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(MOCK_GRID_LIST),
			});
		}
		if (route.request().method() === "POST") {
			return route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(MOCK_GRID),
			});
		}
		return route.continue();
	});

	await page.route("**/api/grids/grid-001", (route) => {
		if (route.request().method() === "GET") {
			return route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(MOCK_GRID),
			});
		}
		if (route.request().method() === "PATCH") {
			return route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					...MOCK_GRID,
					...JSON.parse(route.request().postData() || "{}"),
					updatedAt: new Date().toISOString(),
				}),
			});
		}
		if (route.request().method() === "DELETE") {
			return route.fulfill({ status: 200 });
		}
		return route.continue();
	});
}

test.describe("Accompaniment - Grid List", () => {
	test.beforeEach(async ({ page }) => {
		await mockAuthenticated(page);
		await mockGridApis(page);
	});

	test("displays grid list with existing grids", async ({ page }) => {
		await page.goto("/accomp");

		await expect(page.getByText("Accompaniment")).toBeVisible();
		await expect(page.getByText("Test Grid")).toBeVisible();
		await expect(page.getByText("Jazz Standards")).toBeVisible();
	});

	test("shows create new grid button", async ({ page }) => {
		await page.goto("/accomp");

		await expect(page.getByText("Create New Grid")).toBeVisible();
	});

	test("navigates to grid editor when clicking a grid", async ({ page }) => {
		await page.goto("/accomp");

		await page.getByText("Test Grid").click();
		await expect(page).toHaveURL(/\/accomp\/grid-001/);
	});

	test("creates a new grid and navigates to editor", async ({ page }) => {
		await page.goto("/accomp");

		await page.getByText("Create New Grid").click();
		await expect(page).toHaveURL(/\/accomp\/grid-001/);
	});
});

test.describe("Accompaniment - Grid Editor", () => {
	test.beforeEach(async ({ page }) => {
		await mockAuthenticated(page);
		await mockGridApis(page);
	});

	test("loads grid and displays squares with chords", async ({ page }) => {
		await page.goto("/accomp/grid-001");

		await expect(page.getByText("C", { exact: true })).toBeVisible();
		await expect(page.getByText("Am", { exact: true })).toBeVisible();
		await expect(page.getByText("F", { exact: true })).toBeVisible();
		await expect(page.getByText("G", { exact: true })).toBeVisible();
	});

	test("displays grid name", async ({ page }) => {
		await page.goto("/accomp/grid-001");

		await expect(page.getByText("Test Grid")).toBeVisible();
	});

	test("displays tempo and loop count", async ({ page }) => {
		await page.goto("/accomp/grid-001");

		const tempoInput = page.locator("input#tempo");
		await expect(tempoInput).toHaveValue("120");

		const loopInput = page.locator("input#loops");
		await expect(loopInput).toHaveValue("2");
	});

	test("can edit grid name", async ({ page }) => {
		await page.goto("/accomp/grid-001");

		await page.getByText("Test Grid").click();

		const nameInput = page.locator(
			'input[type="text"].border-b-3',
		);
		await expect(nameInput).toBeVisible();
		await nameInput.fill("Renamed Grid");
		await nameInput.press("Enter");

		await expect(page.getByText("Renamed Grid")).toBeVisible();
	});

	test("can change tempo", async ({ page }) => {
		await page.goto("/accomp/grid-001");

		const tempoInput = page.locator("input#tempo");
		await tempoInput.fill("140");

		await expect(tempoInput).toHaveValue("140");
	});

	test("can open chord search on square click", async ({ page }) => {
		await page.goto("/accomp/grid-001");

		await page.locator("button").filter({ hasText: /^C$/ }).click();

		await expect(
			page.locator('input[placeholder="Search chord..."]'),
		).toBeVisible();
	});

	test("can select a chord from search", async ({ page }) => {
		await page.goto("/accomp/grid-001");

		await page.locator("button").filter({ hasText: /^C$/ }).click();

		const searchInput = page.locator('input[placeholder="Search chord..."]');
		await searchInput.fill("Dm");

		await page.locator("button").filter({ hasText: /^Dm$/ }).click();

		await expect(page.getByText("Dm", { exact: true })).toBeVisible();
	});

	test("can add a new square", async ({ page }) => {
		await page.goto("/accomp/grid-001");

		const addButton = page.locator("button").filter({ hasText: "+" }).last();
		await addButton.click();

		const emptyButtons = page.getByRole("button", { name: "Empty" });
		await expect(emptyButtons.first()).toBeVisible();
	});

	test("can save grid", async ({ page }) => {
		await page.goto("/accomp/grid-001");

		const tempoInput = page.locator("input#tempo");
		await tempoInput.fill("140");

		const saveButton = page.getByRole("button", { name: "Save" });
		await expect(saveButton).toBeEnabled();

		const saveRequest = page.waitForRequest("**/api/grids/grid-001");
		await saveButton.click();

		const request = await saveRequest;
		expect(request.method()).toBe("PATCH");
		const body = JSON.parse(request.postData() || "{}");
		expect(body.tempo).toBe(140);
	});

	test("save button shows 'Saved' when no changes", async ({ page }) => {
		await page.goto("/accomp/grid-001");

		await expect(
			page.getByRole("button", { name: "Saved" }),
		).toBeDisabled();
	});

	test("can navigate back to grid list", async ({ page }) => {
		await page.goto("/accomp/grid-001");

		await page.getByRole("link", { name: "←" }).click();
		await expect(page).toHaveURL(/\/accomp\/?$/);
	});

	test("can clear a chord from a square", async ({ page }) => {
		await page.goto("/accomp/grid-001");

		await page.locator("button").filter({ hasText: /^C$/ }).click();

		const clearButton = page.locator("button").filter({ hasText: /^Clear$/ });
		await clearButton.click();

		await expect(page.locator("button").filter({ hasText: /^Empty$/ }).first()).toBeVisible();
	});

	test("can change group repeat count", async ({ page }) => {
		await page.goto("/accomp/grid-001");

		const repeatInput = page.locator('input[id^="group-repeat-"]').first();
		await expect(repeatInput).toHaveValue("1");

		await repeatInput.fill("3");
		await expect(repeatInput).toHaveValue("3");
	});
});

test.describe("Accompaniment - Grid Editor with Groups", () => {
	const MULTI_GROUP_GRID = {
		...MOCK_GRID,
		data: {
			squares: [
				{ chord: "C" },
				{ chord: "Am" },
				{ chord: "F" },
				{ chord: "G" },
				{ chord: "Dm" },
				{ chord: "E7" },
			],
			groups: [
				{ squareCount: 4, repeatCount: 2 },
				{ squareCount: 2, repeatCount: 1 },
			],
		},
	};

	test.beforeEach(async ({ page }) => {
		await mockAuthenticated(page);

		await page.route("**/api/grids/grid-001", (route) => {
			if (route.request().method() === "GET") {
				return route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify(MULTI_GROUP_GRID),
				});
			}
			if (route.request().method() === "PATCH") {
				return route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify({
						...MULTI_GROUP_GRID,
						...JSON.parse(route.request().postData() || "{}"),
					}),
				});
			}
			return route.continue();
		});
	});

	test("displays multiple groups with separator", async ({ page }) => {
		await page.goto("/accomp/grid-001");

		await expect(page.getByText("C", { exact: true })).toBeVisible();
		await expect(page.getByText("E7", { exact: true })).toBeVisible();

		await expect(
			page.getByRole("button", { name: "Merge groups" }),
		).toBeVisible();
	});

	test("displays repeat count per group", async ({ page }) => {
		await page.goto("/accomp/grid-001");

		const repeatInputs = page.locator('input[id^="group-repeat-"]');
		await expect(repeatInputs.first()).toHaveValue("2");
		await expect(repeatInputs.nth(1)).toHaveValue("1");
	});

	test("can merge groups", async ({ page }) => {
		await page.goto("/accomp/grid-001");

		await page.getByRole("button", { name: "Merge groups" }).click();

		const repeatInputs = page.locator('input[id^="group-repeat-"]');
		await expect(repeatInputs).toHaveCount(1);
	});
});

test.describe("Accompaniment - Playback", () => {
	test.beforeEach(async ({ page }) => {
		await mockAuthenticated(page);
		await mockGridApis(page);
	});

	test("can start and stop playback", async ({ page }) => {
		await page.goto("/accomp/grid-001");

		const playButton = page.getByRole("button", { name: "Play" });
		await expect(playButton).toBeVisible();

		await playButton.click();

		const stopButton = page.getByRole("button", { name: "Stop" });
		await expect(stopButton).toBeVisible();

		await stopButton.click();

		await expect(
			page.getByRole("button", { name: "Play" }),
		).toBeVisible();
	});

	test("tempo and loop inputs are disabled during playback", async ({
		page,
	}) => {
		await page.goto("/accomp/grid-001");

		await page.getByRole("button", { name: "Play" }).click();

		await expect(page.locator("input#tempo")).toBeDisabled();
		await expect(page.locator("input#loops")).toBeDisabled();

		await page.getByRole("button", { name: "Stop" }).click();
	});
});
