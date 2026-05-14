import { useEffect, useMemo, useState } from "react";
import axiosClient from "../api/axiosClient";
import { useAuth } from "../auth/AuthContext";

const PAGE_SIZE = 6;

function CandidateDashboard() {
    const { user } = useAuth();

    const [assignments, setAssignments] = useState([]);
    const [answers, setAnswers] = useState({});
    const [codes, setCodes] = useState({});
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const [loadingAssignments, setLoadingAssignments] = useState(false);
    const [submittingAssignmentId, setSubmittingAssignmentId] = useState(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [organizationFilter, setOrganizationFilter] = useState("ALL");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [executionFilter, setExecutionFilter] = useState("ALL");
    const [languageFilter, setLanguageFilter] = useState("ALL");
    const [page, setPage] = useState(1);
    const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);

    const fetchAssignments = async () => {
        setError("");
        setLoadingAssignments(true);

        try {
            const response = await axiosClient.get("/assessments/my-assignments");
            setAssignments(response.data);

            const initialCodes = {};
            response.data.forEach((assignment) => {
                if (
                    assignment.assessmentType === "CODING_CHALLENGE" &&
                    assignment.status === "ASSIGNED"
                ) {
                    initialCodes[assignment.id] = assignment.starterCode || "";
                }
            });

            setCodes((current) => ({
                ...initialCodes,
                ...current,
            }));
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.response?.data?.error ||
                "Failed to load assignments"
            );
        } finally {
            setLoadingAssignments(false);
        }
    };

    useEffect(() => {
        fetchAssignments();
    }, []);

    useEffect(() => {
        setPage(1);
    }, [searchTerm, organizationFilter, statusFilter, executionFilter, languageFilter]);

    const organizations = useMemo(() => {
        const names = assignments
            .map((assignment) => assignment.organizationName || "Organization")
            .filter(Boolean);

        return Array.from(new Set(names)).sort();
    }, [assignments]);

    const stats = useMemo(() => {
        return {
            total: assignments.length,
            pending: assignments.filter((assignment) => assignment.status === "ASSIGNED").length,
            submitted: assignments.filter((assignment) => assignment.status === "SUBMITTED").length,
            graded: assignments.filter((assignment) => assignment.status === "GRADED").length,
        };
    }, [assignments]);

    const filteredAssignments = useMemo(() => {
        const search = searchTerm.trim().toLowerCase();

        return assignments.filter((assignment) => {
            const organizationName = assignment.organizationName || "Organization";
            const executionStatus = assignment.executionStatus || "NOT_RUN";

            const matchesSearch =
                !search ||
                assignment.assessmentTitle?.toLowerCase().includes(search) ||
                assignment.prompt?.toLowerCase().includes(search) ||
                organizationName.toLowerCase().includes(search);

            const matchesOrganization =
                organizationFilter === "ALL" || organizationName === organizationFilter;

            const matchesStatus =
                statusFilter === "ALL" || assignment.status === statusFilter;

            const matchesExecution =
                executionFilter === "ALL" || executionStatus === executionFilter;

            const matchesLanguage =
                languageFilter === "ALL" || assignment.language === languageFilter;

            return (
                matchesSearch &&
                matchesOrganization &&
                matchesStatus &&
                matchesExecution &&
                matchesLanguage
            );
        });
    }, [
        assignments,
        searchTerm,
        organizationFilter,
        statusFilter,
        executionFilter,
        languageFilter,
    ]);

    const selectedAssignment = useMemo(() => {
        if (selectedAssignmentId) {
            return assignments.find((assignment) => assignment.id === selectedAssignmentId);
        }

        return filteredAssignments[0] || null;
    }, [assignments, filteredAssignments, selectedAssignmentId]);

    const paginatedAssignments = filteredAssignments.slice(
        (page - 1) * PAGE_SIZE,
        page * PAGE_SIZE
    );

    const handleAnswerChange = (assignmentId, value) => {
        setAnswers((current) => ({
            ...current,
            [assignmentId]: value,
        }));
    };

    const handleCodeChange = (assignmentId, value) => {
        setCodes((current) => ({
            ...current,
            [assignmentId]: value,
        }));
    };

    const handleSubmit = async (assignment) => {
        if (submittingAssignmentId) {
            return;
        }

        setError("");
        setSuccessMessage("");

        const isCodingChallenge = assignment.assessmentType === "CODING_CHALLENGE";

        const payload = isCodingChallenge
            ? {
                submittedCode: codes[assignment.id],
            }
            : {
                submittedAnswer: answers[assignment.id],
            };

        if (isCodingChallenge && (!payload.submittedCode || !payload.submittedCode.trim())) {
            setError("Please enter your code before submitting.");
            return;
        }

        if (!isCodingChallenge && (!payload.submittedAnswer || !payload.submittedAnswer.trim())) {
            setError("Please enter your answer before submitting.");
            return;
        }

        setSubmittingAssignmentId(assignment.id);

        try {
            await axiosClient.post(
                `/assessments/assignments/${assignment.id}/submit`,
                payload
            );

            setSuccessMessage("Assessment submitted successfully.");

            setAnswers((current) => ({
                ...current,
                [assignment.id]: "",
            }));

            setCodes((current) => ({
                ...current,
                [assignment.id]: "",
            }));

            await fetchAssignments();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.response?.data?.error ||
                "Failed to submit assessment"
            );
        } finally {
            setSubmittingAssignmentId(null);
        }
    };

    return (
        <div className="page-container candidate-page">
            <div className="dashboard-header">
                <div>
                    <p className="eyebrow">Candidate Workspace</p>
                    <h1>Candidate Portal</h1>
                    <p>
                        Welcome, {user?.fullName}. Review assessments from organizations
                        that invited you.
                    </p>
                </div>

                <button
                    className="secondary-button"
                    onClick={fetchAssignments}
                    disabled={loadingAssignments}
                >
                    {loadingAssignments ? "Refreshing..." : "Refresh"}
                </button>
            </div>

            {error && <div className="error-box">{error}</div>}
            {successMessage && <div className="success-box">{successMessage}</div>}

            {loadingAssignments && (
                <div className="info-box">
                    Loading latest assignments...
                </div>
            )}

            <div className="summary-grid">
                <MetricCard label="Total Assessments" value={stats.total} />
                <MetricCard label="Pending" value={stats.pending} />
                <MetricCard label="Submitted" value={stats.submitted} />
                <MetricCard label="Graded" value={stats.graded} />
            </div>

            <div className="candidate-workspace-grid">
                <section className="list-card">
                    <div className="section-header">
                        <div>
                            <h2>My Assessments</h2>
                            <p>Filter, review, and open assigned assessments.</p>
                        </div>
                    </div>

                    <div className="candidate-filter-grid">
                        <input
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="Search assessment or organization"
                        />

                        <select
                            value={organizationFilter}
                            onChange={(event) => setOrganizationFilter(event.target.value)}
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
                            onChange={(event) => setStatusFilter(event.target.value)}
                        >
                            <option value="ALL">All statuses</option>
                            <option value="ASSIGNED">Assigned</option>
                            <option value="SUBMITTED">Submitted</option>
                            <option value="GRADED">Graded</option>
                        </select>

                        <select
                            value={executionFilter}
                            onChange={(event) => setExecutionFilter(event.target.value)}
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
                            onChange={(event) => setLanguageFilter(event.target.value)}
                        >
                            <option value="ALL">All languages</option>
                            <option value="JAVA">Java</option>
                            <option value="JAVASCRIPT">JavaScript</option>
                            <option value="PYTHON">Python</option>
                            <option value="TEXT">Text</option>
                        </select>
                    </div>

                    {!loadingAssignments && assignments.length === 0 && (
                        <div className="empty-state">
                            <h3>No assessments yet</h3>
                            <p>
                                Once an organization assigns you an assessment, it will appear here.
                            </p>
                        </div>
                    )}

                    {assignments.length > 0 && paginatedAssignments.length === 0 && (
                        <div className="empty-state">
                            <h3>No matching assessments</h3>
                            <p>Try changing your filters or search term.</p>
                        </div>
                    )}

                    <div className="assessment-list">
                        {paginatedAssignments.map((assignment) => (
                            <button
                                type="button"
                                className={`assessment-list-item ${selectedAssignment?.id === assignment.id ? "active" : ""
                                    }`}
                                key={assignment.id}
                                onClick={() => setSelectedAssignmentId(assignment.id)}
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
                        totalItems={filteredAssignments.length}
                        onPageChange={setPage}
                    />
                </section>

                <section className="list-card assessment-detail-card">
                    {!selectedAssignment && (
                        <div className="empty-state">
                            <h3>Select an assessment</h3>
                            <p>Choose an assessment from the list to view details.</p>
                        </div>
                    )}

                    {selectedAssignment && (
                        <AssignmentDetail
                            assignment={selectedAssignment}
                            code={codes[selectedAssignment.id] || ""}
                            answer={answers[selectedAssignment.id] || ""}
                            submittingAssignmentId={submittingAssignmentId}
                            onCodeChange={handleCodeChange}
                            onAnswerChange={handleAnswerChange}
                            onSubmit={handleSubmit}
                        />
                    )}
                </section>
            </div>
        </div>
    );
}

function AssignmentDetail({
    assignment,
    code,
    answer,
    submittingAssignmentId,
    onCodeChange,
    onAnswerChange,
    onSubmit,
}) {
    const isCodingChallenge = assignment.assessmentType === "CODING_CHALLENGE";
    const isAssigned = assignment.status === "ASSIGNED";
    const isSubmitting = submittingAssignmentId === assignment.id;
    const isAnySubmitting = Boolean(submittingAssignmentId);

    return (
        <div>
            <div className="detail-panel-header candidate-detail-header">
                <div>
                    <p className="eyebrow">{assignment.organizationName || "Organization"}</p>
                    <h2>{assignment.assessmentTitle}</h2>
                    <p>{assignment.prompt}</p>
                </div>

                <div className="detail-status-stack">
                    <StatusBadge value={assignment.status} />
                    <StatusBadge value={assignment.executionStatus || "NOT_RUN"} />
                </div>
            </div>

            <div className="detail-grid">
                <DetailItem label="Organization" value={assignment.organizationName || "Organization"} />
                <DetailItem label="Type" value={formatAssessmentType(assignment.assessmentType)} />
                <DetailItem label="Language" value={formatLanguage(assignment.language)} />
                <DetailItem label="Assigned At" value={formatDate(assignment.assignedAt)} />
                <DetailItem label="Submitted At" value={formatDate(assignment.submittedAt)} />
                <DetailItem label="Score" value={assignment.score ?? "Not graded"} />
            </div>

            <CodeBlock title="Expected Output" value={assignment.expectedOutput} />

            {isAssigned && isCodingChallenge && (
                <div className="submission-panel">
                    <label>Your Code</label>
                    <textarea
                        rows="16"
                        className="code-textarea"
                        value={code}
                        onChange={(event) => onCodeChange(assignment.id, event.target.value)}
                        placeholder="Write your code here"
                        disabled={isAnySubmitting}
                    />

                    <button
                        className="primary-button"
                        onClick={() => onSubmit(assignment)}
                        disabled={isAnySubmitting}
                    >
                        {isSubmitting ? "Submitting..." : "Submit Code"}
                    </button>
                </div>
            )}

            {isAssigned && !isCodingChallenge && (
                <div className="submission-panel">
                    <label>Your Answer</label>
                    <textarea
                        rows="10"
                        value={answer}
                        onChange={(event) => onAnswerChange(assignment.id, event.target.value)}
                        placeholder="Write your answer here"
                        disabled={isAnySubmitting}
                    />

                    <button
                        className="primary-button"
                        onClick={() => onSubmit(assignment)}
                        disabled={isAnySubmitting}
                    >
                        {isSubmitting ? "Submitting..." : "Submit Answer"}
                    </button>
                </div>
            )}

            {!isAssigned && (
                <>
                    <CodeBlock title="Your Submission" value={assignment.submittedAnswer} />
                    <CodeBlock title="Your Code" value={assignment.submittedCode} />
                    <CodeBlock title="Actual Output" value={assignment.actualOutput} />
                    <CodeBlock title="Execution Error" value={assignment.executionError} />
                </>
            )}

            {assignment.status === "SUBMITTED" && (
                <div className="pending-grade-box">
                    <strong>Submitted for review</strong>
                    <p>Your submission is waiting for admin review or automated execution.</p>
                </div>
            )}

            {assignment.status === "GRADED" && (
                <div className="graded-box">
                    <h4>Result</h4>
                    <p>
                        <strong>Score:</strong> {assignment.score}
                    </p>
                    <p>
                        <strong>Feedback:</strong>{" "}
                        {assignment.feedback || "No feedback provided"}
                    </p>
                </div>
            )}
        </div>
    );
}

function MetricCard({ label, value }) {
    return (
        <div className="metric-card">
            <span>{label}</span>
            <strong>{value}</strong>
        </div>
    );
}

function DetailItem({ label, value }) {
    return (
        <div className="detail-item">
            <span>{label}</span>
            <strong>{value || "—"}</strong>
        </div>
    );
}

function CodeBlock({ title, value }) {
    if (!value) {
        return null;
    }

    return (
        <div className="code-block">
            <p>
                <strong>{title}</strong>
            </p>
            <pre>{value}</pre>
        </div>
    );
}

function StatusBadge({ value }) {
    const normalizedValue = value || "UNKNOWN";

    return (
        <span className={`status-badge status-${normalizedValue.toLowerCase()}`}>
            {normalizedValue.replaceAll("_", " ")}
        </span>
    );
}

function Pagination({ page, totalItems, onPageChange }) {
    const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

    return (
        <div className="pagination-row">
            <span>
                Page {page} of {totalPages} · {totalItems} result
                {totalItems === 1 ? "" : "s"}
            </span>

            <div className="pagination-actions">
                <button
                    className="secondary-button small-button"
                    disabled={page <= 1}
                    onClick={() => onPageChange(page - 1)}
                >
                    Previous
                </button>

                <button
                    className="secondary-button small-button"
                    disabled={page >= totalPages}
                    onClick={() => onPageChange(page + 1)}
                >
                    Next
                </button>
            </div>
        </div>
    );
}

function formatDate(value) {
    if (!value) {
        return "—";
    }

    return new Date(value).toLocaleString();
}

function formatLanguage(language) {
    if (!language) {
        return "—";
    }

    if (language === "JAVASCRIPT") {
        return "JavaScript";
    }

    if (language === "PYTHON") {
        return "Python";
    }

    if (language === "JAVA") {
        return "Java";
    }

    if (language === "TEXT") {
        return "Text";
    }

    return language;
}

function formatAssessmentType(type) {
    if (!type) {
        return "—";
    }

    if (type === "CODING_CHALLENGE") {
        return "Coding Challenge";
    }

    if (type === "QUIZ") {
        return "Quiz";
    }

    return type;
}

export default CandidateDashboard;