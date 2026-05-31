const { test, expect } = require("@playwright/test");
const {
    fulfillOptions,
    installCsrfCookie,
    jsonResponse,
} = require("./support/api");
const {
    superAdminUser,
} = require("./fixtures/assessment-fixtures");

test("super admin can create and update database-backed subscription plans", async ({ page }) => {
    const seenRequests = [];
    const createdPayloads = [];
    const updatedPayloads = [];
    let plans = [
        {
            id: "plan-free",
            code: "free",
            name: "Free",
            pricing: 0,
            currency: "AED",
            billingCycle: "forever",
            features: {
                activeAssessments: 1,
                candidateInvites: 5,
                teamMembers: 1,
            },
            highlights: ["1 active assessment"],
            active: true,
            isFree: true,
            displayOrder: 1,
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
            await route.fulfill(jsonResponse({ organizations: [], users: [superAdminUser] }));
            return;
        }

        if (url.pathname === "/api/platform-admin/audit-logs") {
            await route.fulfill(jsonResponse([]));
            return;
        }

        if (url.pathname === "/api/platform-admin/subscription-plans") {
            if (request.method() === "GET") {
                await route.fulfill(jsonResponse(plans));
                return;
            }

            if (request.method() === "POST") {
                const payload = request.postDataJSON();
                createdPayloads.push(payload);
                const createdPlan = {
                    ...payload,
                    id: "plan-growth",
                    code: "growth",
                };
                plans = [...plans, createdPlan];
                await route.fulfill(jsonResponse(createdPlan));
                return;
            }
        }

        if (url.pathname === "/api/platform-admin/subscription-plans/plan-growth") {
            const payload = request.postDataJSON();
            updatedPayloads.push(payload);
            plans = plans.map((plan) =>
                plan.id === "plan-growth"
                    ? { ...plan, ...payload, code: "growth" }
                    : plan
            );
            await route.fulfill(jsonResponse(plans.find((plan) => plan.id === "plan-growth")));
            return;
        }

        await route.fulfill(jsonResponse({ message: "Unhandled test route" }, 404));
    });

    await page.goto("/super-admin");
    await page.getByRole("button", { name: "Plans" }).click();

    await page.getByLabel("Code").fill("growth");
    await page.getByLabel("Name").fill("Growth");
    await page.getByLabel("Price", { exact: true }).fill("199");
    await page.getByLabel("Features JSON").fill(JSON.stringify({
        activeAssessments: 25,
        candidateInvites: 500,
        aiGeneration: true,
    }, null, 2));
    await page.getByLabel("Highlights").fill("25 active assessments\n500 candidate invites");
    await page.getByRole("button", { name: "Create Plan" }).click();

    await expect(page.getByText("Subscription plan created.")).toBeVisible();
    expect(createdPayloads).toHaveLength(1);
    expect(createdPayloads[0]).toMatchObject({
        code: "growth",
        name: "Growth",
        pricing: 199,
        features: {
            activeAssessments: 25,
            candidateInvites: 500,
            aiGeneration: true,
        },
    });

    await page.getByRole("button", { name: "Edit" }).last().click();
    await page.getByLabel("Price", { exact: true }).fill("249");
    await page.getByRole("button", { name: "Update Plan" }).click();

    await expect(page.getByText("Subscription plan updated.")).toBeVisible();
    expect(updatedPayloads).toHaveLength(1);
    expect(updatedPayloads[0]).toMatchObject({
        code: "growth",
        pricing: 249,
    });

    const unsafeRequests = seenRequests.filter((request) =>
        ["POST", "PATCH", "PUT", "DELETE"].includes(request.method)
    );

    expect(unsafeRequests.every((request) => request.headers["x-xsrf-token"] === "e2e-csrf-token"))
        .toBe(true);
});
