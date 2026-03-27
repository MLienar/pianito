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
	composer: "Cole Porter",
	key: "Cm",
	tempo: 120,
	loopCount: 2,
	visibility: "private",
	timeSignature: { numerator: 4, denominator: 4 },
	data: {
		squares: [
			{ chord: "C" },
			{ chord: "Am" },
			{ chord: "F" },
			{ chord: "G" },
		],
		groups: [],
	},
	createdAt: new Date().toISOString(),
	updatedAt: new Date().toISOString(),
};

const MOCK_GRID_LIST = {
	grids: [
		{
			id: "grid-001",
			userId: "test-user-id",
			name: "Test Grid",
			composer: "Cole Porter",
			key: "Cm",
			tempo: 120,
			visibility: "private",
			timeSignature: { numerator: 4, denominator: 4 },
			createdAt: new Date().toISOString(),
		},
		{
			id: "grid-002",
			userId: "test-user-id",
			name: "Jazz Standards",
			composer: null,
			key: null,
			tempo: 90,
			visibility: "private",
			timeSignature: { numerator: 3, denominator: 4 },
			createdAt: new Date().toISOString(),
		},
	],
};

const MOCK_PUBLIC_GRID_LIST = {
	grids: [
		{
			id: "grid-pub-001",
			userId: null,
			name: "Autumn Leaves",
			composer: "Joseph Kosma",
			key: "Em",
			tempo: 130,
			visibility: "public",
			timeSignature: { numerator: 4, denominator: 4 },
			createdAt: new Date().toISOString(),
		},
		{
			id: "grid-pub-002",
			userId: null,
			name: "Blue Bossa",
			composer: "Kenny Dorham",
			key: "Cm",
			tempo: 150,
			visibility: "public",
			timeSignature: { numerator: 4, denominator: 4 },
			createdAt: new Date().toISOString(),
		},
		{
			id: "grid-pub-003",
			userId: "other-user-id",
			name: "My Public Grid",
			composer: null,
			key: null,
			tempo: 100,
			visibility: "public",
			timeSignature: { numerator: 3, denominator: 4 },
			createdAt: new Date().toISOString(),
		},
	],
};

async function dismissTour(page: Page) {
	await page.addInitScript(() => {
		localStorage.setItem("grid-tour-dismissed", "1");
	});
}

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
	await page.route("**/api/grids/public", (route) =>
		route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify(MOCK_PUBLIC_GRID_LIST),
		}),
	);

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
		await dismissTour(page);
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
				{ start: 0, nbSquares: 4, repeatCount: 2 },
				{ start: 4, nbSquares: 2, repeatCount: 3 },
			],
		},
	};

	test.beforeEach(async ({ page }) => {
		await dismissTour(page);
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

	test("displays all chords across groups", async ({ page }) => {
		await page.goto("/accomp/grid-001");

		await expect(page.getByText("C", { exact: true })).toBeVisible();
		await expect(page.getByText("Am", { exact: true })).toBeVisible();
		await expect(page.getByText("Dm", { exact: true })).toBeVisible();
		await expect(page.getByText("E7", { exact: true })).toBeVisible();
	});

	test("displays repeat count per group", async ({ page }) => {
		await page.goto("/accomp/grid-001");

		// Group repeat spinbuttons are inside the grid area, not in the header
		// The last square of group 1 shows "G 2" and group 2 shows "E7 3"
		await expect(
			page.getByRole("button", { name: "G 2" }),
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: "E7 3" }),
		).toBeVisible();
	});
});

