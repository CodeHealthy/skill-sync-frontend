import EmptyTableRow from "../common/EmptyTableRow";
import Pagination from "../common/Pagination";
import SectionHeader from "../common/SectionHeader";
import StatusBadge from "../common/StatusBadge";
import { formatDate, formatLanguage } from "../../utils/formatters";

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
                </select>

                <select
                    value={assignmentExecutionFilter}
                    onChange={(event) => onAssignmentExecutionFilterChange(event.target.value)}
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
                    onChange={(event) => onAssignmentLanguageFilterChange(event.target.value)}
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
                            <th>Candidate</th>
                            <th>Assessment</th>
                            <th>Language</th>
                            <th>Status</th>
                            <th>Execution</th>
                            <th>Tests</th>
                            <th>Score</th>
                            <th>Submitted</th>
                            <th>Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {assignments.map((assignment) => {
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

                            return (
                                <tr key={assignment.id}>
                                    <td>
                                        <div className="primary-cell">
                                            {assignment.candidateName}
                                        </div>
                                        <div className="muted-cell">
                                            {assignment.candidateEmail}
                                        </div>
                                    </td>

                                    <td>
                                        <div className="primary-cell">
                                            {assignment.assessmentTitle}
                                        </div>
                                        <div className="muted-cell">
                                            {assignment.assessmentType}
                                        </div>
                                    </td>

                                    <td>{formatLanguage(assignment.language)}</td>

                                    <td>
                                        <StatusBadge value={assignment.status} />
                                    </td>

                                    <td>
                                        <StatusBadge value={assignment.executionStatus || "NOT_RUN"} />
                                    </td>

                                    <td>
                                        {assignment.assessmentType === "CODING_CHALLENGE" ? (
                                            <div>
                                                <div className="primary-cell">
                                                    {testCaseResults.length > 0
                                                        ? `${passedTests}/${testCaseResults.length}`
                                                        : totalTests > 0
                                                            ? `${totalTests} configured`
                                                            : "—"}
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

                                    <td>
                                        {assignment.score !== null &&
                                            assignment.score !== undefined
                                            ? `${assignment.score}/${assignment.maxScore || 100}`
                                            : "—"}
                                    </td>

                                    <td>{formatDate(assignment.submittedAt)}</td>

                                    <td>
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
                                colSpan={9}
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