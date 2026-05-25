import {
    getHiringSignal,
    getReviewFlags,
} from "./resultReviewUtils";

describe("resultReviewUtils", () => {
    test("uses persisted execution review status for admin reporting flags", () => {
        const assignment = {
            status: "SUBMITTED",
            assessmentType: "CODING_CHALLENGE",
            executionStatus: "PENDING_EXECUTION",
            reviewStatus: "NEEDS_EXECUTION",
        };

        expect(getReviewFlags(assignment)).toEqual([
            { type: "execution", label: "Run grading" },
            { type: "review", label: "Needs review" },
        ]);
        expect(getHiringSignal(assignment)).toEqual({
            type: "review",
            label: "Run grading",
        });
    });

    test("uses persisted manual review status before score-based hiring signal", () => {
        const assignment = {
            status: "GRADED",
            score: 90,
            maxScore: 100,
            reviewStatus: "NEEDS_MANUAL_REVIEW",
            submittedAnswers: {},
            sections: [],
        };

        expect(getReviewFlags(assignment)).toEqual([
            { type: "manual", label: "Manual review" },
        ]);
        expect(getHiringSignal(assignment)).toEqual({
            type: "review",
            label: "Manual review",
        });
    });
});
