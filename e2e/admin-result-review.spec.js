const { test, expect } = require("@playwright/test");
const {
    fulfillOptions,
    installCsrfCookie,
    jsonResponse,
} = require("./support/api");
const {
    adminUser,
    assessmentRecord,
    buildGrowthSubscription,
    buildSubmittedReviewAssignment,
    candidateRecord,
} = require("./fixtures/assessment-fixtures");

test("admin can review a submitted assessment and save manual grading", async ({ page }) => {
    const seenRequests = [];
    const gradePayloads = [];
    let assignment = buildSubmittedReviewAssignment();

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
            await route.fulfill(jsonResponse(adminUser));
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
            await route.fulfill(jsonResponse([assignment]));
            return;
        }

        if (url.pathname === "/api/assessments/assignments/assignment-1/grade") {
            const payload = request.postDataJSON();
            gradePayloads.push(payload);
            assignment = {
                ...assignment,
                status: "GRADED",
                score: payload.score,
                feedback: payload.feedback,
                questionReviews: payload.questionReviews,
                manualReviewScore: payload.score,
                reviewStatus: "REVIEWED",
                reviewedQuestionCount: payload.questionReviews.filter((review) => review.reviewed).length,
            };
            await route.fulfill(jsonResponse(assignment));
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
    await page.getByRole("button", { name: "View Results" }).click();
    await page.getByRole("button", { name: "Details" }).click();
    await page.getByRole("tab", { name: "Grading" }).click();

    await page.getByLabel("Awarded points", { exact: true }).fill("85");
    await page.getByLabel("Reviewer notes", { exact: true }).fill("Clear answer with one missing practical example.");
    await page.getByLabel("Candidate feedback", { exact: true }).fill("Strong fundamentals. Add a concrete code example next time.");
    await page.getByRole("button", { name: "Save Grade" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Save Grade" }).click();

    await expect(page.getByText("Grade saved successfully.")).toBeVisible();

    expect(gradePayloads).toHaveLength(1);
    expect(gradePayloads[0]).toMatchObject({
        score: 85,
        feedback: "Strong fundamentals. Add a concrete code example next time.",
    });
    expect(gradePayloads[0].questionReviews).toEqual([
        expect.objectContaining({
            questionId: "q1",
            awardedPoints: 85,
            maxPoints: 100,
            notes: "Clear answer with one missing practical example.",
            reviewed: true,
        }),
    ]);

    const gradeRequest = seenRequests.find(
        (request) =>
            request.pathname === "/api/assessments/assignments/assignment-1/grade" &&
            request.method === "PATCH"
    );

    expect(gradeRequest.headers["x-xsrf-token"]).toBe("e2e-csrf-token");
});
