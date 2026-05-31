const { test, expect } = require("@playwright/test");
const {
    fulfillOptions,
    installCsrfCookie,
    jsonResponse,
} = require("./support/api");
const {
    adminUser,
    assessmentRecord,
    buildAssignedAssessment,
    buildGrowthSubscription,
    candidateRecord,
    candidateUser,
} = require("./fixtures/assessment-fixtures");

test("admin can assign an assessment and candidate can see it", async ({ page }) => {
    const seenRequests = [];
    const assignPayloads = [];
    let currentUser = { ...adminUser };
    let assignments = [];

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
            await route.fulfill(jsonResponse(currentUser));
            return;
        }

        if (url.pathname === "/api/candidates") {
            await route.fulfill(jsonResponse([candidateRecord]));
            return;
        }

        if (url.pathname === "/api/assessments") {
            await route.fulfill(jsonResponse([assessmentRecord]));
            return;
        }

        if (url.pathname === "/api/assessments/assignments") {
            await route.fulfill(jsonResponse(assignments));
            return;
        }

        if (url.pathname === "/api/assessments/my-assignments") {
            await route.fulfill(jsonResponse(assignments));
            return;
        }

        if (url.pathname === "/api/assessments/assign") {
            const payload = request.postDataJSON();
            assignPayloads.push(payload);
            assignments = [
                buildAssignedAssessment({
                    candidateId: payload.candidateId,
                    candidateName: candidateRecord.name,
                    candidateEmail: candidateRecord.email,
                    assessmentId: payload.assessmentId,
                    assessmentTitle: assessmentRecord.title,
                }),
            ];
            await route.fulfill(jsonResponse(assignments[0], 201));
            return;
        }

        if (url.pathname === "/api/team" || url.pathname === "/api/team/invites") {
            await route.fulfill(jsonResponse([]));
            return;
        }

        if (url.pathname === "/api/audit-logs") {
            await route.fulfill(jsonResponse([]));
            return;
        }

        if (url.pathname === "/api/billing/subscription") {
            await route.fulfill(jsonResponse(buildGrowthSubscription()));
            return;
        }

        await route.fulfill(jsonResponse({ message: "Unhandled test route" }, 404));
    });

    await page.goto("/admin");
    await page.getByRole("button", { name: "Create Assessment" }).click();

    await page.getByLabel("Candidate", { exact: true }).selectOption("candidate-1");
    await page.getByLabel("Assessment", { exact: true }).selectOption("assessment-1");
    await page.getByLabel("Time Limit", { exact: true }).fill("30");
    await page.getByRole("button", { name: "Assign Assessment" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Assign", exact: true }).click();

    await expect(page.getByText("Assessment assigned successfully.")).toBeVisible();

    expect(assignPayloads).toHaveLength(1);
    expect(assignPayloads[0]).toMatchObject({
        candidateId: "candidate-1",
        assessmentId: "assessment-1",
        timeLimitMinutes: 30,
    });

    currentUser = { ...candidateUser };

    await page.evaluate((user) => {
        localStorage.setItem("skillsync_user", JSON.stringify(user));
    }, currentUser);
    await page.goto("/candidate");

    await expect(page).toHaveURL(/\/candidate$/);
    await expect(page.locator(".sidebar-user-name")).toHaveText("Ada Candidate");
    await expect(page.getByText("Java Fundamentals")).toBeVisible();
    await expect(page.getByText("Skill Sync QA")).toBeVisible();

    const assignRequest = seenRequests.find(
        (request) => request.pathname === "/api/assessments/assign" && request.method === "POST"
    );

    expect(assignRequest.headers["x-xsrf-token"]).toBe("e2e-csrf-token");
});
