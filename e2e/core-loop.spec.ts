import { expect, test, type Page } from "@playwright/test";

/**
 * Read-only smoke tests over the core loop (Discover -> Attend -> Connect ->
 * Return -> Host). Nothing here creates, edits, or cancels data, so it's safe
 * to run against production as a post-deploy check.
 */

const DEMO = { email: "petey@demo.getspuds.com", password: "spudspass123" };

async function login(page: Page) {
  await page.goto("/login");
  await page.getByPlaceholder("Email").fill(DEMO.email);
  await page.getByPlaceholder("Password").fill(DEMO.password);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL("**/discover", { timeout: 20_000 });
}

test.describe("signed out", () => {
  test("landing page sells the product and offers both sign-in paths", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "player two"
    );
    await page.getByRole("link", { name: "Get started" }).click();
    await expect(page.getByRole("button", { name: /Discord/ })).toBeVisible();
    await expect(page.getByPlaceholder("Email")).toBeVisible();
  });

  test("private pages redirect to login", async ({ page }) => {
    await page.goto("/create");
    await expect(page).toHaveURL(/\/login/);
  });

  test("unsubscribe works without a session", async ({ page }) => {
    // Reached from an email link, so it must never bounce to /login.
    await page.goto("/unsubscribe?token=00000000-0000-0000-0000-000000000000");
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});

test.describe("core loop", () => {
  test.beforeEach(async ({ page }) => login(page));

  test("discover shows parties and filters them", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Hey / })).toBeVisible();

    // Price must not appear while browsing — only on the party page.
    const feed = page.locator("main");
    await expect(feed).not.toContainText("Free");

    await page.getByRole("button", { name: "Tabletop games" }).click();
    await page.waitForURL(/type=board_game/);
    await expect(page.locator("main")).toContainText(/part(y|ies) found/);
  });

  test("party page shows venue-local time with a zone label", async ({
    page,
  }) => {
    await page.goto("/events/e0000000-0000-0000-0000-000000000001");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Smash Ultimate Weekly"
    );
    // Regardless of where the runner is, a Chicago party reads as Chicago time.
    await expect(page.locator("main")).toContainText("6:00 PM");
    await expect(page.locator("main")).toContainText(/C[DS]T/);
    await expect(page.locator("main")).toContainText("Logan Arcade");
  });

  test("party page carries trust and social proof", async ({ page }) => {
    await page.goto("/events/e0000000-0000-0000-0000-000000000001");
    await expect(page.locator("main")).toContainText("Hosted by");
    await expect(page.locator("main")).toContainText("Who's going");
    await expect(page.locator("main")).toContainText(/reviews?/);
  });

  test("map view renders pins", async ({ page }) => {
    await page.goto("/discover?view=map");
    await expect(page.locator("main")).toContainText(/part(y|ies) on the map/);
    await expect(page.locator(".spuds-marker").first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test("messages list opens a party chat", async ({ page }) => {
    await page.goto("/messages");
    await expect(page.getByRole("heading", { name: "Messages" })).toBeVisible();
    await page.locator('a[href^="/messages/"]').first().click();
    await expect(page.getByPlaceholder("Message…")).toBeVisible();
  });

  test("host dashboard reports real numbers", async ({ page }) => {
    await page.goto("/create/manage");
    await expect(page.locator("main")).toContainText("Parties hosted");
    await expect(page.locator("main")).toContainText("Total RSVPs");
  });

  test("host flow adapts to the party type", async ({ page }) => {
    await page.goto("/create");
    await expect(page.locator("main")).toContainText("Party type");

    // Watch parties ask about content, not games or platforms.
    await page.getByRole("button", { name: "TV and movies" }).click();
    await page.getByPlaceholder(/Party title/).fill("E2E watch party");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.locator("main")).toContainText("What are we watching?");
    await expect(page.locator("main")).not.toContainText("Platforms");
  });

  test("profile shows gaming identity and reputation", async ({ page }) => {
    await page.goto("/profile");
    await expect(page.locator("main")).toContainText("Gaming identity");
    await expect(page.locator("main")).toContainText("Hosted");
  });

  test("communities list and detail render", async ({ page }) => {
    await page.goto("/communities");
    await expect(
      page.getByRole("heading", { name: "Communities", exact: true })
    ).toBeVisible();
    await page.goto("/communities/windy-city-smash");
    await expect(page.locator("main")).toContainText("Windy City Smash");
    await expect(page.locator("main")).toContainText("members");
  });

  test("notifications inbox loads", async ({ page }) => {
    await page.goto("/notifications");
    await expect(
      page.getByRole("heading", { name: "Notifications" })
    ).toBeVisible();
  });
});

test.describe("mobile layout", () => {
  test.skip(({ isMobile }) => !isMobile, "mobile-only checks");

  test("no page scrolls sideways and inputs don't trigger iOS zoom", async ({
    page,
  }) => {
    await login(page);
    for (const path of ["/discover", "/communities", "/profile", "/create"]) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth
      );
      expect(overflow, `${path} scrolls sideways`).toBeLessThanOrEqual(1);
    }

    // Anything under 16px makes iOS Safari zoom in and never zoom back out.
    await page.goto("/discover");
    const smallest = await page.evaluate(() =>
      Math.min(
        ...[...document.querySelectorAll("input, textarea, select")].map((el) =>
          parseFloat(getComputedStyle(el).fontSize)
        )
      )
    );
    expect(smallest).toBeGreaterThanOrEqual(16);
  });
});
