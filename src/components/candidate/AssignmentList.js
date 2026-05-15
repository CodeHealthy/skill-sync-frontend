import StatusBadge from "../common/StatusBadge";
import Pagination from "../common/Pagination";
import { formatDate, formatLanguage } from "../../utils/formatters";

function AssignmentList({
    assignments,
    paginatedAssignments,
    filteredCount,
    loadingAssignments,
    selectedAssignment,
    page,
    pageSize,
    onPageChange,
    onSelectAssignment,
}) {
    if (!loadingAssignments && assignments.length === 0) {
        return (
            <div className="empty-state">
                <h3>No assessments yet</h3>
                <p>
                    Once an organization assigns you an assessment, it will appear here.
                </p>
            </div>
        );
    }

    if (assignments.length > 0 && paginatedAssignments.length === 0) {
        return (
            <div className="empty-state">
                <h3>No matching assessments</h3>
                <p>Try changing your filters or search term.</p>
            </div>
        );
    }

    return (
        <>
            <div className="assessment-list">
                {paginatedAssignments.map((assignment) => (
                    <button
                        type="button"
                        className={`assessment-list-item ${
                            selectedAssignment?.id === assignment.id ? "active" : ""
                        }`}
                        key={assignment.id}
                        onClick={() => onSelectAssignment(assignment.id)}
                    >
                        <div className="assessment-list-top">
                            <strong>{assignment.assessmentTitle}</strong>
                            <StatusBadge value={assignment.status} />
                        </div>

                        <p>{assignment.organizationName || "Organization"}</p>

                        <div className="assessment-list-meta">
                            <span>{formatLanguage(assignment.language)}</span>
                            <span>{formatDate(assignment.assignedAt)}</span>
                        </div>
                    </button>
                ))}
            </div>

            <Pagination
                page={page}
                totalItems={filteredCount}
                pageSize={pageSize}
                onPageChange={onPageChange}
            />
        </>
    );
}

export default AssignmentList;