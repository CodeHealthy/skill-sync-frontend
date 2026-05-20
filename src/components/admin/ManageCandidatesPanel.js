import CandidateInviteForm from "./CandidateInviteForm";
import CandidateTable from "./CandidateTable";
import "../../css/DashboardPanels.css";

function ManageCandidatesPanel({
    candidates,
    filteredCount,
    page,
    pageSize,
    candidateSearch,
    candidateStatusFilter,
    onCandidateSearchChange,
    onCandidateStatusFilterChange,
    onPageChange,
    candidateForm,
    creatingCandidate,
    onCandidateChange,
    onCreateCandidate,
}) {
    return (
        <div className="dashboard-panel-grid dashboard-panel-grid-sidebar">
            <CandidateInviteForm
                candidateForm={candidateForm}
                creatingCandidate={creatingCandidate}
                onCandidateChange={onCandidateChange}
                onCreateCandidate={onCreateCandidate}
            />

            <CandidateTable
                candidates={candidates}
                totalItems={filteredCount}
                page={page}
                pageSize={pageSize}
                candidateSearch={candidateSearch}
                candidateStatusFilter={candidateStatusFilter}
                onCandidateSearchChange={onCandidateSearchChange}
                onCandidateStatusFilterChange={onCandidateStatusFilterChange}
                onPageChange={onPageChange}
            />
        </div>
    );
}

export { ManageCandidatesPanel };
export default ManageCandidatesPanel;
