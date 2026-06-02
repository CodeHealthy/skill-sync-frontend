const { test, expect } = require("@playwright/test");
const {
    fulfillOptions,
    installCsrfCookie,
    jsonResponse,
} = require("./support/api");
const {
    superAdminUser,
} = require("./fixtures/assessment-fixtures");

test("super admin can update a platform organization name", async ({ page }) => {
    const seenRequests = [];
    const updatePayloads = [];
    let organizations = [
        {
            organizationId: "org-1",
            name: "Old Hiring Co",
            status: "ACTIVE",
            userCount: 3,
            createdAt: "2026-01-10T00:00:00Z",
        },
    ];

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

        if (url.pathname === "/api/auth/csrf") {
            await installCsrfCookie(page);
            await route.fulfill(jsonResponse({ headerName: "X-XSRF-TOKEN" }));
            return;
        }

        if (url.pathname === "/api/profile") {
            await route.fulfill(jsonResponse(superAdminUser));
            return;
        }

        if (url.pathname === "/api/platform-admin/summary") {
            await route.fulfill(jsonResponse({ organizations, users: [superAdminUser] }));
            return;
        }

        if (url.pathname === "/api/platform-admin/audit-logs") {
            await route.fulfill(jsonResponse([]));
            return;
        }

        if (url.pathname === "/api/platform-admin/organizations/org-1") {
            const payload = request.postDataJSON();
            updatePayloads.push(payload);
            organizations = organizations.map((organization) =>
                organization.organizationId === "org-1"
                    ? { ...organization, ...payload }
                    : organization
            );
            await route.fulfill(jsonResponse(organizations[0]));
            return;
        }

        await route.fulfill(jsonResponse({ message: "Unhandled test route" }, 404));
    });

    await page.goto("/super-admin");
    await page.getByRole("button", { name: "Organizations" }).click();
    const organizationRow = page.getByRole("row", { name: /Old Hiring Co/ });

    await organizationRow.getByLabel("Name for Old Hiring Co").fill("New Hiring Co");
    await page.getByRole("row", { name: /New Hiring Co/ })
        .getByRole("button", { name: "Save" })
        .click();

    await expect(
        page.getByRole("textbox", { name: "Name for New Hiring Co" })
    ).toHaveValue("New Hiring Co");
    await page.getByRole("button", { name: "Suspend" }).click();
    await expect(page.getByText("Suspended")).toBeVisible();
    expect(updatePayloads).toEqual([
        {
            name: "New Hiring Co",
            status: "ACTIVE",
        },
        {
            name: "New Hiring Co",
            status: "SUSPENDED",
        },
    ]);

    const unsafeRequests = seenRequests.filter((request) =>
        ["POST", "PATCH", "PUT", "DELETE"].includes(request.method)
    );

    expect(unsafeRequests.every((request) => request.headers["x-xsrf-token"] === "e2e-csrf-token"))
        .toBe(true);
});
