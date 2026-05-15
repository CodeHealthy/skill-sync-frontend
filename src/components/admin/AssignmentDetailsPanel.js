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
                <DetailItem label="Score" value={assignment.score ?? "Not graded"} />
                <DetailItem label="Assigned At" value={formatDate(assignment.assignedAt)} />
                <DetailItem label="Submitted At" value={formatDate(assignment.submittedAt)} />
            </div>

            <CodeBlock title="Prompt" value={assignment.prompt} />
            <CodeBlock title="Submitted Answer" value={assignment.submittedAnswer} />
            <CodeBlock title="Submitted Code" value={assignment.submittedCode} />
            <CodeBlock title="Expected Output" value={assignment.expectedOutput} />
            <CodeBlock title="Actual Output" value={assignment.actualOutput} />
            <CodeBlock title="Execution Error" value={assignment.executionError} />

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

export default AssignmentDetailsPanel;