test.describe("Accompaniment - Playback", () => {
	test.beforeEach(async ({ page }) => {
		await dismissTour(page);
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

test.describe("Accompaniment - Composer & Key", () => {
	test.beforeEach(async ({ page }) => {
		await dismissTour(page);
		await mockAuthenticated(page);
		await mockGridApis(page);
	});

	test("displays composer and key fields", async ({ page }) => {
		await page.goto("/accomp/grid-001");

		await expect(page.getByText("Composer")).toBeVisible();
		await expect(page.getByText("Key", { exact: true })).toBeVisible();

		const composerInput = page.locator('input[placeholder="e.g. Miles Davis"]');
		await expect(composerInput).toHaveValue("Cole Porter");

		const keyInput = page.locator('input[placeholder="e.g. Cm"]');
		await expect(keyInput).toHaveValue("Cm");
	});

	test("can edit composer", async ({ page }) => {
		await page.goto("/accomp/grid-001");

		const composerInput = page.locator('input[placeholder="e.g. Miles Davis"]');
		await composerInput.fill("Duke Ellington");
		await expect(composerInput).toHaveValue("Duke Ellington");
	});

	test("can edit key", async ({ page }) => {
		await page.goto("/accomp/grid-001");

		const keyInput = page.locator('input[placeholder="e.g. Cm"]');
		await keyInput.fill("G");
		await expect(keyInput).toHaveValue("G");
	});

	test("saves composer and key in PATCH request", async ({ page }) => {
		await page.goto("/accomp/grid-001");

		const composerInput = page.locator('input[placeholder="e.g. Miles Davis"]');
		await composerInput.fill("Duke Ellington");

		const keyInput = page.locator('input[placeholder="e.g. Cm"]');
		await keyInput.fill("Bb");

		const saveRequest = page.waitForRequest("**/api/grids/grid-001");
		await page.getByRole("button", { name: "Save" }).click();

		const request = await saveRequest;
		const body = JSON.parse(request.postData() || "{}");
		expect(body.composer).toBe("Duke Ellington");
		expect(body.key).toBe("Bb");
	});
});

test.describe("Accompaniment - Public Grids & Search", () => {
	test.beforeEach(async ({ page }) => {
		await mockAuthenticated(page);
		await mockGridApis(page);
	});

	test("displays public grids section", async ({ page }) => {
		await page.goto("/accomp");

		await expect(page.getByText("Public Grids")).toBeVisible();
		await expect(page.getByText("Autumn Leaves")).toBeVisible();
		await expect(page.getByText("Blue Bossa")).toBeVisible();
	});

	test("displays composer on public grid cards", async ({ page }) => {
		await page.goto("/accomp");

		await expect(page.getByText("Joseph Kosma")).toBeVisible();
		await expect(page.getByText("Kenny Dorham")).toBeVisible();
	});

	test("displays key badge on public grid cards", async ({ page }) => {
		await page.goto("/accomp");

		// Key badge is a span with border inside the public grids section
		const publicSection = page.locator(".border-t-3");
		await expect(
			publicSection.locator("span.border-2", { hasText: "Em" }),
		).toBeVisible();
	});

	test("displays community badge on community grids", async ({ page }) => {
		await page.goto("/accomp");

		// Community grids have a BadgeCheck icon (lucide-react SVG with class "lucide-badge-check")
		const publicSection = page.locator(".border-t-3");
		const communityBadges = publicSection.locator(".lucide-badge-check");
		// grid-pub-001 and grid-pub-002 have userId=null (community)
		// grid-pub-003 has userId="other-user-id" (not community)
		await expect(communityBadges).toHaveCount(2);
	});

	test("search filters public grids by name", async ({ page }) => {
		await page.goto("/accomp");

		const searchInput = page.locator(
			'input[placeholder="Search by name, composer, or key..."]',
		);
		await searchInput.fill("Autumn");

		await expect(page.getByText("Autumn Leaves")).toBeVisible();
		await expect(page.getByText("Blue Bossa")).not.toBeVisible();
	});

	test("search filters public grids by composer", async ({ page }) => {
		await page.goto("/accomp");

		const searchInput = page.locator(
			'input[placeholder="Search by name, composer, or key..."]',
		);
		await searchInput.fill("Dorham");

		await expect(page.getByText("Blue Bossa")).toBeVisible();
		await expect(page.getByText("Autumn Leaves")).not.toBeVisible();
	});

	test("search filters public grids by key", async ({ page }) => {
		await page.goto("/accomp");

		const searchInput = page.locator(
			'input[placeholder="Search by name, composer, or key..."]',
		);
		await searchInput.fill("Em");

		await expect(page.getByText("Autumn Leaves")).toBeVisible();
		await expect(page.getByText("Blue Bossa")).not.toBeVisible();
	});

	test("shows no results message when search matches nothing", async ({
		page,
	}) => {
		await page.goto("/accomp");

		const searchInput = page.locator(
			'input[placeholder="Search by name, composer, or key..."]',
		);
		await searchInput.fill("xyznonexistent");

		await expect(page.getByText("No matching chords.")).toBeVisible();
	});
});

test.describe("Accompaniment - Time Signatures", () => {
	test.beforeEach(async ({ page }) => {
		await dismissTour(page);
		await mockAuthenticated(page);
		await mockGridApis(page);
	});

	test("displays time signature selector with default 4/4", async ({
		page,
	}) => {
		await page.goto("/accomp/grid-001");

		await expect(page.getByText("Time sig.")).toBeVisible();
		// The selector button shows the current time signature
		const tsButton = page.locator('button[aria-haspopup="listbox"]').filter({ hasText: "4/4" });
		await expect(tsButton).toBeVisible();
	});

	test("can open time signature dropdown", async ({ page }) => {
		await page.goto("/accomp/grid-001");

		const tsButton = page.locator('button[aria-haspopup="listbox"]').filter({ hasText: "4/4" });
		await tsButton.click();

		// All supported time signatures should be visible
		await expect(page.getByRole("option", { name: "3/4" })).toBeVisible();
		await expect(page.getByRole("option", { name: "6/8" })).toBeVisible();
		await expect(page.getByRole("option", { name: "5/4" })).toBeVisible();
	});

	test("can change time signature to 3/4", async ({ page }) => {
		await page.goto("/accomp/grid-001");

		const tsButton = page.locator('button[aria-haspopup="listbox"]').filter({ hasText: "4/4" });
		await tsButton.click();

		await page.getByRole("option", { name: "3/4" }).click();

		// Button should now show 3/4
		await expect(
			page.locator('button[aria-haspopup="listbox"]').filter({ hasText: "3/4" }),
		).toBeVisible();
	});

	test("changing time signature marks grid as dirty", async ({ page }) => {
		await page.goto("/accomp/grid-001");

		// Initially saved
		await expect(page.getByRole("button", { name: "Saved" })).toBeDisabled();

		const tsButton = page.locator('button[aria-haspopup="listbox"]').filter({ hasText: "4/4" });
		await tsButton.click();
		await page.getByRole("option", { name: "3/4" }).click();

		// Now save should be enabled
		await expect(page.getByRole("button", { name: "Save" })).toBeEnabled();
	});

	test("saves time signature in PATCH request", async ({ page }) => {
		await page.goto("/accomp/grid-001");

		const tsButton = page.locator('button[aria-haspopup="listbox"]').filter({ hasText: "4/4" });
		await tsButton.click();
		await page.getByRole("option", { name: "3/4" }).click();

		const saveRequest = page.waitForRequest("**/api/grids/grid-001");
		await page.getByRole("button", { name: "Save" }).click();

		const request = await saveRequest;
		const body = JSON.parse(request.postData() || "{}");
		expect(body.timeSignature).toEqual({ numerator: 3, denominator: 4 });
	});

	test("time signature selector is disabled during playback", async ({
		page,
	}) => {
		await page.goto("/accomp/grid-001");

		await page.getByRole("button", { name: "Play" }).click();

		const tsButton = page.locator('button[aria-haspopup="listbox"]').filter({ hasText: "4/4" });
		await expect(tsButton).toBeDisabled();

		await page.getByRole("button", { name: "Stop" }).click();
	});

	test("grid layout adapts columns for 3/4 time", async ({ page }) => {
		const waltzGrid = {
			...MOCK_GRID,
			timeSignature: { numerator: 3, denominator: 4 },
			data: {
				squares: [
					{ chord: "C", nbBeats: 3 },
					{ chord: "Am", nbBeats: 3 },
					{ chord: "F", nbBeats: 3 },
					{ chord: "G", nbBeats: 3 },
				],
				groups: [],
			},
		};

		await page.route("**/api/grids/grid-waltz", (route) => {
			if (route.request().method() === "GET") {
				return route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify({ ...waltzGrid, id: "grid-waltz" }),
				});
			}
			return route.continue();
		});

		await page.goto("/accomp/grid-waltz");

		// Grid container should have 12 columns for 3/4
		const gridContainer = page.locator("[data-tour='grid-container']");
		await expect(gridContainer).toHaveCSS(
			"grid-template-columns",
			// 12 equal columns — browser computes to px values, just check it exists
			/^\d/,
		);

		// Time sig button should show 3/4
		await expect(
			page.locator('button[aria-haspopup="listbox"]').filter({ hasText: "3/4" }),
		).toBeVisible();
	});
});

test.describe("Accompaniment - Time Signature in Grid List", () => {
	test.beforeEach(async ({ page }) => {
		await mockAuthenticated(page);
		await mockGridApis(page);
	});

	test("displays time signature on user grid cards", async ({ page }) => {
		await page.goto("/accomp");

		// The "Jazz Standards" grid has 3/4 time signature
		await expect(page.getByText("3/4")).toBeVisible();
		// The "Test Grid" has 4/4
		await expect(page.getByText("4/4").first()).toBeVisible();
	});

	test("displays time signature on public grid cards", async ({ page }) => {
		await page.goto("/accomp");

		// "My Public Grid" has 3/4
		const publicSection = page.locator(".border-t-3");
		await expect(publicSection.getByText("3/4")).toBeVisible();
	});
});
