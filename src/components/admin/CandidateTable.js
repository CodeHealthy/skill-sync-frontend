import EmptyTableRow from "../common/EmptyTableRow";
import Pagination from "../common/Pagination";
import SectionHeader from "../common/SectionHeader";
import StatusBadge from "../common/StatusBadge";

function CandidateTable({
    candidates,
    totalItems,
    page,
    pageSize,
    candidateSearch,
    candidateStatusFilter,
    onCandidateSearchChange,
    onCandidateStatusFilterChange,
    onPageChange,
}) {
    return (
        <section className="list-card">
            <SectionHeader
                title="Candidates"
                subtitle="Candidates invited or linked to this organization."
            />

            <div className="table-toolbar">
                <input
                    value={candidateSearch}
                    onChange={(event) => onCandidateSearchChange(event.target.value)}
                    placeholder="Search by name or email"
                />

                <select
                    value={candidateStatusFilter}
                    onChange={(event) => onCandidateStatusFilterChange(event.target.value)}
                >
                    <option value="ALL">All statuses</option>
                    <option value="INVITED">Invited</option>
                    <option value="REGISTERED">Registered</option>
                </select>
            </div>

            <div className="table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Status</th>
                            <th>Candidate ID</th>
                        </tr>
                    </thead>
                    <tbody>
                        {candidates.map((candidate) => (
                            <tr key={candidate.id}>
                                <td data-label="Name">{candidate.name}</td>
                                <td data-label="Email">{candidate.email}</td>
                                <td data-label="Status">
                                    <StatusBadge value={candidate.status || "INVITED"} />
                                </td>
                                <td data-label="Candidate ID" className="muted-cell">
                                    {candidate.id}
                                </td>
                            </tr>
                        ))}

                        {candidates.length === 0 && (
                            <EmptyTableRow colSpan={4} message="No candidates found." />
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

export default CandidateTable;
