import { getDefaultStarterCode } from "../../constants/starterCode";

export const ASSESSMENT_QUESTION_TYPES = {
    MULTIPLE_CHOICE: "MULTIPLE_CHOICE",
    SHORT_ANSWER: "SHORT_ANSWER",
    CODING_CHALLENGE: "CODING_CHALLENGE",
};

export const ASSESSMENT_TYPES = {
    MCQ: "MCQ",
    CODING_CHALLENGE: "CODING_CHALLENGE",
};

export function createDefaultTestCase(index = 1, maxScore = 100) {
    return {
        name: index === 1 ? "Sample case" : `Test case ${index}`,
        input: "",
        expectedOutput: index === 1 ? "Hello SkillSync" : "",
        hidden: index !== 1,
        points: index === 1 ? maxScore : 0,
    };
}

export function createDefaultOption(index = 1, correct = false) {
    return {
        id: `option-${Date.now()}-${index}`,
        text: index === 1 ? "Option A" : `Option ${String.fromCharCode(64 + index)}`,
        correct,
    };
}

export function createDefaultQuestion(index = 1, type = ASSESSMENT_QUESTION_TYPES.MULTIPLE_CHOICE) {
    return normalizeQuestionPatch(
        {
            id: `question-${Date.now()}-${index}`,
            type,
            title: `Question ${index}`,
            prompt: "",
            points: 10,
            language: "JAVA",
            starterCode: getDefaultStarterCode("JAVA"),
            expectedOutput: "Hello SkillSync",
            correctAnswer: "",
            options: [],
            testCases: [],
        },
        { type }
    );
}

export function createDefaultSection(index = 1) {
    return {
        id: `section-${Date.now()}-${index}`,
        title: index === 1 ? "Core skills" : `Section ${index}`,
        description: "",
        timeLimitMinutes: "",
        questions: [createDefaultQuestion(1, ASSESSMENT_QUESTION_TYPES.MULTIPLE_CHOICE)],
    };
}

export function createInitialAssessmentForm() {
    return {
        title: "",
        description: "",
        roleTitle: "",
        status: "PUBLISHED",
        durationMinutes: "",
        type: ASSESSMENT_TYPES.CODING_CHALLENGE,
        language: "JAVA",
        maxScore: 100,
        prompt: "",
        starterCode: getDefaultStarterCode("JAVA"),
        expectedOutput: "Hello SkillSync",
        testCases: [
            {
                name: "Sample case",
                input: "",
                expectedOutput: "Hello SkillSync",
                hidden: false,
                points: 100,
            },
        ],
        sections: [createDefaultSection(1)],
    };
}

export function normalizeQuestionPatch(question, patch) {
    const next = { ...question, ...patch };

    if (
        patch.type === ASSESSMENT_QUESTION_TYPES.MULTIPLE_CHOICE &&
        (!next.options || next.options.length < 2)
    ) {
        next.options = [createDefaultOption(1, true), createDefaultOption(2, false)];
    }

    if (
        patch.type === ASSESSMENT_QUESTION_TYPES.CODING_CHALLENGE &&
        (!next.testCases || next.testCases.length === 0)
    ) {
        next.language = next.language === "TEXT" ? "JAVA" : next.language || "JAVA";
        next.starterCode = next.starterCode || getDefaultStarterCode(next.language || "JAVA");
        next.testCases = [createDefaultTestCase(1, Number(next.points || 10))];
    }

    if (patch.language && next.type === ASSESSMENT_QUESTION_TYPES.CODING_CHALLENGE) {
        next.starterCode = getDefaultStarterCode(patch.language);
    }

    if (next.type !== ASSESSMENT_QUESTION_TYPES.MULTIPLE_CHOICE) {
        next.options = [];
    }

    if (next.type !== ASSESSMENT_QUESTION_TYPES.CODING_CHALLENGE) {
        next.testCases = [];
        next.starterCode = "";
        next.expectedOutput = "";
        next.language = "TEXT";
    }

    return next;
}

