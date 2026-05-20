import StatusBadge from "../common/StatusBadge";
import { formatDate, formatLanguage } from "../../utils/formatters";
import "../../css/DashboardPanels.css";

function CandidateResultsPanel({ assignments }) {
    const gradedAssignments = assignments.filter(
        (assignment) => assignment.status === "GRADED"
    );

    return (
        <div className="dashboard-panel-stack">
            {gradedAssignments.length === 0 ? (
                <div className="empty-state">
                    <h3>No results yet</h3>
                    <p>Graded assessment results will appear here.</p>
                </div>
            ) : (
                <div className="result-card-grid">
                    {gradedAssignments.map((assignment) => (
                        <ResultCard key={assignment.id} assignment={assignment} />
                    ))}
                </div>
            )}
        </div>
    );
}

function ResultCard({ assignment }) {
    const score = assignment.score ?? 0;
    const maxScore = assignment.maxScore || 100;
    const testCaseResults = Array.isArray(assignment.testCaseResults)
        ? assignment.testCaseResults
        : [];
    const passedTests = testCaseResults.filter((result) => result.passed).length;

    return (
        <article className="result-card">
            <div className="result-card-header">
                <div>
                    <p className="eyebrow">{assignment.organizationName || "Organization"}</p>
                    <h3>{assignment.assessmentTitle}</h3>
                </div>
                <StatusBadge value={assignment.executionStatus || assignment.status} />
            </div>

            <div className="result-score">
                <strong>{score}</strong>
                <span>/ {maxScore}</span>
            </div>

            <div className="profile-detail-grid">
                <ResultDetail label="Language" value={formatLanguage(assignment.language)} />
                <ResultDetail label="Graded" value={formatDate(assignment.gradedAt)} />
                <ResultDetail
                    label="Tests"
                    value={
                        testCaseResults.length > 0
                            ? `${passedTests}/${testCaseResults.length} passed`
                            : "Not applicable"
                    }
                />
            </div>

            <div className="result-feedback">
                <strong>Feedback</strong>
                <p>{assignment.feedback || "No feedback provided."}</p>
            </div>
        </article>
    );
}

function ResultDetail({ label, value }) {
    return (
        <div className="profile-detail-item">
            <span>{label}</span>
            <strong>{value}</strong>
        </div>
    );
}

export default CandidateResultsPanel;
