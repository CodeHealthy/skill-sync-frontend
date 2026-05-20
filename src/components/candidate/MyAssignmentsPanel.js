import AssignmentDetail from "./AssignmentDetail";
import AssignmentList from "./AssignmentList";
import CandidateFilters from "./CandidateFilters";
import "../../css/DashboardPanels.css";

function MyAssignmentsPanel({
    assignments,
    paginatedAssignments,
    filteredCount,
    loadingAssignments,
    selectedAssignment,
    page,
    pageSize,
    searchTerm,
    organizationFilter,
    statusFilter,
    executionFilter,
    languageFilter,
    organizations,
    code,
    answer,
    submittingAssignmentId,
    runningAssignmentId,
    startingAssignmentId,
    runResult,
    onPageChange,
    onSelectAssignment,
    onSearchTermChange,
    onOrganizationFilterChange,
    onStatusFilterChange,
    onExecutionFilterChange,
    onLanguageFilterChange,
    onRefresh,
    onCodeChange,
    onAnswerChange,
    onRunCode,
    onStartAssignment,
    onSubmit,
}) {
    return (
        <div className="candidate-dashboard-panel">
            <section className="list-card">
                <div className="panel-heading-row">
                    <div>
                        <h2>Assessments</h2>
                        <p className="muted-cell">
                            Filter and open an assessment to work on it.
                        </p>
                    </div>

                    <button
                        className="secondary-button small-button"
                        type="button"
                        onClick={onRefresh}
                        disabled={loadingAssignments}
                    >
                        {loadingAssignments ? "Refreshing..." : "Refresh"}
                    </button>
                </div>

                <CandidateFilters
                    searchTerm={searchTerm}
                    organizationFilter={organizationFilter}
                    statusFilter={statusFilter}
                    executionFilter={executionFilter}
                    languageFilter={languageFilter}
                    organizations={organizations}
                    onSearchTermChange={onSearchTermChange}
                    onOrganizationFilterChange={onOrganizationFilterChange}
                    onStatusFilterChange={onStatusFilterChange}
                    onExecutionFilterChange={onExecutionFilterChange}
                    onLanguageFilterChange={onLanguageFilterChange}
                />

                <AssignmentList
                    assignments={assignments}
                    paginatedAssignments={paginatedAssignments}
                    filteredCount={filteredCount}
                    loadingAssignments={loadingAssignments}
                    selectedAssignment={selectedAssignment}
                    page={page}
                    pageSize={pageSize}
                    onPageChange={onPageChange}
                    onSelectAssignment={onSelectAssignment}
                />
            </section>

            <section className="list-card assessment-detail-card">
                {selectedAssignment ? (
                    <AssignmentDetail
                        assignment={selectedAssignment}
                        code={code}
                        answer={answer}
                        submittingAssignmentId={submittingAssignmentId}
                        runningAssignmentId={runningAssignmentId}
                        startingAssignmentId={startingAssignmentId}
                        runResult={runResult}
                        onCodeChange={onCodeChange}
                        onAnswerChange={onAnswerChange}
                        onRunCode={onRunCode}
                        onStartAssignment={onStartAssignment}
                        onSubmit={onSubmit}
                    />
                ) : (
                    <div className="empty-state">
                        <h3>Select an assessment</h3>
                        <p>Choose an assessment from the list to view details.</p>
                    </div>
                )}
            </section>
        </div>
    );
}

export default MyAssignmentsPanel;
