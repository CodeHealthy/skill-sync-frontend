import EmptyTableRow from "../common/EmptyTableRow";
import Pagination from "../common/Pagination";
import SectionHeader from "../common/SectionHeader";
import StatusBadge from "../common/StatusBadge";
import { formatLanguage } from "../../utils/formatters";

function AssessmentDetailsTable({
    assessments,
    totalItems,
    page,
    pageSize,
    assessmentSearch,
    assessmentTypeFilter,
    assessmentLanguageFilter,
    onAssessmentSearchChange,
    onAssessmentTypeFilterChange,
    onAssessmentLanguageFilterChange,
    onPageChange,
}) {
    return (
        <section className="list-card">
            <SectionHeader
                title="Assessments"
                subtitle="Assessment templates available for your organization."
            />

            <div className="table-toolbar">
                <input
                    value={assessmentSearch}
                    onChange={(event) => onAssessmentSearchChange(event.target.value)}
                    placeholder="Search assessments"
                />

                <select
                    value={assessmentTypeFilter}
                    onChange={(event) => onAssessmentTypeFilterChange(event.target.value)}
                >
                    <option value="ALL">All types</option>
                    <option value="CODING_CHALLENGE">Coding Challenge</option>
                    <option value="QUIZ">Quiz</option>
                </select>

                <select
                    value={assessmentLanguageFilter}
                    onChange={(event) => onAssessmentLanguageFilterChange(event.target.value)}
                >
                    <option value="ALL">All languages</option>
                    <option value="JAVA">Java</option>
                    <option value="JAVASCRIPT">JavaScript</option>
                    <option value="PYTHON">Python</option>
                    <option value="TEXT">Text</option>
                </select>
            </div>

            <div className="table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Type</th>
                            <th>Language</th>
                            <th>Max Score</th>
                            <th>Test Cases</th>
                            <th>Description</th>
                        </tr>
                    </thead>

                    <tbody>
                        {assessments.map((assessment) => {
                            const testCases = Array.isArray(assessment.testCases)
                                ? assessment.testCases
                                : [];

                            const visibleTestCases = testCases.filter(
                                (testCase) => !testCase.hidden
                            );

                            const hiddenTestCases = testCases.filter(
                                (testCase) => testCase.hidden
                            );

                            return (
                                <tr key={assessment.id}>
                                    <td data-label="Title">
                                        <div className="primary-cell">
                                            {assessment.title}
                                        </div>

                                        <div className="muted-cell">
                                            {assessment.prompt
                                                ? `${assessment.prompt.slice(0, 90)}${assessment.prompt.length > 90
                                                    ? "..."
                                                    : ""
                                                }`
                                                : "No prompt"}
                                        </div>
                                    </td>

                                    <td data-label="Type">
                                        <StatusBadge value={assessment.type} />
                                    </td>

                                    <td data-label="Language">
                                        {formatLanguage(assessment.language)}
                                    </td>

                                    <td data-label="Max Score">{assessment.maxScore}</td>

                                    <td data-label="Test Cases">
                                        {assessment.type === "CODING_CHALLENGE" ? (
                                            <div>
                                                <div className="primary-cell">
                                                    {testCases.length} total
                                                </div>
                                                <div className="muted-cell">
                                                    {visibleTestCases.length} visible /{" "}
                                                    {hiddenTestCases.length} hidden
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="muted-cell">Not applicable</span>
                                        )}
                                    </td>

                                    <td data-label="Description" className="muted-cell">
                                        {assessment.description || "No description"}
                                    </td>
                                </tr>
                            );
                        })}

                        {assessments.length === 0 && (
                            <EmptyTableRow colSpan={6} message="No assessments found." />
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

export default AssessmentDetailsTable;
