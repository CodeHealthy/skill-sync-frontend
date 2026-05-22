import {
    ASSESSMENT_QUESTION_TYPES,
    createDefaultOption,
    createDefaultQuestion,
    createDefaultSection,
    createDefaultTestCase,
    getAssessmentMaxScore,
} from "./assessmentFormUtils";
import { getDefaultStarterCode } from "../../constants/starterCode";

export function normalizeAiDraftForBuilder(draft, currentForm = {}) {
    const questionType = draft.assessmentType || draft.type || currentForm.type;
    const isCoding = questionType === "CODING_CHALLENGE";
    const sections = normalizeAiDraftSections({
        ...draft,
        assessmentType: questionType,
    });

    return {
        ...draft,
        status: "PUBLISHED",
        type: isCoding ? "CODING_CHALLENGE" : "MCQ",
        roleTitle: draft.roleTitle || currentForm.roleTitle || "",
        durationMinutes: draft.durationMinutes || currentForm.durationMinutes || "",
        language: isCoding ? draft.language || "JAVA" : "TEXT",
        maxScore: getAssessmentMaxScore(sections, draft.maxScore),
        sections,
    };
}

function normalizeAiDraftSections(draft) {
    const sourceSections = Array.isArray(draft.sections) && draft.sections.length > 0
        ? draft.sections
        : [
            {
                id: "section-1",
                title: "AI generated screen",
                description: draft.description || "",
                timeLimitMinutes: draft.durationMinutes || "",
                questions: [
                    {
                        type: normalizeAiDraftQuestionType(draft.type, draft),
                        title: draft.title || "Generated question",
                        prompt: draft.prompt || "",
                        points: draft.maxScore || 100,
                        language: draft.language || "JAVA",
                        starterCode: draft.starterCode || "",
                        expectedOutput: draft.expectedOutput || "",
                        testCases: draft.testCases || [],
                    },
                ],
            },
        ];

    return sourceSections.map((section, sectionIndex) => {
        const questions = (section.questions || [])
            .map((question, questionIndex) => normalizeAiDraftQuestion(question, questionIndex, draft))
            .filter((question) => question.prompt?.trim());

        return {
            ...createDefaultSection(sectionIndex + 1),
            id: section.id || `section-${Date.now()}-${sectionIndex + 1}`,
            title: section.title || `Section ${sectionIndex + 1}`,
            description: section.description || "",
            timeLimitMinutes: section.timeLimitMinutes || "",
            questions: questions.length > 0
                ? questions
                : [normalizeAiDraftQuestion({}, 0, draft)],
        };
    });
}

function normalizeAiDraftQuestion(question, index, draft) {
    const type = normalizeAiDraftQuestionType(question?.type, draft);
    const points = Number(question?.points || draft.maxScore || 10);
    const language = question?.language || draft.language || "JAVA";

    return {
        ...createDefaultQuestion(index + 1, type),
        id: question?.id || `question-${Date.now()}-${index + 1}`,
        type,
        title: question?.title || draft.title || `Question ${index + 1}`,
        prompt: question?.prompt || draft.prompt || "",
        points,
        language: type === ASSESSMENT_QUESTION_TYPES.CODING_CHALLENGE ? language : "TEXT",
        starterCode: type === ASSESSMENT_QUESTION_TYPES.CODING_CHALLENGE
            ? question?.starterCode || draft.starterCode || getDefaultStarterCode(language)
            : "",
        expectedOutput: type === ASSESSMENT_QUESTION_TYPES.CODING_CHALLENGE
            ? question?.expectedOutput || draft.expectedOutput || ""
            : "",
        correctAnswer: type === ASSESSMENT_QUESTION_TYPES.SHORT_ANSWER
            ? question?.correctAnswer || draft.rubric || ""
            : "",
        options: type === ASSESSMENT_QUESTION_TYPES.MULTIPLE_CHOICE
            ? normalizeAiDraftOptions(question?.options)
            : [],
        testCases: type === ASSESSMENT_QUESTION_TYPES.CODING_CHALLENGE
            ? normalizeAiDraftTestCases(question?.testCases || draft.testCases, points)
            : [],
    };
}

function normalizeAiDraftQuestionType(type, draft) {
    if (
        type === ASSESSMENT_QUESTION_TYPES.MULTIPLE_CHOICE ||
        type === ASSESSMENT_QUESTION_TYPES.SHORT_ANSWER ||
        type === ASSESSMENT_QUESTION_TYPES.CODING_CHALLENGE
    ) {
        return type;
    }

    return draft.assessmentType === "CODING_CHALLENGE"
        ? ASSESSMENT_QUESTION_TYPES.CODING_CHALLENGE
        : ASSESSMENT_QUESTION_TYPES.SHORT_ANSWER;
}

function normalizeAiDraftOptions(options) {
    const normalized = (options || [])
        .filter((option) => option?.text?.trim())
        .map((option, index) => ({
            id: option.id || `option-${Date.now()}-${index + 1}`,
            text: option.text.trim(),
            correct: Boolean(option.correct),
        }));

    if (normalized.length < 2) {
        return [createDefaultOption(1, true), createDefaultOption(2, false)];
    }

    if (!normalized.some((option) => option.correct)) {
        normalized[0].correct = true;
    }

    return normalized;
}

function normalizeAiDraftTestCases(testCases, fallbackPoints = 100) {
    const normalized = (testCases || [])
        .filter((testCase) => testCase?.expectedOutput?.trim())
        .map((testCase, index) => ({
            name: testCase.name?.trim() || `Test case ${index + 1}`,
            input: testCase.input || "",
            expectedOutput: testCase.expectedOutput.trim(),
            hidden: Boolean(testCase.hidden),
            points: Number(testCase.points ?? (index === 0 ? fallbackPoints : 0)),
        }));

    return normalized.length > 0
        ? normalized
        : [createDefaultTestCase(1, fallbackPoints)];
}
