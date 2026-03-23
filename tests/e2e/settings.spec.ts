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

const DEFAULT_PREFERENCES = {
	userId: "test-user-id",
	language: "en",
	notation: "letter",
	theme: "default",
};

async function mockAuthenticatedUser(
	page: Page,
	preferences = DEFAULT_PREFERENCES,
) {
	await page.route("**/api/auth/get-session", (route) =>
		route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify(MOCK_SESSION),
		}),
	);

	await page.route("**/api/preferences", (route) => {
		if (route.request().method() === "GET") {
			return route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(preferences),
			});
		}
		if (route.request().method() === "PATCH") {
			return route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					...preferences,
					...JSON.parse(route.request().postData() || "{}"),
				}),
			});
		}
		return route.continue();
	});
}

test.describe("Settings Page", () => {
	test("redirects to login when not authenticated", async ({ page }) => {
		await page.route("**/api/auth/get-session", (route) =>
			route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({ session: null, user: null }),
			}),
		);

		await page.goto("/settings");
		await expect(page).toHaveURL(/\/login/);
	});

	test("displays all settings sections", async ({ page }) => {
		await mockAuthenticatedUser(page);
		await page.goto("/settings");

		await expect(page.locator("h1")).toContainText("Settings");

		// Language section
		await expect(page.getByRole("heading", { name: "Language" })).toBeVisible();
		await expect(page.getByText("English")).toBeVisible();
		await expect(page.getByText("Français")).toBeVisible();
		await expect(page.getByText("Español")).toBeVisible();
		await expect(page.getByText("中文")).toBeVisible();

		// Notation section
		await expect(page.getByRole("heading", { name: "Notation" })).toBeVisible();
		await expect(page.getByText("A B C D E F G")).toBeVisible();
		await expect(page.getByText("Do Ré Mi Fa Sol La Si")).toBeVisible();

		// Theme section
		await expect(page.getByRole("heading", { name: "Theme" })).toBeVisible();
		await expect(page.getByText("Cream")).toBeVisible();
		await expect(page.getByText("Ocean")).toBeVisible();
		await expect(page.getByText("Forest")).toBeVisible();
		await expect(page.getByText("Sunset")).toBeVisible();
		await expect(page.getByText("Midnight")).toBeVisible();

		// Danger zone
		await expect(page.getByText("Danger Zone")).toBeVisible();
		await expect(
			page.getByRole("button", { name: "Delete Account" }),
		).toBeVisible();
	});

	test("highlights the current language preference", async ({ page }) => {
		await mockAuthenticatedUser(page);
		await page.goto("/settings");

		const englishButton = page.getByRole("button", { name: "English" });
		await expect(englishButton).toBeVisible();
		await expect(englishButton).toHaveClass(/bg-primary/);

		const frenchButton = page.getByRole("button", { name: "Français" });
		await expect(frenchButton).not.toHaveClass(/bg-primary/);
	});

	test("highlights the current notation preference", async ({ page }) => {
		await mockAuthenticatedUser(page);
		await page.goto("/settings");

		const letterButton = page.getByRole("button", {
			name: "A B C D E F G",
		});
		await expect(letterButton).toHaveClass(/bg-primary/);

		const solfegeButton = page.getByRole("button", {
			name: "Do Ré Mi Fa Sol La Si",
		});
		await expect(solfegeButton).not.toHaveClass(/bg-primary/);
	});

	test("highlights the current theme preference", async ({ page }) => {
		await mockAuthenticatedUser(page);
		await page.goto("/settings");

		const creamButton = page.getByRole("button", { name: "Cream" });
		await expect(creamButton).toHaveClass(/bg-primary/);
	});
});

test.describe("Settings - Language Selection", () => {
	test("sends PATCH request when changing language", async ({ page }) => {
		await mockAuthenticatedUser(page);
		await page.goto("/settings");

		const patchPromise = page.waitForRequest(
			(req) =>
				req.url().includes("/api/preferences") &&
				req.method() === "PATCH",
		);

		await page.getByRole("button", { name: "Français" }).click();

		const patchReq = await patchPromise;
		const body = JSON.parse(patchReq.postData() || "{}");
		expect(body).toEqual({ language: "fr" });
	});
});

test.describe("Settings - Notation Selection", () => {
	test("sends PATCH request when changing notation", async ({ page }) => {
		await mockAuthenticatedUser(page);
		await page.goto("/settings");

		const patchPromise = page.waitForRequest(
			(req) =>
				req.url().includes("/api/preferences") &&
				req.method() === "PATCH",
		);

		await page
			.getByRole("button", { name: "Do Ré Mi Fa Sol La Si" })
			.click();

		const patchReq = await patchPromise;
		const body = JSON.parse(patchReq.postData() || "{}");
		expect(body).toEqual({ notation: "solfege" });
	});
});

test.describe("Settings - Theme Selection", () => {
	test("sends PATCH request when changing theme", async ({ page }) => {
		await mockAuthenticatedUser(page);
		await page.goto("/settings");

		const patchPromise = page.waitForRequest(
			(req) =>
				req.url().includes("/api/preferences") &&
				req.method() === "PATCH",
		);

		await page.getByRole("button", { name: "Ocean" }).click();

		const patchReq = await patchPromise;
		const body = JSON.parse(patchReq.postData() || "{}");
		expect(body).toEqual({ theme: "ocean" });
	});
});

test.describe("Settings - Delete Account", () => {
	test("opens delete confirmation modal", async ({ page }) => {
		await mockAuthenticatedUser(page);
		await page.goto("/settings");

		await page.getByRole("button", { name: "Delete Account" }).click();

		await expect(
			page.locator("dialog").getByText("Delete Account"),
		).toBeVisible();
		await expect(
			page.locator('input[placeholder="DELETE"]'),
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: "Cancel" }),
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: "Delete My Account" }),
		).toBeVisible();
	});

	test("delete button is disabled until typing DELETE", async ({ page }) => {
		await mockAuthenticatedUser(page);
		await page.goto("/settings");

		await page.getByRole("button", { name: "Delete Account" }).click();

		const deleteButton = page.getByRole("button", {
			name: "Delete My Account",
		});
		await expect(deleteButton).toBeDisabled();

		// Type partial text
		await page.locator('input[placeholder="DELETE"]').fill("DEL");
		await expect(deleteButton).toBeDisabled();

		// Type full confirmation
		await page.locator('input[placeholder="DELETE"]').fill("DELETE");
		await expect(deleteButton).toBeEnabled();
	});

	test("cancel closes the modal", async ({ page }) => {
		await mockAuthenticatedUser(page);
		await page.goto("/settings");

		await page.getByRole("button", { name: "Delete Account" }).click();
		await expect(page.locator("dialog[open]")).toBeVisible();

		await page.getByRole("button", { name: "Cancel" }).click();
		await expect(page.locator("dialog[open]")).not.toBeVisible();
	});

	test("confirms deletion and redirects to home", async ({ page }) => {
		await mockAuthenticatedUser(page);

		await page.route("**/api/account", (route) => {
			if (route.request().method() === "DELETE") {
				return route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify({ success: true }),
				});
			}
			return route.continue();
		});

		await page.route("**/api/auth/sign-out", (route) =>
			route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({ success: true }),
			}),
		);

		await page.goto("/settings");

		await page.getByRole("button", { name: "Delete Account" }).click();
		await page.locator('input[placeholder="DELETE"]').fill("DELETE");
		await page.getByRole("button", { name: "Delete My Account" }).click();

		await expect(page).toHaveURL("/", { timeout: 10000 });
	});
});
