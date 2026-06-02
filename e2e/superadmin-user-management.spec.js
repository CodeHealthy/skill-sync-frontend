const { test, expect } = require("@playwright/test");
const {
    fulfillOptions,
    installCsrfCookie,
    jsonResponse,
} = require("./support/api");
const {
    superAdminUser,
} = require("./fixtures/assessment-fixtures");

test("super admin can update platform user role and active status", async ({ page }) => {
    const seenRequests = [];
    const updatePayloads = [];
    let users = [
        superAdminUser,
        {
            userId: "user-1",
            fullName: "Rina Recruiter",
            email: "rina@example.com",
            role: "RECRUITER",
            organizationId: "org-1",
            active: true,
        },
    ];
    let organizations = [
        {
            organizationId: "org-1",
            name: "Current Org",
            status: "ACTIVE",
            userCount: 1,
            createdAt: "2026-01-10T00:00:00Z",
        },
        {
            organizationId: "org-2",
            name: "Next Org",
            status: "ACTIVE",
            userCount: 0,
            createdAt: "2026-01-11T00:00:00Z",
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
            await route.fulfill(jsonResponse({ organizations, users }));
            return;
        }

        if (url.pathname === "/api/platform-admin/audit-logs") {
            await route.fulfill(jsonResponse([]));
            return;
        }

        if (url.pathname === "/api/platform-admin/users/user-1") {
            const payload = request.postDataJSON();
            updatePayloads.push(payload);
            users = users.map((user) =>
                user.userId === "user-1"
                    ? { ...user, ...payload }
                    : user
            );
            await route.fulfill(jsonResponse(users.find((user) => user.userId === "user-1")));
            return;
        }

        await route.fulfill(jsonResponse({ message: "Unhandled test route" }, 404));
    });

    await page.goto("/super-admin");
    await page.getByRole("button", { name: "Users" }).click();
    const recruiterRow = page.getByRole("row", { name: /Rina Recruiter/ });

    await recruiterRow.getByLabel("Role for rina@example.com").selectOption("HIRING_MANAGER");
    await expect.poll(() => updatePayloads.length).toBe(1);
    await recruiterRow.getByLabel("Organization for rina@example.com").selectOption("org-2");
    await expect.poll(() => updatePayloads.length).toBe(2);
    await recruiterRow.getByRole("button", { name: "Deactivate" }).click();

    await expect(page.getByText("Deactivated")).toBeVisible();
    expect(updatePayloads).toEqual([
        {
            role: "HIRING_MANAGER",
            active: true,
            organizationId: "org-1",
        },
        {
            role: "HIRING_MANAGER",
            active: true,
            organizationId: "org-2",
        },
        {
            role: "HIRING_MANAGER",
            active: false,
            organizationId: "org-2",
        },
    ]);

    const unsafeRequests = seenRequests.filter((request) =>
        ["POST", "PATCH", "PUT", "DELETE"].includes(request.method)
    );

    expect(unsafeRequests.every((request) => request.headers["x-xsrf-token"] === "e2e-csrf-token"))
        .toBe(true);
});
