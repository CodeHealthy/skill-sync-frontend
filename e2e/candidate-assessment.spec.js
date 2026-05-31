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

test("candidate can open, start, autosave, and submit an assessment", async ({ page }) => {
    const seenRequests = [];
    const draftPayloads = [];
    const submitPayloads = [];
    let assignment = buildAssignedAssessment();

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
            await route.fulfill(jsonResponse(candidateUser));
            return;
        }

        if (url.pathname === "/api/auth/csrf") {
            await installCsrfCookie(page);
            await route.fulfill(jsonResponse({ headerName: "X-XSRF-TOKEN" }));
            return;
        }

        if (url.pathname === "/api/assessments/my-assignments") {
            await route.fulfill(jsonResponse([assignment]));
            return;
        }

        if (url.pathname === "/api/assessments/assignments/assignment-1/start") {
            assignment = {
                ...assignment,
                startedAt: "2026-06-07T10:00:00Z",
                expiresAt: "2026-06-07T10:30:00Z",
            };
            await route.fulfill(jsonResponse(assignment));
            return;
        }

        if (url.pathname === "/api/assessments/assignments/assignment-1/sections/start") {
            assignment = {
                ...assignment,
                sectionAttempts: [
                    {
                        sectionId: "section-1",
                        startedAt: "2026-06-07T10:00:05Z",
                    },
                ],
            };
            await route.fulfill(jsonResponse(assignment));
            return;
        }

        if (url.pathname === "/api/assessments/assignments/assignment-1/draft") {
            const payload = request.postDataJSON();
            draftPayloads.push(payload);
            assignment = {
                ...assignment,
                draftAnswers: payload.draftAnswers || {},
                draftSavedAt: "2026-05-31T11:01:00Z",
            };
            await route.fulfill(jsonResponse(assignment));
            return;
        }

        if (url.pathname === "/api/assessments/assignments/assignment-1/integrity-events") {
            await route.fulfill(jsonResponse(assignment));
            return;
        }

        if (url.pathname === "/api/assessments/assignments/assignment-1/submit") {
            const payload = request.postDataJSON();
            submitPayloads.push(payload);
            assignment = {
                ...assignment,
                status: "SUBMITTED",
                submittedAnswers: payload.submittedAnswers || {},
                submittedAt: "2026-05-31T11:05:00Z",
            };
            await route.fulfill(jsonResponse(assignment));
            return;
        }

        await route.fulfill(jsonResponse({ message: "Unhandled test route" }, 404));
    });

    await page.goto("/candidate");

    await page.getByRole("button", { name: "My Assessments" }).click();
    await page.getByRole("link", { name: "Open assessment workspace" }).click();
    await expect(page).toHaveURL(/\/candidate\/assessments\/assignment-1$/);

    await page.getByRole("button", { name: "Start Assessment" }).click();
    await expect(page.getByText("Section 1 of 1")).toBeVisible();

    await page.getByLabel("Encapsulation").fill("Encapsulation keeps object state protected.");

    await expect.poll(() => draftPayloads.length).toBeGreaterThan(0);
    expect(draftPayloads.at(-1).draftAnswers).toEqual({
        q1: "Encapsulation keeps object state protected.",
    });

    await page.getByRole("button", { name: "Submit assessment" }).click();
    await expect(page).toHaveURL(/\/candidate$/);
    await expect(page.getByText("Assessment submitted successfully.")).toBeVisible();

    expect(submitPayloads).toHaveLength(1);
    expect(submitPayloads[0].submittedAnswers).toEqual({
        q1: "Encapsulation keeps object state protected.",
    });

    const unsafeRequests = seenRequests.filter((request) =>
        ["POST", "PATCH", "PUT", "DELETE"].includes(request.method)
    );

    expect(unsafeRequests.every((request) => request.headers["x-xsrf-token"] === "e2e-csrf-token"))
        .toBe(true);
});
