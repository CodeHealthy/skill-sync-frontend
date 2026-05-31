const { test, expect } = require("@playwright/test");
const {
    fulfillOptions,
    installCsrfCookie,
    jsonResponse,
} = require("./support/api");
const {
    buildAssignedAssessment,
    candidateUser,
} = require("./fixtures/assessment-fixtures");

test("candidate login uses CSRF bootstrap and opens candidate dashboard", async ({ page }) => {
    const seenRequests = [];

    await page.route("**/api/**", async (route) => {
        const request = route.request();
        const url = new URL(request.url());

        seenRequests.push({
            method: request.method(),
            pathname: url.pathname,
            headers: request.headers(),
        });

        if (request.method() === "OPTIONS") {
            await fulfillOptions(route);
            return;
        }

        if (url.pathname === "/api/profile") {
            await route.fulfill(jsonResponse({ message: "Unauthorized" }, 401));
            return;
        }

        if (url.pathname === "/api/auth/csrf") {
            await installCsrfCookie(page);
            await route.fulfill(jsonResponse({ headerName: "X-XSRF-TOKEN" }));
            return;
        }

        if (url.pathname === "/api/auth/login") {
            await route.fulfill(jsonResponse(candidateUser));
            return;
        }

        if (url.pathname === "/api/assessments/my-assignments") {
            await route.fulfill(jsonResponse([buildAssignedAssessment({ sections: [] })]));
            return;
        }

        await route.fulfill(jsonResponse({ message: "Unhandled test route" }, 404));
    });

    await page.goto("/login");

    await page.getByLabel("Email").fill("candidate@example.com");
    await page.getByLabel("Password").fill("correct-password");
    await page.getByRole("button", { name: "Login" }).click();

    await expect(page).toHaveURL(/\/candidate$/);
    await expect(page.locator(".sidebar-user-name")).toHaveText("Ada Candidate");
    await expect(page.getByText("Java Fundamentals")).toBeVisible();

    const csrfRequestIndex = seenRequests.findIndex(
        (request) => request.pathname === "/api/auth/csrf"
    );
    const loginRequest = seenRequests.find(
        (request) => request.pathname === "/api/auth/login" && request.method === "POST"
    );

    expect(csrfRequestIndex).toBeGreaterThanOrEqual(0);
    expect(loginRequest.headers["x-xsrf-token"]).toBe("e2e-csrf-token");
});
