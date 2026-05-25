export function getScorePercent(assignment) {
    if (assignment.score === null || assignment.score === undefined) {
        return null;
    }

    const maxScore = Number(assignment.maxScore || 100);

    if (maxScore <= 0) {
        return null;
    }

    return Math.round((Number(assignment.score || 0) / maxScore) * 100);
}

export function getQuestionBreakdown(assignment) {
    const questions = (assignment.sections || [])
        .flatMap((section) => section.questions || []);

    return questions.reduce(
        (summary, question) => {
            const points = Number(question.points || 0);

            if (question.type === "CODING_CHALLENGE") {
                summary.coding.count += 1;
                summary.coding.points += points;
            } else if (question.type === "MULTIPLE_CHOICE") {
                summary.multipleChoice.count += 1;
                summary.multipleChoice.points += points;
            } else {
                summary.shortAnswer.count += 1;
                summary.shortAnswer.points += points;
            }

            summary.total.count += 1;
            summary.total.points += points;
            return summary;
        },
        {
            coding: { count: 0, points: 0 },
            multipleChoice: { count: 0, points: 0 },
            shortAnswer: { count: 0, points: 0 },
            total: { count: 0, points: 0 },
        }
    );
}

export function getReviewFlags(assignment) {
    const flags = [];

    if (assignment.reviewStatus === "NEEDS_EXECUTION") {
        flags.push({ type: "execution", label: "Run grading" });
    }

    if (assignment.reviewStatus === "NEEDS_MANUAL_REVIEW") {
        flags.push({ type: "manual", label: "Manual review" });
    }

    if (assignment.reviewStatus === "REVIEWED") {
        flags.push({ type: "reviewed", label: "Reviewed" });
    }

    if (assignment.status === "SUBMITTED") {
        flags.push({ type: "review", label: "Needs review" });
    }

    if (
        assignment.status === "SUBMITTED" &&
        assignment.assessmentType === "CODING_CHALLENGE" &&
        ["NOT_RUN", "PENDING_EXECUTION", null, undefined].includes(assignment.executionStatus) &&
        assignment.reviewStatus !== "NEEDS_EXECUTION"
    ) {
        flags.push({ type: "execution", label: "Run grading" });
    }

    if (hasSubmittedShortAnswers(assignment) && assignment.reviewStatus !== "NEEDS_MANUAL_REVIEW") {
        flags.push({ type: "manual", label: "Manual answers" });
    }

    if (assignment.autoSubmitted) {
        flags.push({ type: "auto", label: "Auto-submitted" });
    }

    if (isAssignmentOverdue(assignment)) {
        flags.push({ type: "overdue", label: "Overdue" });
    }

    if (isAssignmentExpired(assignment)) {
        flags.push({ type: "expired", label: "Expired" });
    }

    if (assignment.timeLimitMinutes) {
        flags.push({ type: "timed", label: `${assignment.timeLimitMinutes} min` });
    }

    return flags;
}

export function getHiringSignal(assignment) {
    const scorePercent = getScorePercent(assignment);

    if (assignment.status === "ASSIGNED") {
        return { type: "pending", label: "Waiting" };
    }

    if (assignment.reviewStatus === "NEEDS_EXECUTION") {
        return { type: "review", label: "Run grading" };
    }

    if (assignment.reviewStatus === "NEEDS_MANUAL_REVIEW") {
        return { type: "review", label: "Manual review" };
    }

    if (assignment.status === "SUBMITTED") {
        return { type: "review", label: "Review" };
    }

    if (scorePercent === null) {
        return { type: "pending", label: "No score" };
    }

    if (scorePercent >= 80) {
        return { type: "strong", label: "Strong" };
    }

    if (scorePercent >= 60) {
        return { type: "qualified", label: "Qualified" };
    }

    return { type: "risk", label: "Risk" };
}

export function hasSubmittedShortAnswers(assignment) {
    const submittedAnswers = assignment.submittedAnswers || {};
    const shortAnswerQuestions = (assignment.sections || [])
        .flatMap((section) => section.questions || [])
        .filter((question) => question.type === "SHORT_ANSWER");

    return shortAnswerQuestions.some((question) => {
        const value = submittedAnswers[question.id];
        return value !== null && value !== undefined && String(value).trim() !== "";
    });
}

export function isAssignmentOverdue(assignment) {
    return assignment.status === "ASSIGNED" &&
        Boolean(assignment.dueAt) &&
        new Date(assignment.dueAt).getTime() < Date.now();
}

export function isAssignmentExpired(assignment) {
    return assignment.status === "ASSIGNED" &&
        Boolean(assignment.expiresAt) &&
        new Date(assignment.expiresAt).getTime() < Date.now();
}
