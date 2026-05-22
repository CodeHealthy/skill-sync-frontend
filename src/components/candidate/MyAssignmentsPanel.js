import { Link } from "react-router-dom";
import AssignmentList from "./AssignmentList";
import CandidateFilters from "./CandidateFilters";
import DetailItem from "../common/DetailItem";
import { formatAssessmentType, formatDate, formatLanguage } from "../../utils/formatters";
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
    onPageChange,
    onSelectAssignment,
    onSearchTermChange,
    onOrganizationFilterChange,
    onStatusFilterChange,
    onExecutionFilterChange,
    onLanguageFilterChange,
    onRefresh,
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
                    <AssignmentLaunchCard assignment={selectedAssignment} />
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

function AssignmentLaunchCard({ assignment }) {
    const sections = Array.isArray(assignment.sections) ? assignment.sections : [];
    const questions = sections.flatMap((section) => section.questions || []);
    const canOpen = assignment.status === "ASSIGNED";

    return (
        <div className="candidate-launch-card">
            <div className="candidate-launch-header">
                <div>
                    <p className="eyebrow">{assignment.organizationName || "Organization"}</p>
                    <h2>{assignment.assessmentTitle}</h2>
                    <p>{assignment.prompt}</p>
                </div>
            </div>

            <div className="detail-grid">
                <DetailItem label="Type" value={formatAssessmentType(assignment.assessmentType)} />
                <DetailItem label="Language" value={formatLanguage(assignment.language)} />
                <DetailItem label="Sections" value={sections.length || 1} />
                <DetailItem label="Questions" value={questions.length || 1} />
                <DetailItem label="Due At" value={formatDate(assignment.dueAt)} />
                <DetailItem
                    label="Time Limit"
                    value={assignment.timeLimitMinutes ? `${assignment.timeLimitMinutes} minutes` : "No limit"}
                />
            </div>

            <div className="candidate-launch-actions">
                {canOpen ? (
                    <Link
                        className="primary-button"
                        to={`/candidate/assessments/${assignment.id}`}
                    >
                        Open assessment workspace
                    </Link>
                ) : (
                    <Link
                        className="secondary-button"
                        to={`/candidate/assessments/${assignment.id}`}
                    >
                        View submission
                    </Link>
                )}
            </div>
        </div>
    );
}

export default MyAssignmentsPanel;
