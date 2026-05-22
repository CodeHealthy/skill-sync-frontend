import EmptyTableRow from "../common/EmptyTableRow";
import Pagination from "../common/Pagination";
import SectionHeader from "../common/SectionHeader";
import StatusBadge from "../common/StatusBadge";
import {
    getHiringSignal,
    getReviewFlags,
    getScorePercent,
} from "../../features/results/resultReviewUtils";
import { formatAssessmentType, formatDate, formatLanguage } from "../../utils/formatters";

function AssignmentResultsTable({
    assignments,
    totalItems,
    page,
    pageSize,
    assignmentSearch,
    assignmentStatusFilter,
    assignmentExecutionFilter,
    assignmentLanguageFilter,
    expandedAssignmentId,
    executingAssignmentId,
    onAssignmentSearchChange,
    onAssignmentStatusFilterChange,
    onAssignmentExecutionFilterChange,
    onAssignmentLanguageFilterChange,
    onPageChange,
    onToggleDetails,
    onExecuteAssignment,
}) {
    return (
        <section className="list-card">
            <SectionHeader
                title="Assignment Results"
                subtitle="Review submissions, execute coding challenges, and grade results."
            />

            <div className="table-toolbar assignment-toolbar">
                <input
                    value={assignmentSearch}
                    onChange={(event) => onAssignmentSearchChange(event.target.value)}
                    placeholder="Search candidate, email, or assessment"
                />

                <select
                    value={assignmentStatusFilter}
                    onChange={(event) => onAssignmentStatusFilterChange(event.target.value)}
                >
                    <option value="ALL">All statuses</option>
                    <option value="ASSIGNED">Assigned</option>
                    <option value="SUBMITTED">Submitted</option>
                    <option value="GRADED">Graded</option>
                    <option value="OVERDUE">Overdue</option>
                    <option value="EXPIRED">Expired</option>
                    <option value="AUTO_SUBMITTED">Auto-submitted</option>
                </select>

                <select
                    value={assignmentExecutionFilter}
                    onChange={(event) =>
                        onAssignmentExecutionFilterChange(event.target.value)
                    }
                >
                    <option value="ALL">All execution statuses</option>
                    <option value="NOT_RUN">Not executed</option>
                    <option value="PENDING_EXECUTION">Pending execution</option>
                    <option value="PASSED">Passed</option>
                    <option value="FAILED">Failed</option>
                    <option value="ERROR">Error</option>
                    <option value="TIMEOUT">Timeout</option>
                </select>

                <select
                    value={assignmentLanguageFilter}
                    onChange={(event) =>
                        onAssignmentLanguageFilterChange(event.target.value)
                    }
                >
                    <option value="ALL">All languages</option>
                    <option value="JAVA">Java</option>
                    <option value="JAVASCRIPT">JavaScript</option>
                    <option value="PYTHON">Python</option>
                    <option value="TEXT">Text</option>
                </select>
            </div>

            <div className="table-wrapper">
                <table className="data-table results-table">
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Candidate</th>
                            <th>Assessment</th>
                            <th>Language</th>
                            <th>Signal</th>
                            <th>Status</th>
                            <th>Execution</th>
                            <th>Tests</th>
                            <th>Score</th>
                            <th>Due</th>
                            <th>Submitted</th>
                            <th>Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {assignments.map((assignment, index) => {
                            const testCaseResults = Array.isArray(
                                assignment.testCaseResults
                            )
                                ? assignment.testCaseResults
                                : [];

                            const passedTests = testCaseResults.filter(
                                (result) => result.passed
                            ).length;

                            const totalTests =
                                testCaseResults.length ||
                                (Array.isArray(assignment.testCases)
                                    ? assignment.testCases.length
                                    : 0);
                            const reviewFlags = getReviewFlags(assignment);
                            const scorePercent = getScorePercent(assignment);
                            const signal = getHiringSignal(assignment);
                            const rank = (page - 1) * pageSize + index + 1;

                            return (
                                <tr key={assignment.id}>
                                    <td data-label="Rank">
                                        <span className="rank-pill">#{rank}</span>
                                    </td>

                                    <td data-label="Candidate">
                                        <div className="primary-cell">
                                            {assignment.candidateName}
                                        </div>
                                        <div className="muted-cell">
                                            {assignment.candidateEmail}
                                        </div>
                                    </td>

                                    <td data-label="Assessment">
                                        <div className="primary-cell">
                                            {assignment.assessmentTitle}
                                        </div>
                                        <div className="muted-cell">
                                            {formatAssessmentType(assignment.assessmentType)}
                                        </div>
                                    </td>

                                    <td data-label="Language">
                                        {formatLanguage(assignment.language)}
                                    </td>

                                    <td data-label="Signal">
                                        <span className={`hiring-signal hiring-signal-${signal.type}`}>
                                            {signal.label}
                                        </span>
                                    </td>

                                    <td data-label="Status">
                                        <StatusBadge value={assignment.status} />
                                        {reviewFlags.length > 0 && (
                                            <div className="review-flag-list">
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
                                    </td>

                                    <td data-label="Execution">
                                        <StatusBadge
                                            value={assignment.executionStatus || "NOT_RUN"}
                                        />
                                    </td>

                                    <td data-label="Tests">
                                        {assignment.assessmentType === "CODING_CHALLENGE" ? (
                                            <div>
                                                <div className="primary-cell">
                                                    {testCaseResults.length > 0
                                                        ? `${passedTests}/${testCaseResults.length}`
                                                        : totalTests > 0
                                                            ? `${totalTests} configured`
                                                            : "-"}
                                                </div>
                                                <div className="muted-cell">
                                                    {testCaseResults.length > 0
                                                        ? `${passedTests === 1 ? "test" : "tests"} passed`
                                                        : "not executed"}
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="muted-cell">
                                                Not applicable
                                            </span>
                                        )}
                                    </td>

                                    <td data-label="Score">
                                        {assignment.score !== null &&
                                            assignment.score !== undefined ? (
                                            <div className="score-cell">
                                                <strong>{assignment.score}/{assignment.maxScore || 100}</strong>
                                                <span>{scorePercent}%</span>
                                            </div>
                                        ) : (
                                            "-"
                                        )}
                                    </td>

                                    <td data-label="Due">
                                        <div className="primary-cell">
                                            {formatDate(assignment.dueAt)}
                                        </div>
                                        <div className="muted-cell">
                                            {assignment.timeLimitMinutes
                                                ? `${assignment.timeLimitMinutes} min limit`
                                                : "No time limit"}
                                        </div>
                                    </td>

                                    <td data-label="Submitted">
                                        {formatDate(assignment.submittedAt)}
                                    </td>

                                    <td data-label="Actions">
                                        <div className="table-actions">
                                            {assignment.status === "SUBMITTED" &&
                                                assignment.assessmentType === "CODING_CHALLENGE" && (
                                                    <button
                                                        className="primary-button small-button"
                                                        onClick={() =>
                                                            onExecuteAssignment(assignment.id)
                                                        }
                                                        disabled={
                                                            executingAssignmentId ===
                                                            assignment.id ||
                                                            Boolean(executingAssignmentId)
                                                        }
                                                    >
                                                        {executingAssignmentId ===
                                                            assignment.id
                                                            ? "Running..."
                                                            : "Run"}
                                                    </button>
                                                )}

                                            <button
                                                className="secondary-button small-button"
                                                onClick={() => onToggleDetails(assignment.id)}
                                            >
                                                {expandedAssignmentId === assignment.id
                                                    ? "Hide"
                                                    : "Details"}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}

                        {assignments.length === 0 && (
                            <EmptyTableRow
                                colSpan={12}
                                message="No assignment results found."
                            />
                        )}
                    </tbody>
                </table>
            </div>

            <Pagination
                page={page}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={onPageChange}
            />
        </section>
    );
}

export default AssignmentResultsTable;
