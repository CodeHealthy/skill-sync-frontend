export function getAllAssessmentQuestions(assignment) {
    return (assignment.sections || []).flatMap((section) => section.questions || []);
}

export function getAssessmentSections(assignment) {
    const sections = Array.isArray(assignment.sections) ? assignment.sections : [];

    if (sections.length > 0) {
        return sections;
    }

    return [
        {
            id: "legacy-section",
            title: "Assessment",
            description: assignment.prompt,
            questions: getAllAssessmentQuestions(assignment),
        },
    ];
}

export function getManualReviewQuestions(assignment) {
    return getAllAssessmentQuestions(assignment).filter(
        (question) => question.type === "SHORT_ANSWER"
    );
}

export function getAutoScoredPoints(assignment) {
    const codingPoints = (assignment.testCaseResults || []).reduce(
        (total, result) => total + Number(result.awardedPoints || 0),
        0
    );

    const submittedAnswers = assignment.submittedAnswers || {};
    const multipleChoicePoints = getAllAssessmentQuestions(assignment)
        .filter((question) => question.type === "MULTIPLE_CHOICE")
        .reduce((total, question) => {
            const selectedOptionId = submittedAnswers[question.id];
            const selectedOption = (question.options || []).find(
                (option) => option.id === selectedOptionId
            );

            return selectedOption?.correct
                ? total + Number(question.points || 0)
                : total;
        }, 0);

    return codingPoints + multipleChoicePoints;
}

export function getQuestionAutoAwardedPoints(assignment, question) {
    if (question.type === "MULTIPLE_CHOICE") {
        const submittedOptionId = assignment.submittedAnswers?.[question.id];
        const selectedOption = (question.options || []).find(
            (option) => option.id === submittedOptionId
        );

        return selectedOption?.correct ? Number(question.points || 0) : 0;
    }

    if (question.type === "CODING_CHALLENGE") {
        const questionTestNames = new Set(
            (question.testCases || []).map((testCase) => testCase.name).filter(Boolean)
        );
        const matchingResults = (assignment.testCaseResults || []).filter((result) =>
            questionTestNames.size === 0 || questionTestNames.has(result.name)
        );

        return matchingResults.reduce(
            (total, result) => total + Number(result.awardedPoints || 0),
            0
        );
    }

    return 0;
}

export function buildQuestionReviewItems(assignment, existingReviews = []) {
    const savedReviews = new Map(
        (existingReviews || []).map((review) => [review.questionId, review])
    );

    return getAllAssessmentQuestions(assignment).map((question) => {
        const savedReview = savedReviews.get(question.id) || {};
        const autoAwardedPoints = getQuestionAutoAwardedPoints(assignment, question);
        const hasSavedAward =
            savedReview.awardedPoints !== null &&
            savedReview.awardedPoints !== undefined;

        return {
            questionId: question.id,
            questionTitle: question.title || "Assessment question",
            questionType: question.type,
            maxPoints: Number(question.points || 0),
            awardedPoints: Number(hasSavedAward ? savedReview.awardedPoints : autoAwardedPoints),
            autoAwardedPoints,
            notes: savedReview.notes || "",
            reviewed: Boolean(savedReview.reviewed || question.type !== "SHORT_ANSWER"),
        };
    });
}

export const buildManualReviewItems = buildQuestionReviewItems;

export function calculateManualReviewScore(questionReviews = []) {
    return (questionReviews || []).reduce(
        (total, review) => total + Number(review.awardedPoints || 0),
        0
    );
}

export const calculateReviewScore = calculateManualReviewScore;

export function buildGradePayload(assignment, gradeForm = {}) {
    const questionReviews = Array.isArray(gradeForm.questionReviews)
        ? gradeForm.questionReviews
        : buildQuestionReviewItems(assignment, assignment.questionReviews || []);
    const fallbackScore = calculateReviewScore(questionReviews);
    const score = gradeForm.score !== undefined && gradeForm.score !== ""
        ? Number(gradeForm.score)
        : fallbackScore;

    return {
        score,
        feedback: gradeForm.feedback ?? assignment.feedback ?? "",
        questionReviews,
    };
}
