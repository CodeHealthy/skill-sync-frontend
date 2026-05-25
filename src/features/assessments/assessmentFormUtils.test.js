import {
    ASSESSMENT_QUESTION_TYPES,
    getAssessmentMaxScore,
    getScoreBreakdown,
    normalizeSectionsForSubmit,
} from "./assessmentFormUtils";

describe("assessmentFormUtils", () => {
    test("normalizes sections and questions for assessment submission", () => {
        const normalized = normalizeSectionsForSubmit([
            {
                id: " section-1 ",
                title: " Core skills ",
                description: "Assess core reasoning",
                timeLimitMinutes: "30",
                questions: [
                    {
                        id: "mcq-1",
                        type: ASSESSMENT_QUESTION_TYPES.MULTIPLE_CHOICE,
                        title: "  Logic  ",
                        prompt: "  Pick the valid answer.  ",
                        points: "5",
                        language: "JAVA",
                        options: [
                            { id: "a", text: "  Yes  ", correct: true },
                            { id: "b", text: "No", correct: false },
                            { id: "blank", text: "   ", correct: false },
                        ],
                        testCases: [{ expectedOutput: "should be dropped" }],
                    },
                    {
                        id: "coding-1",
                        type: ASSESSMENT_QUESTION_TYPES.CODING_CHALLENGE,
                        title: "FizzBuzz",
                        prompt: "  Solve FizzBuzz. ",
                        points: "20",
                        language: "JAVA",
                        starterCode: "class Main {}",
                        expectedOutput: "1",
                        testCases: [
                            {
                                name: " Visible ",
                                input: "3",
                                expectedOutput: "  Fizz  ",
                                hidden: false,
                                points: "5",
                            },
                            {
                                name: "",
                                input: "15",
                                expectedOutput: "FizzBuzz",
                                hidden: true,
                                points: "15",
                            },
                            {
                                name: "Invalid",
                                input: "1",
                                expectedOutput: "   ",
                                hidden: true,
                                points: "0",
                            },
                        ],
                    },
                    {
                        id: "blank-question",
                        type: ASSESSMENT_QUESTION_TYPES.SHORT_ANSWER,
                        title: "Ignored",
                        prompt: "   ",
                        points: "10",
                    },
                ],
            },
        ]);

        expect(normalized).toEqual([
            {
                id: " section-1 ",
                title: "Core skills",
                description: "Assess core reasoning",
                timeLimitMinutes: 30,
                questions: [
                    {
                        id: "mcq-1",
                        type: ASSESSMENT_QUESTION_TYPES.MULTIPLE_CHOICE,
                        title: "Logic",
                        prompt: "Pick the valid answer.",
                        points: 5,
                        language: "TEXT",
                        starterCode: "",
                        expectedOutput: "",
                        correctAnswer: "",
                        options: [
                            { id: "a", text: "Yes", correct: true },
                            { id: "b", text: "No", correct: false },
                        ],
                        testCases: [],
                    },
                    {
                        id: "coding-1",
                        type: ASSESSMENT_QUESTION_TYPES.CODING_CHALLENGE,
                        title: "FizzBuzz",
                        prompt: "Solve FizzBuzz.",
                        points: 20,
                        language: "JAVA",
                        starterCode: "class Main {}",
                        expectedOutput: "1",
                        correctAnswer: "",
                        options: [],
                        testCases: [
                            {
                                name: "Visible",
                                input: "3",
                                expectedOutput: "Fizz",
                                hidden: false,
                                points: 5,
                            },
                            {
                                name: "Test case 2",
                                input: "15",
                                expectedOutput: "FizzBuzz",
                                hidden: true,
                                points: 15,
                            },
                        ],
                    },
                ],
            },
        ]);
    });

    test("calculates max score and score breakdown from section questions", () => {
        const sections = [
            {
                questions: [
                    { type: ASSESSMENT_QUESTION_TYPES.MULTIPLE_CHOICE, points: 10 },
                    { type: ASSESSMENT_QUESTION_TYPES.SHORT_ANSWER, points: 15 },
                    { type: ASSESSMENT_QUESTION_TYPES.CODING_CHALLENGE, points: 25 },
                ],
            },
        ];

        expect(getAssessmentMaxScore(sections)).toBe(50);
        expect(getScoreBreakdown(sections)).toEqual({
            coding: 25,
            multipleChoice: 10,
            shortAnswer: 15,
            total: 50,
        });
    });
});