export function getPrimaryQuestion(sections = []) {
    const questions = getAssessmentQuestions(sections);

    return (
        questions.find((question) => question.type === ASSESSMENT_QUESTION_TYPES.CODING_CHALLENGE) ||
        questions[0] ||
        null
    );
}

export function getAssessmentQuestions(sections = []) {
    return sections.flatMap((section) => section.questions || []);
}

export function getAssessmentMaxScore(sections = [], fallback = 100) {
    const total = getAssessmentQuestions(sections).reduce(
        (sum, question) => sum + Number(question.points || 0),
        0
    );

    return total > 0 ? total : Number(fallback || 100);
}

export function getScoreBreakdown(sections = []) {
    return getAssessmentQuestions(sections).reduce(
        (breakdown, question) => {
            const points = Number(question.points || 0);

            if (question.type === ASSESSMENT_QUESTION_TYPES.CODING_CHALLENGE) {
                breakdown.coding += points;
            } else if (question.type === ASSESSMENT_QUESTION_TYPES.MULTIPLE_CHOICE) {
                breakdown.multipleChoice += points;
            } else {
                breakdown.shortAnswer += points;
            }

            breakdown.total += points;
            return breakdown;
        },
        {
            coding: 0,
            multipleChoice: 0,
            shortAnswer: 0,
            total: 0,
        }
    );
}

export function summarizeQuestionMix(questions = []) {
    const counts = questions.reduce((summary, question) => {
        summary[question.type] = (summary[question.type] || 0) + 1;
        return summary;
    }, {});

    return [
        `${counts.MULTIPLE_CHOICE || 0} multiple choice`,
        `${counts.SHORT_ANSWER || 0} short answer`,
        `${counts.CODING_CHALLENGE || 0} coding`,
    ].join(", ");
}

export function normalizeTestCasesForSubmit(testCases) {
    return (testCases || [])
        .filter((testCase) => testCase?.expectedOutput?.trim())
        .map((testCase, index) => ({
            name: testCase.name?.trim() || `Test case ${index + 1}`,
            input: testCase.input || "",
            expectedOutput: testCase.expectedOutput.trim(),
            hidden: Boolean(testCase.hidden),
            points: Number(testCase.points || 0),
        }));
}

export function normalizeSectionsForSubmit(sections) {
    return (sections || [])
        .map((section, sectionIndex) => ({
            id: section.id || `section-${sectionIndex + 1}`,
            title: section.title?.trim() || `Section ${sectionIndex + 1}`,
            description: section.description || "",
            timeLimitMinutes: section.timeLimitMinutes
                ? Number(section.timeLimitMinutes)
                : null,
            questions: (section.questions || [])
                .filter((question) => question.prompt?.trim())
                .map((question, questionIndex) => ({
                    id: question.id || `question-${sectionIndex + 1}-${questionIndex + 1}`,
                    type: question.type,
                    title: question.title?.trim() || `Question ${questionIndex + 1}`,
                    prompt: question.prompt.trim(),
                    points: Number(question.points || 1),
                    language: question.type === ASSESSMENT_QUESTION_TYPES.CODING_CHALLENGE
                        ? question.language
                        : "TEXT",
                    starterCode: question.type === ASSESSMENT_QUESTION_TYPES.CODING_CHALLENGE
                        ? question.starterCode || ""
                        : "",
                    expectedOutput: question.type === ASSESSMENT_QUESTION_TYPES.CODING_CHALLENGE
                        ? question.expectedOutput || ""
                        : "",
                    correctAnswer: question.correctAnswer || "",
                    options: question.type === ASSESSMENT_QUESTION_TYPES.MULTIPLE_CHOICE
                        ? (question.options || [])
                            .filter((option) => option.text?.trim())
                            .map((option, optionIndex) => ({
                                id: option.id || `option-${questionIndex + 1}-${optionIndex + 1}`,
                                text: option.text.trim(),
                                correct: Boolean(option.correct),
                            }))
                        : [],
                    testCases: question.type === ASSESSMENT_QUESTION_TYPES.CODING_CHALLENGE
                        ? normalizeTestCasesForSubmit(question.testCases)
                        : [],
                })),
        }))
        .filter((section) => section.questions.length > 0);
}
