import { expect, test } from "@playwright/test";

test("debug settings network", async ({ page }) => {
	page.on("request", (req) => {
		const url = req.url();
		if (url.includes("auth") || url.includes("session") || url.includes("preferences")) {
			console.log(`REQUEST: ${req.method()} ${url}`);
		}
	});

	page.on("response", (res) => {
		const url = res.url();
		if (url.includes("auth") || url.includes("session") || url.includes("preferences")) {
			console.log(`RESPONSE: ${res.status()} ${url}`);
		}
	});

	// Set up route mocks BEFORE navigation
	await page.route("**/*session*", (route) => {
		console.log(`ROUTE INTERCEPTED: ${route.request().url()}`);
		return route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({
				session: { id: "s1", userId: "u1", token: "t1", expiresAt: new Date(Date.now() + 86400000).toISOString() },
				user: { id: "u1", name: "Test", email: "t@t.com", emailVerified: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), image: null },
			}),
		});
	});

	await page.goto("/settings");
	await page.waitForTimeout(5000);

	console.log("PAGE URL:", page.url());
	const h1 = await page.locator("h1").count();
	console.log("H1 COUNT:", h1);
	if (h1 > 0) {
		console.log("H1 TEXT:", await page.locator("h1").textContent());
	}
	const body = await page.locator("body").textContent();
	console.log("BODY TEXT:", body?.substring(0, 200));
});
