function CandidateFilters({
    searchTerm,
    organizationFilter,
    statusFilter,
    executionFilter,
    languageFilter,
    organizations,
    onSearchTermChange,
    onOrganizationFilterChange,
    onStatusFilterChange,
    onExecutionFilterChange,
    onLanguageFilterChange,
}) {
    return (
        <div className="candidate-filter-grid">
            <input
                value={searchTerm}
                onChange={(event) => onSearchTermChange(event.target.value)}
                placeholder="Search assessment or organization"
            />

            <select
                value={organizationFilter}
                onChange={(event) => onOrganizationFilterChange(event.target.value)}
            >
                <option value="ALL">All organizations</option>
                {organizations.map((organization) => (
                    <option value={organization} key={organization}>
                        {organization}
                    </option>
                ))}
            </select>

            <select
                value={statusFilter}
                onChange={(event) => onStatusFilterChange(event.target.value)}
            >
                <option value="ALL">All statuses</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="GRADED">Graded</option>
            </select>

            <select
                value={executionFilter}
                onChange={(event) => onExecutionFilterChange(event.target.value)}
            >
                <option value="ALL">All execution</option>
                <option value="NOT_RUN">Not executed</option>
                <option value="PENDING_EXECUTION">Pending execution</option>
                <option value="PASSED">Passed</option>
                <option value="FAILED">Failed</option>
                <option value="ERROR">Error</option>
                <option value="TIMEOUT">Timeout</option>
            </select>

            <select
                value={languageFilter}
                onChange={(event) => onLanguageFilterChange(event.target.value)}
            >
                <option value="ALL">All languages</option>
                <option value="JAVA">Java</option>
                <option value="JAVASCRIPT">JavaScript</option>
                <option value="PYTHON">Python</option>
                <option value="TEXT">Text</option>
            </select>
        </div>
    );
}

export default CandidateFilters;