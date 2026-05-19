import StatusBadge from "../common/StatusBadge";
import DetailItem from "../common/DetailItem";
import CodeBlock from "../common/CodeBlock";
import {
    formatAssessmentType,
    formatDate,
    formatLanguage,
} from "../../utils/formatters";

function AssignmentDetail({
    assignment,
    code,
    answer,
    submittingAssignmentId,
    runningAssignmentId,
    runResult,
    onCodeChange,
    onAnswerChange,
    onRunCode,
    onSubmit,
}) {
    const isCodingChallenge = assignment.assessmentType === "CODING_CHALLENGE";
    const isAssigned = assignment.status === "ASSIGNED";

    const isSubmitting = submittingAssignmentId === assignment.id;
    const isRunning = runningAssignmentId === assignment.id;

    const isAnySubmitting = Boolean(submittingAssignmentId);
    const isAnyRunning = Boolean(runningAssignmentId);
    const isBusy = isAnySubmitting || isAnyRunning;

    const visibleTestCases = Array.isArray(assignment.testCases)
        ? assignment.testCases.filter((testCase) => !testCase.hidden)
        : [];

    const testCaseResults = Array.isArray(assignment.testCaseResults)
        ? assignment.testCaseResults
        : [];

    return (
        <div>
            <div className="detail-panel-header candidate-detail-header">
                <div>
                    <p className="eyebrow">{assignment.organizationName || "Organization"}</p>
                    <h2>{assignment.assessmentTitle}</h2>
                    <p>{assignment.prompt}</p>
                </div>

                <div className="detail-status-stack">
                    <StatusBadge value={assignment.status} />
                    <StatusBadge value={assignment.executionStatus || "NOT_RUN"} />
                </div>
            </div>

            <div className="detail-grid">
                <DetailItem
                    label="Organization"
                    value={assignment.organizationName || "Organization"}
                />
                <DetailItem
                    label="Type"
                    value={formatAssessmentType(assignment.assessmentType)}
                />
                <DetailItem
                    label="Language"
                    value={formatLanguage(assignment.language)}
                />
                <DetailItem
                    label="Assigned At"
                    value={formatDate(assignment.assignedAt)}
                />
                <DetailItem
                    label="Submitted At"
                    value={formatDate(assignment.submittedAt)}
                />
                <DetailItem
                    label="Score"
                    value={
                        assignment.score !== null && assignment.score !== undefined
                            ? `${assignment.score}/${assignment.maxScore || 100}`
                            : "Not graded"
                    }
                />
            </div>

            {isCodingChallenge && visibleTestCases.length > 0 && (
                <div className="test-case-preview-section">
                    <h4>Sample Test Cases</h4>
                    <p className="muted-cell">
                        These are visible examples. Final grading may include hidden test cases.
                    </p>

                    <div className="test-case-result-list">
                        {visibleTestCases.map((testCase, index) => (
                            <div className="test-case-result-card" key={`${testCase.name}-${index}`}>
                                <div className="test-case-result-header">
                                    <strong>{testCase.name || `Sample case ${index + 1}`}</strong>
                                    <span>{testCase.points ?? 0} pts</span>
                                </div>

                                <CodeBlock
                                    title="Input"
                                    value={testCase.input || "No input"}
                                    maxHeight="140px"
                                />

                                <CodeBlock
                                    title="Expected Output"
                                    value={testCase.expectedOutput || ""}
                                    maxHeight="140px"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {isAssigned && isCodingChallenge && (
                <div className="submission-panel">
                    <label>Your Code</label>
                    <textarea
                        rows="16"
                        className="code-textarea"
                        value={code}
                        onChange={(event) => onCodeChange(assignment.id, event.target.value)}
                        placeholder="Write your code here"
                        disabled={isBusy}
                    />

                    <div className="button-row-left">
                        <button
                            className="secondary-button"
                            onClick={() => onRunCode(assignment)}
                            disabled={isBusy}
                        >
                            {isRunning ? "Running..." : "Run Code"}
                        </button>

                        <button
                            className="primary-button"
                            onClick={() => onSubmit(assignment)}
                            disabled={isBusy}
                        >
                            {isSubmitting ? "Submitting..." : "Submit Code"}
                        </button>
                    </div>

                    {runResult && <RunResultPanel runResult={runResult} />}
                </div>
            )}

            {isAssigned && !isCodingChallenge && (
                <div className="submission-panel">
                    <label>Your Answer</label>
                    <textarea
                        rows="10"
                        value={answer}
                        onChange={(event) => onAnswerChange(assignment.id, event.target.value)}
                        placeholder="Write your answer here"
                        disabled={isAnySubmitting}
                    />

                    <button
                        className="primary-button"
                        onClick={() => onSubmit(assignment)}
                        disabled={isAnySubmitting}
                    >
                        {isSubmitting ? "Submitting..." : "Submit Answer"}
                    </button>
                </div>
            )}

            {!isAssigned && (
                <>
                    <CodeBlock title="Your Submission" value={assignment.submittedAnswer} />
                    <CodeBlock title="Your Code" value={assignment.submittedCode} />

                    {testCaseResults.length === 0 && (
                        <>
                            <CodeBlock title="Actual Output" value={assignment.actualOutput} />
                            <CodeBlock title="Execution Error" value={assignment.executionError} />
                        </>
                    )}

                    {testCaseResults.length > 0 && (
                        <div className="test-case-preview-section">
                            <h4>Grading Test Results</h4>
                            <p className="muted-cell">
                                Hidden test cases show pass/fail only. Details are hidden.
                            </p>

                            <div className="test-case-result-list">
                                {testCaseResults.map((result, index) => (
                                    <TestCaseResultCard
                                        key={`${result.name}-${index}`}
                                        result={result}
                                        index={index}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {assignment.status === "SUBMITTED" && (
                <div className="pending-grade-box">
                    <strong>Submitted for review</strong>
                    <p>Thank you for submitting your test, your submission is waiting for admin review.</p>
                </div>
            )}

            {assignment.status === "GRADED" && (
                <div className="graded-box">
                    <h4>Result</h4>
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
        </div>
    );
}

function RunResultPanel({ runResult }) {
    const testResults = Array.isArray(runResult.testResults)
        ? runResult.testResults
        : [];

    return (
        <div className="run-result-box">
            <h4>Run Result</h4>

            <div className="detail-grid">
                <DetailItem
                    label="Status"
                    value={getRunResultStatus(runResult)}
                />
                <DetailItem
                    label="Language"
                    value={formatLanguage(runResult.language)}
                />
                <DetailItem
                    label="Passed Tests"
                    value={`${runResult.passedTests || 0}/${runResult.totalTests || 0}`}
                />
                <DetailItem
                    label="Sample Score"
                    value={`${runResult.awardedPoints || 0}/${runResult.totalPoints || 0}`}
                />
            </div>

            {testResults.length > 0 && (
                <div className="test-case-result-list">
                    {testResults.map((result, index) => (
                        <TestCaseResultCard
                            key={`${result.name}-${index}`}
                            result={result}
                            index={index}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function TestCaseResultCard({ result, index }) {
    const isHidden = Boolean(result.hidden);

    return (
        <div className="test-case-result-card">
            <div className="test-case-result-header">
                <div>
                    <strong>{result.name || `Test case ${index + 1}`}</strong>
                    {isHidden && <span className="hidden-test-label">Hidden</span>}
                </div>

                <StatusBadge value={result.passed ? "PASSED" : "FAILED"} />
            </div>

            {!isHidden && (
                <div className="detail-grid">
                    <DetailItem
                        label="Points"
                        value={`${result.awardedPoints || 0}/${result.points || 0}`}
                    />
                    <DetailItem
                        label="Exit Code"
                        value={result.exitCode ?? "—"}
                    />
                    <DetailItem
                        label="Timed Out"
                        value={result.timedOut ? "Yes" : "No"}
                    />
                </div>
            )}

            {isHidden && (
                <div className="detail-grid">
                    <DetailItem
                        label="Points"
                        value={`${result.awardedPoints || 0}/${result.points || 0}`}
                    />
                    <DetailItem
                        label="Details"
                        value="Hidden"
                    />
                    <DetailItem
                        label="Result"
                        value={result.passed ? "Passed" : "Failed"}
                    />
                </div>
            )}

            {!isHidden && (
                <>
                    <CodeBlock
                        title="Input"
                        value={result.input || "No input"}
                        maxHeight="140px"
                    />

                    <CodeBlock
                        title="Expected Output"
                        value={result.expectedOutput || ""}
                        maxHeight="140px"
                    />

                    <CodeBlock
                        title="Actual Output"
                        value={result.actualOutput || ""}
                        maxHeight="140px"
                    />

                    <CodeBlock
                        title="Error"
                        value={result.error || ""}
                        maxHeight="140px"
                    />
                </>
            )}

            {isHidden && (
                <p className="muted-cell">
                    Details for this hidden test case are not shown.
                </p>
            )}
        </div>
    );
}

function getRunResultStatus(result) {
    if (!result) {
        return "Not run";
    }

    if (!result.totalTests) {
        return "No tests";
    }

    if (result.passedTests === result.totalTests) {
        return "All sample tests passed";
    }

    if (result.passedTests > 0) {
        return "Some sample tests passed";
    }

    return "Sample tests failed";
}

export default AssignmentDetail;