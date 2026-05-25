import {
    buildGradePayload,
    buildQuestionReviewItems,
    getAutoScoredPoints,
} from "./manualReviewUtils";

const assignment = {
    submittedAnswers: {
        mcqCorrect: "option-a",
        mcqWrong: "option-c",
    },
    testCaseResults: [
        { name: "Visible", awardedPoints: 5 },
        { name: "Hidden", awardedPoints: 10 },
    ],
    sections: [
        {
            questions: [
                {
                    id: "mcqCorrect",
                    type: "MULTIPLE_CHOICE",
                    title: "Correct MCQ",
                    points: 10,
                    options: [
                        { id: "option-a", text: "A", correct: true },
                        { id: "option-b", text: "B", correct: false },
                    ],
                },
                {
                    id: "mcqWrong",
                    type: "MULTIPLE_CHOICE",
                    title: "Wrong MCQ",
                    points: 10,
                    options: [
                        { id: "option-c", text: "C", correct: false },
                        { id: "option-d", text: "D", correct: true },
                    ],
                },
                {
                    id: "coding",
                    type: "CODING_CHALLENGE",
                    title: "Coding",
                    points: 20,
                    testCases: [{ name: "Visible" }, { name: "Hidden" }],
                },
                {
                    id: "short",
                    type: "SHORT_ANSWER",
                    title: "Written response",
                    points: 5,
                },
            ],
        },
    ],
};

describe("manualReviewUtils", () => {
    test("combines multiple choice and coding points for auto scored total", () => {
        expect(getAutoScoredPoints(assignment)).toBe(25);
    });

    test("builds question review defaults from auto scoring and saved manual reviews", () => {
        const reviews = buildQuestionReviewItems(assignment, [
            {
                questionId: "short",
                awardedPoints: 4,
                notes: "Clear answer",
                reviewed: true,
            },
        ]);

        expect(reviews).toEqual([
            expect.objectContaining({
                questionId: "mcqCorrect",
                awardedPoints: 10,
                autoAwardedPoints: 10,
                reviewed: true,
            }),
            expect.objectContaining({
                questionId: "mcqWrong",
                awardedPoints: 0,
                autoAwardedPoints: 0,
                reviewed: true,
            }),
            expect.objectContaining({
                questionId: "coding",
                awardedPoints: 15,
                autoAwardedPoints: 15,
                reviewed: true,
            }),
            expect.objectContaining({
                questionId: "short",
                awardedPoints: 4,
                autoAwardedPoints: 0,
                notes: "Clear answer",
                reviewed: true,
            }),
        ]);
    });

    test("builds grade payload from review item totals when explicit score is blank", () => {
        const payload = buildGradePayload(
            { ...assignment, feedback: "Existing feedback" },
            {
                score: "",
                questionReviews: [
                    { questionId: "mcqCorrect", awardedPoints: 10 },
                    { questionId: "coding", awardedPoints: 15 },
                    { questionId: "short", awardedPoints: 4 },
                ],
            }
        );

        expect(payload).toEqual({
            score: 29,
            feedback: "Existing feedback",
            questionReviews: [
                { questionId: "mcqCorrect", awardedPoints: 10 },
                { questionId: "coding", awardedPoints: 15 },
                { questionId: "short", awardedPoints: 4 },
            ],
        });
    });
});
