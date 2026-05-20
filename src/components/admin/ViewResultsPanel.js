import AssignmentDetailsPanel from "./AssignmentDetailsPanel";
import AssignmentResultsTable from "./AssignmentResultsTable";
import "../../css/DashboardPanels.css";

function ViewResultsPanel({
    assignments,
    filteredCount,
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
    expandedAssignment,
    gradeForms,
    gradingAssignmentId,
    onGradeChange,
    onGradeAssignment,
}) {
    return (
        <div className="dashboard-panel-stack">
            <AssignmentResultsTable
                assignments={assignments}
                totalItems={filteredCount}
                page={page}
                pageSize={pageSize}
                assignmentSearch={assignmentSearch}
                assignmentStatusFilter={assignmentStatusFilter}
                assignmentExecutionFilter={assignmentExecutionFilter}
                assignmentLanguageFilter={assignmentLanguageFilter}
                expandedAssignmentId={expandedAssignmentId}
                executingAssignmentId={executingAssignmentId}
                onAssignmentSearchChange={onAssignmentSearchChange}
                onAssignmentStatusFilterChange={onAssignmentStatusFilterChange}
                onAssignmentExecutionFilterChange={onAssignmentExecutionFilterChange}
                onAssignmentLanguageFilterChange={onAssignmentLanguageFilterChange}
                onPageChange={onPageChange}
                onToggleDetails={onToggleDetails}
                onExecuteAssignment={onExecuteAssignment}
            />

            {expandedAssignment && (
                <AssignmentDetailsPanel
                    assignment={expandedAssignment}
                    gradeForms={gradeForms}
                    gradingAssignmentId={gradingAssignmentId}
                    onGradeChange={onGradeChange}
                    onGradeAssignment={onGradeAssignment}
                />
            )}
        </div>
    );
}

export default ViewResultsPanel;
