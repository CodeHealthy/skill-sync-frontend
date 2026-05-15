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
                    value={assignment.score ?? "Not graded"}
                />
            </div>

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

                    {runResult && (
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
                                    label="Exit Code"
                                    value={runResult.exitCode ?? "—"}
                                />
                                <DetailItem
                                    label="Timed Out"
                                    value={runResult.timedOut ? "Yes" : "No"}
                                />
                            </div>

                            <CodeBlock title="Output" value={runResult.stdout} maxHeight="180px" />
                            <CodeBlock title="Error" value={runResult.stderr} maxHeight="180px" />
                        </div>
                    )}
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
                    <CodeBlock title="Actual Output" value={assignment.actualOutput} />
                    <CodeBlock title="Execution Error" value={assignment.executionError} />
                </>
            )}

            {assignment.status === "SUBMITTED" && (
                <div className="pending-grade-box">
                    <strong>Submitted for review</strong>
                    <p>Your submission is waiting for admin review or automated execution.</p>
                </div>
            )}

            {assignment.status === "GRADED" && (
                <div className="graded-box">
                    <h4>Result</h4>
                    <p>
                        <strong>Score:</strong> {assignment.score}
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

function getRunResultStatus(result) {
    if (!result) {
        return "Not run";
    }

    if (result.timedOut) {
        return "Timeout";
    }

    if (result.exitCode !== 0) {
        return "Error";
    }

    return "Success";
}

export default AssignmentDetail;