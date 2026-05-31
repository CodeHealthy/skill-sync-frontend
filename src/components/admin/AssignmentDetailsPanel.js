import { useEffect, useState } from "react";
import CodeBlock from "../common/CodeBlock";
import DetailItem from "../common/DetailItem";
import StatusBadge from "../common/StatusBadge";
import {
    getHiringSignal,
    getQuestionBreakdown,
    getReviewFlags,
    getScorePercent,
} from "../../features/results/resultReviewUtils";
import {
    buildManualReviewItems,
    calculateReviewScore,
    getAssessmentSections,
    getAutoScoredPoints,
} from "../../features/results/manualReviewUtils";
import { formatAssessmentType, formatDate, formatLanguage } from "../../utils/formatters";

const DETAIL_TABS = [
    { id: "summary", label: "Summary" },
    { id: "scorecard", label: "Scorecard" },
    { id: "submission", label: "Raw Submission" },
    { id: "tests", label: "Test Cases" },
    { id: "integrity", label: "Integrity" },
    { id: "grading", label: "Grading" },
];

function AssignmentDetailsPanel({
    assignment,
    gradeForms,
    gradingAssignmentId,
    onGradeChange,
    onGradeAssignment,
}) {
    const [activeTab, setActiveTab] = useState("summary");

    useEffect(() => {
        setActiveTab("summary");
    }, [assignment?.id]);

    if (!assignment) {
        return null;
    }

    const testCases = Array.isArray(assignment.testCases)
        ? assignment.testCases
        : [];

    const testCaseResults = Array.isArray(assignment.testCaseResults)
        ? assignment.testCaseResults
        : [];

    const passedTests = testCaseResults.filter((result) => result.passed).length;
    const hiddenResultCount = testCaseResults.filter((result) => result.hidden).length;

    const totalResultPoints = testCaseResults.reduce(
        (total, result) => total + Number(result.points || 0),
        0
    );

    const awardedResultPoints = testCaseResults.reduce(
        (total, result) => total + Number(result.awardedPoints || 0),
        0
    );

    const reviewFlags = getReviewFlags(assignment);
    const questionBreakdown = getQuestionBreakdown(assignment);
    const scorePercent = getScorePercent(assignment);
    const hiringSignal = getHiringSignal(assignment);
    const scoreLabel = assignment.score !== null && assignment.score !== undefined
        ? `${assignment.score}/${assignment.maxScore || 100}`
        : "Not graded";

    return (
        <div className="detail-panel reviewer-panel">
            <div className="detail-panel-header reviewer-header">
                <div>
                    <h3>{assignment.assessmentTitle}</h3>
                    <p>
                        {assignment.candidateName} - {assignment.candidateEmail}
                    </p>
                </div>

                <div className="detail-status-stack">
                    <span className={`hiring-signal hiring-signal-${hiringSignal.type}`}>
                        {hiringSignal.label}
                    </span>
                    <StatusBadge value={assignment.status} />
                    {assignment.autoSubmitted && (
                        <span className="review-flag review-flag-auto">
                            Auto-submitted
                        </span>
                    )}
                </div>
            </div>

            <div className="reviewer-metric-strip">
                <ReviewMetric
                    label="Tests"
                    value={
                        testCaseResults.length > 0
                            ? `${passedTests}/${testCaseResults.length}`
                            : testCases.length > 0
                                ? `${testCases.length} configured`
                                : "No tests"
                    }
                    hint={testCaseResults.length > 0 ? "passed" : "setup"}
                />
                <ReviewMetric label="Score" value={scoreLabel} hint="current" />
                <ReviewMetric
                    label="Percent"
                    value={scorePercent === null ? "-" : `${scorePercent}%`}
                    hint="score"
                />
                <ReviewMetric
                    label="Execution"
                    value={assignment.executionStatus || "NOT_RUN"}
                    hint="status"
                />
                <ReviewMetric
                    label="Review"
                    value={formatReviewStatus(assignment.reviewStatus)}
                    hint={`${assignment.reviewedQuestionCount ?? 0}/${assignment.totalQuestionCount ?? questionBreakdown.total.count} questions`}
                />
                <ReviewMetric
                    label="Timing"
                    value={assignment.timeLimitMinutes ? `${assignment.timeLimitMinutes} min` : "No limit"}
                    hint={assignment.autoSubmitted ? "auto-submitted" : "assessment"}
                />
            </div>

            {reviewFlags.length > 0 && (
                <div className="review-summary-strip compact">
                    {reviewFlags.map((flag) => (
                        <span
                            className={`review-flag review-flag-${flag.type}`}
                            key={flag.label}
                        >
                            {flag.label}
                        </span>
                    ))}
                </div>
            )}

            <div className="reviewer-tabs" role="tablist" aria-label="Assignment details">
                {DETAIL_TABS.map((tab) => (
                    <button
                        className={activeTab === tab.id ? "reviewer-tab active" : "reviewer-tab"}
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={activeTab === tab.id}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="reviewer-tab-panel">
                {activeTab === "summary" && (
                    <SummaryTab
                        assignment={assignment}
                        scoreLabel={scoreLabel}
                        hiddenResultCount={hiddenResultCount}
                        passedTests={passedTests}
                        testCaseResults={testCaseResults}
                        totalResultPoints={totalResultPoints}
                        awardedResultPoints={awardedResultPoints}
                        questionBreakdown={questionBreakdown}
                        scorePercent={scorePercent}
                    />
                )}

                {activeTab === "submission" && (
                    <SubmissionTab assignment={assignment} />
                )}

                {activeTab === "scorecard" && (
                    <ScorecardTab assignment={assignment} />
                )}

                {activeTab === "tests" && (
                    <TestCasesTab
                        assignment={assignment}
                        testCases={testCases}
                        testCaseResults={testCaseResults}
                    />
                )}

                {activeTab === "integrity" && (
                    <IntegrityTab assignment={assignment} />
                )}

                {activeTab === "grading" && (
                    <GradingTab
                        assignment={assignment}
                        gradeForms={gradeForms}
                        gradingAssignmentId={gradingAssignmentId}
                        onGradeChange={onGradeChange}
                        onGradeAssignment={onGradeAssignment}
                    />
                )}
            </div>
        </div>
    );
}

function SummaryTab({
    assignment,
    scoreLabel,
    hiddenResultCount,
    passedTests,
    testCaseResults,
    totalResultPoints,
    awardedResultPoints,
    questionBreakdown,
    scorePercent,
}) {
    return (
        <>
            <div className="detail-grid compact-detail-grid">
                <DetailItem label="Type" value={formatAssessmentType(assignment.assessmentType)} />
                <DetailItem label="Language" value={formatLanguage(assignment.language)} />
                <DetailItem
                    label="Execution Status"
                    value={assignment.executionStatus || "NOT_RUN"}
                />
                <DetailItem label="Score" value={scoreLabel} />
                <DetailItem label="Assigned At" value={formatDate(assignment.assignedAt)} />
                <DetailItem label="Due At" value={formatDate(assignment.dueAt)} />
                <DetailItem
                    label="Time Limit"
                    value={
                        assignment.timeLimitMinutes
                            ? `${assignment.timeLimitMinutes} minutes`
                            : "No limit"
                    }
                />
                <DetailItem label="Started At" value={formatDate(assignment.startedAt)} />
                <DetailItem label="Expires At" value={formatDate(assignment.expiresAt)} />
                <DetailItem label="Submitted At" value={formatDate(assignment.submittedAt)} />
                <DetailItem label="Completed At" value={formatDate(assignment.completedAt)} />
            </div>

            {testCaseResults.length > 0 && (
                <div className="detail-grid compact-detail-grid">
                    <DetailItem
                        label="Passed Tests"
                        value={`${passedTests}/${testCaseResults.length}`}
                    />
                    <DetailItem
                        label="Awarded Points"
                        value={`${awardedResultPoints}/${totalResultPoints}`}
                    />
                    <DetailItem label="Hidden Tests" value={hiddenResultCount} />
                </div>
            )}

            <div className="detail-grid compact-detail-grid">
                <DetailItem label="Auto Score" value={formatPoints(assignment.autoScore)} />
                <DetailItem label="Coding Score" value={formatPoints(assignment.codingScore)} />
                <DetailItem label="MCQ Score" value={formatPoints(assignment.multipleChoiceScore)} />
                <DetailItem label="Manual Review Score" value={formatPoints(assignment.manualReviewScore)} />
            </div>

            <div className="reviewer-section">
                <div className="reviewer-section-header">
                    <div>
                        <h4>Assessment Breakdown</h4>
                        <p>Score distribution and review workload for this submission.</p>
                    </div>
                </div>

                <div className="score-breakdown-grid">
                    <ScoreBreakdownItem
                        label="Coding"
                        count={questionBreakdown.coding.count}
                        points={questionBreakdown.coding.points}
                    />
                    <ScoreBreakdownItem
                        label="Multiple Choice"
                        count={questionBreakdown.multipleChoice.count}
                        points={questionBreakdown.multipleChoice.points}
                    />
                    <ScoreBreakdownItem
                        label="Short Answer"
                        count={questionBreakdown.shortAnswer.count}
                        points={questionBreakdown.shortAnswer.points}
                    />
                    <ScoreBreakdownItem
                        label="Final Score"
                        count={scorePercent === null ? "-" : `${scorePercent}%`}
                        points={assignment.score ?? "-"}
                    />
                </div>
            </div>
        </>
    );
}

function SubmissionTab({ assignment }) {
    return (
            <div className="reviewer-section-stack">
            <CodeBlock title="Prompt" value={assignment.prompt} maxHeight="180px" />
            <SubmittedAnswersPanel assignment={assignment} />
            <CodeBlock title="Submitted Answer" value={assignment.submittedAnswer} maxHeight="180px" />
            <CodeBlock title="Submitted Code" value={assignment.submittedCode} maxHeight="260px" />
            <CodeBlock title="Expected Output" value={assignment.expectedOutput} maxHeight="140px" />
            <CodeBlock title="Actual Output" value={assignment.actualOutput} maxHeight="140px" />
            <CodeBlock title="Execution Error" value={assignment.executionError} maxHeight="140px" />
        </div>
    );
}

function ScorecardTab({ assignment }) {
    const questionReviews = buildManualReviewItems(
        assignment,
        assignment.questionReviews || []
    );

    return (
        <div className="reviewer-section-stack">
            {getAssessmentSections(assignment).map((section, sectionIndex) => {
                const questions = section.questions || [];

                if (questions.length === 0) {
                    return null;
                }

                const sectionPoints = questions.reduce(
                    (total, question) => total + Number(question.points || 0),
                    0
                );
                const sectionAwarded = questions.reduce((total, question) => {
                    const review = questionReviews.find(
                        (item) => item.questionId === question.id
                    );

                    return total + Number(review?.awardedPoints || 0);
                }, 0);

                return (
                    <section className="reviewer-section" key={section.id || sectionIndex}>
                        <div className="reviewer-section-header">
                            <div>
                                <h4>{section.title || `Section ${sectionIndex + 1}`}</h4>
                                {section.description && <p>{section.description}</p>}
                            </div>
                            <strong>{sectionAwarded}/{sectionPoints} pts</strong>
                        </div>

                        <div className="scorecard-question-list">
                            {questions.map((question, questionIndex) => {
                                const review = questionReviews.find(
                                    (item) => item.questionId === question.id
                                ) || {};

                                return (
                                    <ScorecardQuestion
                                        assignment={assignment}
                                        question={question}
                                        questionIndex={questionIndex}
                                        review={review}
                                        key={question.id || questionIndex}
                                    />
                                );
                            })}
                        </div>
                    </section>
                );
            })}
        </div>
    );
}

function ScorecardQuestion({ assignment, question, questionIndex, review }) {
    return (
        <div className="scorecard-question-card">
            <div className="scorecard-question-header">
                <div>
                    <strong>{question.title || `Question ${questionIndex + 1}`}</strong>
                    <span>{formatQuestionType(question.type)}</span>
                </div>
                <strong>{review.awardedPoints || 0}/{review.maxPoints || question.points || 0} pts</strong>
            </div>

            <p>{question.prompt}</p>

            <div className="scorecard-answer-grid">
                <div>
                    <span>Candidate answer</span>
                    <p>{resolveSubmittedValue(assignment, question.id, assignment.submittedAnswers?.[question.id]) || "No answer submitted"}</p>
                </div>
                {question.correctAnswer && (
                    <div>
                        <span>Reviewer guidance</span>
                        <p>{question.correctAnswer}</p>
                    </div>
                )}
            </div>

            {question.type === "MULTIPLE_CHOICE" && (
                <div className="scorecard-option-list">
                    {(question.options || []).map((option) => (
                        <span
                            className={
                                option.id === assignment.submittedAnswers?.[question.id]
                                    ? "scorecard-option selected"
                                    : "scorecard-option"
                            }
                            key={option.id}
                        >
                            {option.text}
                            {option.correct ? " (correct)" : ""}
                        </span>
                    ))}
                </div>
            )}

            {review.notes && (
                <div className="scorecard-review-note">
                    <span>Reviewer note</span>
                    <p>{review.notes}</p>
                </div>
            )}
        </div>
    );
}

function SubmittedAnswersPanel({ assignment }) {
    const entries = Object.entries(assignment.submittedAnswers || {});

    if (entries.length === 0) {
        return null;
    }

    return (
        <div className="reviewer-section">
            <div className="reviewer-section-header">
                <div>
                    <h4>Structured Answers</h4>
                    <p>Answers submitted against v2 assessment questions.</p>
                </div>
            </div>

            <div className="test-case-result-list">
                {entries.map(([questionId, value]) => (
                    <div className="test-case-result-card" key={questionId}>
                        <div className="test-case-result-header">
                            <strong>{resolveQuestionTitle(assignment, questionId)}</strong>
                        </div>
                        <p className="muted-cell">{resolveSubmittedValue(assignment, questionId, value)}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

function resolveQuestionTitle(assignment, questionId) {
    const question = (assignment.sections || [])
        .flatMap((section) => section.questions || [])
        .find((item) => item.id === questionId);

    return question?.title || questionId;
}

function resolveSubmittedValue(assignment, questionId, value) {
    if (value === null || value === undefined || value === "") {
        return "";
    }

    const question = (assignment.sections || [])
        .flatMap((section) => section.questions || [])
        .find((item) => item.id === questionId);

    if (question?.type !== "MULTIPLE_CHOICE") {
        return value;
    }

    const option = (question.options || []).find((item) => item.id === value);
    return option?.text || value;
}

function formatQuestionType(type) {
    if (type === "MULTIPLE_CHOICE") {
        return "MCQ";
    }

    if (type === "SHORT_ANSWER") {
        return "Short answer";
    }

    if (type === "CODING_CHALLENGE") {
        return "Coding";
    }

    return type || "Question";
}

function formatReviewStatus(status) {
    if (status === "PENDING_SUBMISSION") {
        return "Pending submission";
    }

    if (status === "NEEDS_EXECUTION") {
        return "Needs execution";
    }

    if (status === "NEEDS_MANUAL_REVIEW") {
        return "Needs manual review";
    }

    if (status === "REVIEWED") {
        return "Reviewed";
    }

    return "Not set";
}

function formatPoints(value) {
    return value === null || value === undefined ? "-" : `${value} pts`;
}

function TestCasesTab({ assignment, testCases, testCaseResults }) {
    const hasResults = testCaseResults.length > 0;

    if (assignment.assessmentType !== "CODING_CHALLENGE") {
        return (
            <div className="reviewer-empty-state">
                This assessment does not use coding test cases.
            </div>
        );
    }

    return (
        <div className="reviewer-section-stack">
            {hasResults ? (
                <section className="reviewer-section">
                    <div className="reviewer-section-header">
                        <div>
                            <h4>Execution Results</h4>
                            <p>Compact pass/fail rows. Expand a row to inspect the raw values.</p>
                        </div>
                    </div>

                    <div className="compact-test-list">
                        {testCaseResults.map((result, index) => (
                            <AdminTestCaseResultRow
                                key={`${result.name}-${index}`}
                                result={result}
                                index={index}
                            />
                        ))}
                    </div>
                </section>
            ) : (
                <section className="reviewer-section">
                    <div className="reviewer-section-header">
                        <div>
                            <h4>Configured Test Cases</h4>
                            <p>No execution results yet. Expand rows to inspect setup.</p>
                        </div>
                    </div>

                    <div className="compact-test-list">
                        {testCases.map((testCase, index) => (
                            <ConfiguredTestCaseRow
                                key={`${testCase.name}-${index}`}
                                testCase={testCase}
                                index={index}
                            />
                        ))}
                    </div>
                </section>
            )}

            {hasResults && testCases.length > 0 && (
                <details className="reviewer-disclosure">
                    <summary>Assessment setup: {testCases.length} configured test cases</summary>
                    <div className="compact-test-list">
                        {testCases.map((testCase, index) => (
                            <ConfiguredTestCaseRow
                                key={`${testCase.name}-${index}`}
                                testCase={testCase}
                                index={index}
                            />
                        ))}
                    </div>
                </details>
            )}
        </div>
    );
}

function IntegrityTab({ assignment }) {
    const events = Array.isArray(assignment.integrityEvents)
        ? [...assignment.integrityEvents].sort((left, right) =>
            new Date(right.occurredAt || 0).getTime() -
            new Date(left.occurredAt || 0).getTime()
        )
        : [];
    const eventCounts = events.reduce((summary, event) => {
        summary[event.type] = (summary[event.type] || 0) + 1;
        return summary;
    }, {});

    if (events.length === 0) {
        return (
            <div className="reviewer-empty-state">
                No integrity events have been recorded for this assignment.
            </div>
        );
    }

    return (
        <div className="reviewer-section-stack">
            <section className="reviewer-section">
                <div className="reviewer-section-header">
                    <div>
                        <h4>Integrity Summary</h4>
                        <p>Candidate session behavior signals captured during the assessment.</p>
                    </div>
                    <strong>{events.length} events</strong>
                </div>

                <div className="score-breakdown-grid">
                    <ScoreBreakdownItem
                        label="Window changes"
                        count="blur/focus"
                        points={(eventCounts.WINDOW_BLUR || 0) + (eventCounts.VISIBILITY_HIDDEN || 0)}
                        unit="events"
                    />
                    <ScoreBreakdownItem
                        label="Clipboard"
                        count="copy/paste"
                        points={(eventCounts.COPY || 0) + (eventCounts.PASTE || 0)}
                        unit="events"
                    />
                    <ScoreBreakdownItem
                        label="Context menu"
                        count="right click"
                        points={eventCounts.CONTEXT_MENU || 0}
                        unit="events"
                    />
                    <ScoreBreakdownItem
                        label="Sessions"
                        count="open/close"
                        points={(eventCounts.SESSION_START || 0) + (eventCounts.SESSION_END || 0)}
                        unit="events"
                    />
                </div>
            </section>

            <section className="reviewer-section">
                <div className="reviewer-section-header">
                    <div>
                        <h4>Event Timeline</h4>
                        <p>Most recent activity first.</p>
                    </div>
                </div>

                <div className="compact-test-list">
                    {events.map((event, index) => (
                        <div className="compact-test-row" key={`${event.type}-${event.occurredAt}-${index}`}>
                            <div className="test-case-result-header">
                                <div>
                                    <strong>{formatIntegrityEventType(event.type)}</strong>
                                    <p className="muted-cell">{event.detail || "No detail provided"}</p>
                                </div>
                                <span>{formatDate(event.occurredAt)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}

function formatIntegrityEventType(type) {
    return (type || "OTHER")
        .toLowerCase()
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function GradingTab({
    assignment,
    gradeForms,
    gradingAssignmentId,
    onGradeChange,
    onGradeAssignment,
}) {
    const gradeForm = gradeForms[assignment.id] || {};
    const questionReviews = Array.isArray(gradeForm.questionReviews)
        ? gradeForm.questionReviews
        : buildManualReviewItems(assignment, assignment.questionReviews || []);
    const autoScore = getAutoScoredPoints(assignment);
    const finalScore = calculateReviewScore(questionReviews);
    const isSaving = gradingAssignmentId === assignment.id;
    const isDisabled = isSaving || Boolean(gradingAssignmentId);

    const updateQuestionReview = (questionId, field, value) => {
        const nextReviews = questionReviews.map((review) => {
            if (review.questionId !== questionId) {
                return review;
            }

            if (field === "awardedPoints") {
                const parsedValue = value === "" ? 0 : Number(value);
                const boundedValue = Math.min(
                    Math.max(Number.isNaN(parsedValue) ? 0 : parsedValue, 0),
                    Number(review.maxPoints || 0)
                );

                return {
                    ...review,
                    awardedPoints: boundedValue,
                    reviewed: true,
                };
            }

            return {
                ...review,
                [field]: value,
                reviewed: true,
            };
        });

        onGradeChange(assignment.id, "questionReviews", nextReviews);
    };

    return (
        <>
            {(assignment.status === "SUBMITTED" || assignment.status === "GRADED") && (
                <div className="grade-box detail-grade-box compact-grade-box">
                    <ManualGradeComposer
                        assignment={assignment}
                        autoScore={autoScore}
                        finalScore={finalScore}
                        gradeForm={gradeForm}
                        questionReviews={questionReviews}
                        onGradeChange={onGradeChange}
                        onQuestionReviewChange={updateQuestionReview}
                    />

                    <button
                        className="primary-button"
                        onClick={() => onGradeAssignment(assignment.id)}
                        disabled={isDisabled}
                    >
                        {isSaving ? "Saving Grade..." : "Save Grade"}
                    </button>
                </div>
            )}

            {assignment.status === "ASSIGNED" && (
                <div className="reviewer-empty-state">
                    The candidate has not submitted this assignment yet.
                </div>
            )}
        </>
    );
}

function ManualGradeComposer({
    assignment,
    autoScore,
    finalScore,
    gradeForm,
    questionReviews,
    onGradeChange,
    onQuestionReviewChange,
}) {
    const maxScore = assignment.maxScore || 100;

    return (
        <div className="manual-review-workflow">
            <div className="reviewer-section-header">
                <div>
                    <h4>Recruiter Score Review</h4>
                    <p>Review auto-scored marks, candidate answers, and adjust final scoring before saving.</p>
                </div>
            </div>

            <div className="score-breakdown-grid manual-score-grid">
                <ScoreBreakdownItem label="Auto-scored" count="coding and MCQ" points={autoScore} />
                <ScoreBreakdownItem label="Reviewed" count="all sections" points={finalScore} />
                <ScoreBreakdownItem label="Final Score" count={`out of ${maxScore}`} points={finalScore} />
                <ScoreBreakdownItem
                    label="Remaining"
                    count="unawarded"
                    points={Math.max(Number(maxScore) - Number(finalScore), 0)}
                />
            </div>

            <div className="manual-review-list">
                {getAssessmentSections(assignment).map((section, sectionIndex) => (
                    <section className="manual-review-section" key={section.id || sectionIndex}>
                        <div className="manual-review-section-header">
                            <h5>{section.title || `Section ${sectionIndex + 1}`}</h5>
                            {section.description && <p>{section.description}</p>}
                        </div>

                        {(section.questions || []).map((question, questionIndex) => {
                            const review = questionReviews.find((item) => item.questionId === question.id) || {};
                            const questionKey = question.id || `${sectionIndex}-${questionIndex}`;
                            const awardedPointsId = `assignment-${assignment.id}-question-${questionKey}-points`;
                            const reviewNotesId = `assignment-${assignment.id}-question-${questionKey}-notes`;
                            const submittedValue = resolveSubmittedValue(
                                assignment,
                                question.id,
                                assignment.submittedAnswers?.[question.id]
                            );

                            return (
                                <div className="manual-review-card" key={question.id || questionIndex}>
                                    <div className="manual-review-question">
                                        <div>
                                            <strong>{question.title || `Question ${questionIndex + 1}`}</strong>
                                            <small>{formatQuestionType(question.type)}</small>
                                            <p>{question.prompt}</p>
                                        </div>
                                        <span>{question.points || 0} pts</span>
                                    </div>

                                    <div className="manual-review-answer">
                                        <span>Candidate answer</span>
                                        <p>{submittedValue || (question.type === "CODING_CHALLENGE" ? "See submitted code and test results." : "No answer submitted")}</p>
                                    </div>

                                    {question.correctAnswer && (
                                        <div className="manual-review-answer guidance">
                                            <span>Reviewer guidance</span>
                                            <p>{question.correctAnswer}</p>
                                        </div>
                                    )}

                                    <div className="two-column-form manual-review-inputs">
                                        <div>
                                            <label htmlFor={awardedPointsId}>Awarded points</label>
                                            <input
                                                id={awardedPointsId}
                                                type="number"
                                                min="0"
                                                max={review.maxPoints || question.points || 0}
                                                value={review.awardedPoints ?? 0}
                                                onChange={(event) =>
                                                    onQuestionReviewChange(
                                                        question.id,
                                                        "awardedPoints",
                                                        event.target.value
                                                    )
                                                }
                                            />
                                            <small className="muted-cell">
                                                Auto score: {review.autoAwardedPoints ?? 0}/{review.maxPoints || question.points || 0}
                                            </small>
                                        </div>

                                        <div>
                                            <label htmlFor={reviewNotesId}>Reviewer notes</label>
                                            <textarea
                                                id={reviewNotesId}
                                                rows="3"
                                                value={review.notes || ""}
                                                onChange={(event) =>
                                                    onQuestionReviewChange(
                                                        question.id,
                                                        "notes",
                                                        event.target.value
                                                    )
                                                }
                                                placeholder="Internal notes for this answer"
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </section>
                ))}
            </div>

            <FeedbackField
                assignment={assignment}
                gradeForm={gradeForm}
                onGradeChange={onGradeChange}
            />
        </div>
    );
}

function FeedbackField({ assignment, gradeForm, onGradeChange }) {
    const feedbackId = `assignment-${assignment.id}-candidate-feedback`;

    return (
        <div>
            <label htmlFor={feedbackId}>Candidate feedback</label>
            <textarea
                id={feedbackId}
                rows="3"
                value={gradeForm.feedback ?? assignment.feedback ?? ""}
                onChange={(event) =>
                    onGradeChange(
                        assignment.id,
                        "feedback",
                        event.target.value
                    )
                }
                placeholder="Write candidate-facing feedback"
            />
        </div>
    );
}

function AdminTestCaseResultRow({ result, index }) {
    return (
        <details className="compact-test-row">
            <summary>
                <span className="compact-test-title">
                    {result.name || `Test case ${index + 1}`}
                    {result.hidden && <span className="hidden-test-label">Hidden</span>}
                </span>
                <span className="compact-test-meta">
                    <StatusBadge value={result.passed ? "PASSED" : "FAILED"} />
                    <span>{result.awardedPoints || 0}/{result.points || 0} pts</span>
                </span>
            </summary>

            <div className="compact-test-detail-grid">
                <DetailItem label="Exit Code" value={result.exitCode ?? "-"} />
                <DetailItem label="Timed Out" value={result.timedOut ? "Yes" : "No"} />
                <DetailItem label="Hidden" value={result.hidden ? "Yes" : "No"} />
            </div>

            <div className="compact-code-grid">
                <CodeBlock title="Input" value={result.input || "No input"} maxHeight="120px" />
                <CodeBlock title="Expected Output" value={result.expectedOutput || ""} maxHeight="120px" />
                <CodeBlock title="Actual Output" value={result.actualOutput || ""} maxHeight="120px" />
                <CodeBlock title="Error" value={result.error || ""} maxHeight="120px" />
            </div>
        </details>
    );
}

function ConfiguredTestCaseRow({ testCase, index }) {
    return (
        <details className="compact-test-row">
            <summary>
                <span className="compact-test-title">
                    {testCase.name || `Test case ${index + 1}`}
                    {testCase.hidden && <span className="hidden-test-label">Hidden</span>}
                </span>
                <span className="compact-test-meta">
                    <span>{testCase.points || 0} pts</span>
                </span>
            </summary>

            <div className="compact-code-grid two-up">
                <CodeBlock title="Input" value={testCase.input || "No input"} maxHeight="120px" />
                <CodeBlock title="Expected Output" value={testCase.expectedOutput || ""} maxHeight="120px" />
            </div>
        </details>
    );
}

function ReviewMetric({ label, value, hint }) {
    return (
        <div className="review-metric">
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{hint}</small>
        </div>
    );
}

function ScoreBreakdownItem({ label, count, points, unit = "pts" }) {
    const countLabel = typeof count === "number"
        ? `${count} ${count === 1 ? "item" : "items"}`
        : count;

    return (
        <div className="score-breakdown-item">
            <span>{label}</span>
            <strong>{points} {unit}</strong>
            <small>{countLabel}</small>
        </div>
    );
}

export default AssignmentDetailsPanel;
