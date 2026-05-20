import { useEffect, useState } from "react";
import CodeBlock from "../common/CodeBlock";
import DetailItem from "../common/DetailItem";
import StatusBadge from "../common/StatusBadge";
import { formatDate, formatLanguage } from "../../utils/formatters";

const DETAIL_TABS = [
    { id: "summary", label: "Summary" },
    { id: "submission", label: "Submission" },
    { id: "tests", label: "Test Cases" },
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
                    label="Execution"
                    value={assignment.executionStatus || "NOT_RUN"}
                    hint="status"
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
                    />
                )}

                {activeTab === "submission" && (
                    <SubmissionTab assignment={assignment} />
                )}

                {activeTab === "tests" && (
                    <TestCasesTab
                        assignment={assignment}
                        testCases={testCases}
                        testCaseResults={testCaseResults}
                    />
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
}) {
    return (
        <>
            <div className="detail-grid compact-detail-grid">
                <DetailItem label="Type" value={assignment.assessmentType} />
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
        </>
    );
}

function SubmissionTab({ assignment }) {
    return (
        <div className="reviewer-section-stack">
            <CodeBlock title="Prompt" value={assignment.prompt} maxHeight="180px" />
            <CodeBlock title="Submitted Answer" value={assignment.submittedAnswer} maxHeight="180px" />
            <CodeBlock title="Submitted Code" value={assignment.submittedCode} maxHeight="260px" />
            <CodeBlock title="Expected Output" value={assignment.expectedOutput} maxHeight="140px" />
            <CodeBlock title="Actual Output" value={assignment.actualOutput} maxHeight="140px" />
            <CodeBlock title="Execution Error" value={assignment.executionError} maxHeight="140px" />
        </div>
    );
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

function GradingTab({
    assignment,
    gradeForms,
    gradingAssignmentId,
    onGradeChange,
    onGradeAssignment,
}) {
    return (
        <>
            {assignment.status === "SUBMITTED" && (
                <div className="grade-box detail-grade-box compact-grade-box">
                    <h4>Manual Grade</h4>

                    <div className="two-column-form">
                        <div>
                            <label>Score</label>
                            <input
                                type="number"
                                min="0"
                                value={gradeForms[assignment.id]?.score || ""}
                                onChange={(event) =>
                                    onGradeChange(
                                        assignment.id,
                                        "score",
                                        event.target.value
                                    )
                                }
                                placeholder="Enter score"
                            />
                        </div>

                        <div>
                            <label>Feedback</label>
                            <textarea
                                rows="3"
                                value={gradeForms[assignment.id]?.feedback || ""}
                                onChange={(event) =>
                                    onGradeChange(
                                        assignment.id,
                                        "feedback",
                                        event.target.value
                                    )
                                }
                                placeholder="Write feedback"
                            />
                        </div>
                    </div>

                    <button
                        className="primary-button"
                        onClick={() => onGradeAssignment(assignment.id)}
                        disabled={
                            gradingAssignmentId === assignment.id ||
                            Boolean(gradingAssignmentId)
                        }
                    >
                        {gradingAssignmentId === assignment.id
                            ? "Saving Grade..."
                            : "Save Grade"}
                    </button>
                </div>
            )}

            {assignment.status === "GRADED" && (
                <div className="graded-box">
                    <h4>Saved Grade</h4>
                    <p>
                        <strong>Score:</strong>{" "}
                        {assignment.score !== null && assignment.score !== undefined
                            ? `${assignment.score}/${assignment.maxScore || 100}`
                            : "Not available"}
                    </p>
                    <p>
                        <strong>Feedback:</strong>{" "}
                        {assignment.feedback || "No feedback provided"}
                    </p>
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

function getReviewFlags(assignment) {
    const flags = [];

    if (assignment.autoSubmitted) {
        flags.push({ type: "auto", label: "Submitted automatically when time ended" });
    }

    if (isAssignmentOverdue(assignment)) {
        flags.push({ type: "overdue", label: "Due date has passed" });
    }

    if (isAssignmentExpired(assignment)) {
        flags.push({ type: "expired", label: "Time limit expired" });
    }

    if (assignment.timeLimitMinutes) {
        flags.push({ type: "timed", label: `${assignment.timeLimitMinutes}-minute assessment` });
    }

    return flags;
}

function isAssignmentOverdue(assignment) {
    return assignment.status === "ASSIGNED" &&
        Boolean(assignment.dueAt) &&
        new Date(assignment.dueAt).getTime() < Date.now();
}

function isAssignmentExpired(assignment) {
    return assignment.status === "ASSIGNED" &&
        Boolean(assignment.expiresAt) &&
        new Date(assignment.expiresAt).getTime() < Date.now();
}

export default AssignmentDetailsPanel;
