import CodeBlock from "../common/CodeBlock";
import DetailItem from "../common/DetailItem";
import StatusBadge from "../common/StatusBadge";
import { formatDate, formatLanguage } from "../../utils/formatters";

function AssignmentDetailsPanel({
    assignment,
    gradeForms,
    gradingAssignmentId,
    onGradeChange,
    onGradeAssignment,
}) {
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

    const totalResultPoints = testCaseResults.reduce(
        (total, result) => total + Number(result.points || 0),
        0
    );

    const awardedResultPoints = testCaseResults.reduce(
        (total, result) => total + Number(result.awardedPoints || 0),
        0
    );

    return (
        <div className="detail-panel">
            <div className="detail-panel-header">
                <div>
                    <h3>{assignment.assessmentTitle}</h3>
                    <p>
                        {assignment.candidateName} · {assignment.candidateEmail}
                    </p>
                </div>

                <StatusBadge value={assignment.status} />
            </div>

            <div className="detail-grid">
                <DetailItem label="Type" value={assignment.assessmentType} />
                <DetailItem label="Language" value={formatLanguage(assignment.language)} />
                <DetailItem
                    label="Execution Status"
                    value={assignment.executionStatus || "NOT_RUN"}
                />
                <DetailItem
                    label="Score"
                    value={
                        assignment.score !== null && assignment.score !== undefined
                            ? `${assignment.score}/${assignment.maxScore || 100}`
                            : "Not graded"
                    }
                />
                <DetailItem label="Assigned At" value={formatDate(assignment.assignedAt)} />
                <DetailItem label="Submitted At" value={formatDate(assignment.submittedAt)} />
            </div>

            {testCaseResults.length > 0 && (
                <div className="detail-grid">
                    <DetailItem
                        label="Passed Tests"
                        value={`${passedTests}/${testCaseResults.length}`}
                    />
                    <DetailItem
                        label="Awarded Points"
                        value={`${awardedResultPoints}/${totalResultPoints}`}
                    />
                    <DetailItem
                        label="Hidden Tests"
                        value={
                            testCaseResults.filter((result) => result.hidden).length
                        }
                    />
                </div>
            )}

            <CodeBlock title="Prompt" value={assignment.prompt} />
            <CodeBlock title="Submitted Answer" value={assignment.submittedAnswer} />
            <CodeBlock title="Submitted Code" value={assignment.submittedCode} />

            {assignment.assessmentType === "CODING_CHALLENGE" &&
                testCases.length > 0 && (
                    <div className="test-case-preview-section">
                        <h4>Configured Test Cases</h4>
                        <p className="muted-cell">
                            Admin view includes visible and hidden test cases.
                        </p>

                        <div className="test-case-result-list">
                            {testCases.map((testCase, index) => (
                                <div
                                    className="test-case-result-card"
                                    key={`${testCase.name}-${index}`}
                                >
                                    <div className="test-case-result-header">
                                        <div>
                                            <strong>
                                                {testCase.name ||
                                                    `Test case ${index + 1}`}
                                            </strong>
                                            {testCase.hidden && (
                                                <span className="hidden-test-label">
                                                    Hidden
                                                </span>
                                            )}
                                        </div>

                                        <span>{testCase.points || 0} pts</span>
                                    </div>

                                    <CodeBlock
                                        title="Input"
                                        value={testCase.input || "No input"}
                                        maxHeight="160px"
                                    />

                                    <CodeBlock
                                        title="Expected Output"
                                        value={testCase.expectedOutput || ""}
                                        maxHeight="160px"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            {testCaseResults.length > 0 ? (
                <div className="test-case-preview-section">
                    <h4>Execution Test Results</h4>
                    <p className="muted-cell">
                        These are the test case results from automated Docker grading.
                    </p>

                    <div className="test-case-result-list">
                        {testCaseResults.map((result, index) => (
                            <AdminTestCaseResultCard
                                key={`${result.name}-${index}`}
                                result={result}
                                index={index}
                            />
                        ))}
                    </div>
                </div>
            ) : (
                <>
                    <CodeBlock title="Expected Output" value={assignment.expectedOutput} />
                    <CodeBlock title="Actual Output" value={assignment.actualOutput} />
                    <CodeBlock title="Execution Error" value={assignment.executionError} />
                </>
            )}

            {assignment.status === "SUBMITTED" && (
                <div className="grade-box detail-grade-box">
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
                    <p>
                        <strong>Feedback:</strong>{" "}
                        {assignment.feedback || "No feedback provided"}
                    </p>
                </div>
            )}
        </div>
    );
}

function AdminTestCaseResultCard({ result, index }) {
    return (
        <div className="test-case-result-card">
            <div className="test-case-result-header">
                <div>
                    <strong>{result.name || `Test case ${index + 1}`}</strong>
                    {result.hidden && (
                        <span className="hidden-test-label">Hidden</span>
                    )}
                </div>

                <StatusBadge value={result.passed ? "PASSED" : "FAILED"} />
            </div>

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

            <CodeBlock
                title="Input"
                value={result.input || "No input"}
                maxHeight="160px"
            />

            <CodeBlock
                title="Expected Output"
                value={result.expectedOutput || ""}
                maxHeight="160px"
            />

            <CodeBlock
                title="Actual Output"
                value={result.actualOutput || ""}
                maxHeight="160px"
            />

            <CodeBlock
                title="Error"
                value={result.error || ""}
                maxHeight="160px"
            />
        </div>
    );
}

export default AssignmentDetailsPanel;