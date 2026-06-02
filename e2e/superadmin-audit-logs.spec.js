const { test, expect } = require("@playwright/test");
const {
    fulfillOptions,
    installCsrfCookie,
    jsonResponse,
} = require("./support/api");
const {
    superAdminUser,
} = require("./fixtures/assessment-fixtures");

test("super admin can filter platform audit logs by governance fields", async ({ page }) => {
    const auditQueries = [];
    const organizations = [
        {
            organizationId: "org-1",
            name: "Current Org",
            status: "ACTIVE",
            userCount: 2,
            createdAt: "2026-01-10T00:00:00Z",
        },
    ];
    const auditLogs = [
        {
            id: "audit-1",
            action: "PLATFORM_USER_UPDATED",
            actorEmail: "owner@example.com",
            actorRole: "SUPER_ADMIN",
            organizationId: "org-1",
            targetType: "USER",
            targetId: "user-1",
            metadata: {
                targetEmail: "rina@example.com",
                organizationId: "org-1",
            },
            createdAt: "2026-02-01T10:00:00Z",
        },
    ];

    await page.route("**/api/**", async (route) => {
        const request = route.request();
        const url = new URL(request.url());

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
            auditQueries.push(Object.fromEntries(url.searchParams.entries()));
            await route.fulfill(jsonResponse(auditLogs));
            return;
        }

        await route.fulfill(jsonResponse({ message: "Unhandled test route" }, 404));
    });

    await page.goto("/super-admin");
    await page.getByRole("button", { name: "Audit Logs" }).click();

    await page.getByLabel("Filter audit logs by action").selectOption("PLATFORM_USER_UPDATED");
    await page.getByLabel("Filter audit logs by organization").selectOption("org-1");
    await page.getByLabel("Filter audit logs by actor email").fill("owner@example.com");
    await page.getByLabel("Filter audit logs by target type").selectOption("USER");

    const auditRow = page.getByRole("row", { name: /owner@example.com/ });

    await expect(auditRow.getByRole("cell", { name: "Platform User Updated" })).toBeVisible();
    await expect(auditRow.getByText("owner@example.com")).toBeVisible();
    await expect(auditRow.getByText("Target Email: rina@example.com")).toBeVisible();
    await expect.poll(() => auditQueries.some((query) =>
        query.action === "PLATFORM_USER_UPDATED" &&
        query.organizationId === "org-1" &&
        query.actorEmail === "owner@example.com" &&
        query.targetType === "USER"
    )).toBe(true);
});
