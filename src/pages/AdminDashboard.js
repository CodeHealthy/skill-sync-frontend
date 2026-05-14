import { useEffect, useMemo, useState } from "react";
import axiosClient from "../api/axiosClient";
import { useAuth } from "../auth/AuthContext";

const PAGE_SIZE = 8;

function AdminDashboard() {
    const { user } = useAuth();

    const [candidateForm, setCandidateForm] = useState({
        name: "",
        email: "",
    });

    const [assessmentForm, setAssessmentForm] = useState({
        title: "",
        description: "",
        type: "CODING_CHALLENGE",
        language: "JAVA",
        maxScore: 100,
        prompt: "",
        starterCode:
            'public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello SkillSync");\n  }\n}',
        expectedOutput: "Hello SkillSync",
    });

    const [assignForm, setAssignForm] = useState({
        candidateId: "",
        assessmentId: "",
    });

    const [gradeForms, setGradeForms] = useState({});

    const [candidates, setCandidates] = useState([]);
    const [assessments, setAssessments] = useState([]);
    const [assignments, setAssignments] = useState([]);

    const [candidateSearch, setCandidateSearch] = useState("");
    const [candidateStatusFilter, setCandidateStatusFilter] = useState("ALL");
    const [candidatePage, setCandidatePage] = useState(1);

    const [assessmentSearch, setAssessmentSearch] = useState("");
    const [assessmentTypeFilter, setAssessmentTypeFilter] = useState("ALL");
    const [assessmentLanguageFilter, setAssessmentLanguageFilter] = useState("ALL");
    const [assessmentPage, setAssessmentPage] = useState(1);

    const [assignmentSearch, setAssignmentSearch] = useState("");
    const [assignmentStatusFilter, setAssignmentStatusFilter] = useState("ALL");
    const [assignmentExecutionFilter, setAssignmentExecutionFilter] = useState("ALL");
    const [assignmentLanguageFilter, setAssignmentLanguageFilter] = useState("ALL");
    const [assignmentPage, setAssignmentPage] = useState(1);
    const [expandedAssignmentId, setExpandedAssignmentId] = useState(null);

    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const [loadingDashboard, setLoadingDashboard] = useState(false);
    const [creatingCandidate, setCreatingCandidate] = useState(false);
    const [creatingAssessment, setCreatingAssessment] = useState(false);
    const [assigningAssessment, setAssigningAssessment] = useState(false);
    const [gradingAssignmentId, setGradingAssignmentId] = useState(null);
    const [executingAssignmentId, setExecutingAssignmentId] = useState(null);

    const fetchDashboardData = async () => {
        setError("");
        setLoadingDashboard(true);

        try {
            const [candidateResponse, assessmentResponse, assignmentResponse] =
                await Promise.all([
                    axiosClient.get("/candidates"),
                    axiosClient.get("/assessments"),
                    axiosClient.get("/assessments/assignments"),
                ]);

            setCandidates(candidateResponse.data);
            setAssessments(assessmentResponse.data);
            setAssignments(assignmentResponse.data);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.response?.data?.error ||
                "Failed to load dashboard data"
            );
        } finally {
            setLoadingDashboard(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    useEffect(() => {
        setCandidatePage(1);
    }, [candidateSearch, candidateStatusFilter]);

    useEffect(() => {
        setAssessmentPage(1);
    }, [assessmentSearch, assessmentTypeFilter, assessmentLanguageFilter]);

    useEffect(() => {
        setAssignmentPage(1);
    }, [
        assignmentSearch,
        assignmentStatusFilter,
        assignmentExecutionFilter,
        assignmentLanguageFilter,
    ]);

    const dashboardStats = useMemo(() => {
        return {
            totalCandidates: candidates.length,
            totalAssessments: assessments.length,
            pendingSubmissions: assignments.filter(
                (assignment) => assignment.status === "SUBMITTED"
            ).length,
            gradedSubmissions: assignments.filter(
                (assignment) => assignment.status === "GRADED"
            ).length,
        };
    }, [candidates, assessments, assignments]);

    const filteredCandidates = useMemo(() => {
        const search = candidateSearch.trim().toLowerCase();

        return candidates.filter((candidate) => {
            const candidateStatus = candidate.status || "INVITED";

            const matchesSearch =
                !search ||
                candidate.name?.toLowerCase().includes(search) ||
                candidate.email?.toLowerCase().includes(search);

            const matchesStatus =
                candidateStatusFilter === "ALL" ||
                candidateStatus === candidateStatusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [candidates, candidateSearch, candidateStatusFilter]);

    const filteredAssessments = useMemo(() => {
        const search = assessmentSearch.trim().toLowerCase();

        return assessments.filter((assessment) => {
            const matchesSearch =
                !search ||
                assessment.title?.toLowerCase().includes(search) ||
                assessment.description?.toLowerCase().includes(search) ||
                assessment.prompt?.toLowerCase().includes(search);

            const matchesType =
                assessmentTypeFilter === "ALL" ||
                assessment.type === assessmentTypeFilter;

            const matchesLanguage =
                assessmentLanguageFilter === "ALL" ||
                assessment.language === assessmentLanguageFilter;

            return matchesSearch && matchesType && matchesLanguage;
        });
    }, [
        assessments,
        assessmentSearch,
        assessmentTypeFilter,
        assessmentLanguageFilter,
    ]);

    const filteredAssignments = useMemo(() => {
        const search = assignmentSearch.trim().toLowerCase();

        return assignments.filter((assignment) => {
            const executionStatus = assignment.executionStatus || "NOT_RUN";

            const matchesSearch =
                !search ||
                assignment.candidateName?.toLowerCase().includes(search) ||
                assignment.candidateEmail?.toLowerCase().includes(search) ||
                assignment.assessmentTitle?.toLowerCase().includes(search);

            const matchesStatus =
                assignmentStatusFilter === "ALL" ||
                assignment.status === assignmentStatusFilter;

            const matchesExecution =
                assignmentExecutionFilter === "ALL" ||
                executionStatus === assignmentExecutionFilter;

            const matchesLanguage =
                assignmentLanguageFilter === "ALL" ||
                assignment.language === assignmentLanguageFilter;

            return (
                matchesSearch &&
                matchesStatus &&
                matchesExecution &&
                matchesLanguage
            );
        });
    }, [
        assignments,
        assignmentSearch,
        assignmentStatusFilter,
        assignmentExecutionFilter,
        assignmentLanguageFilter,
    ]);

    const paginatedCandidates = paginate(filteredCandidates, candidatePage);
    const paginatedAssessments = paginate(filteredAssessments, assessmentPage);
    const paginatedAssignments = paginate(filteredAssignments, assignmentPage);

    const handleCandidateChange = (event) => {
        setCandidateForm((current) => ({
            ...current,
            [event.target.name]: event.target.value,
        }));
    };

    const handleAssessmentChange = (event) => {
        const { name, value } = event.target;

        setAssessmentForm((current) => {
            const updated = {
                ...current,
                [name]: value,
            };

            if (name === "type" && value === "QUIZ") {
                updated.language = "TEXT";
                updated.starterCode = "";
                updated.expectedOutput = "";
            }

            if (name === "type" && value === "CODING_CHALLENGE") {
                updated.language = current.language === "TEXT" ? "JAVA" : current.language;
            }

            if (name === "language") {
                updated.starterCode = getDefaultStarterCode(value);
            }

            return updated;
        });
    };

    const handleAssignChange = (event) => {
        setAssignForm((current) => ({
            ...current,
            [event.target.name]: event.target.value,
        }));
    };

    const handleGradeChange = (assignmentId, field, value) => {
        setGradeForms((current) => ({
            ...current,
            [assignmentId]: {
                ...current[assignmentId],
                [field]: value,
            },
        }));
    };

    const handleCreateCandidate = async (event) => {
        event.preventDefault();

        if (creatingCandidate) {
            return;
        }

        setError("");
        setSuccessMessage("");
        setCreatingCandidate(true);

        try {
            await axiosClient.post("/candidates", candidateForm);

            setCandidateForm({
                name: "",
                email: "",
            });

            setSuccessMessage("Candidate invited successfully.");
            await fetchDashboardData();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.response?.data?.error ||
                "Failed to create candidate"
            );
        } finally {
            setCreatingCandidate(false);
        }
    };

    const handleCreateAssessment = async (event) => {
        event.preventDefault();

        if (creatingAssessment) {
            return;
        }

        setError("");
        setSuccessMessage("");
        setCreatingAssessment(true);

        try {
            await axiosClient.post("/assessments", {
                ...assessmentForm,
                maxScore: Number(assessmentForm.maxScore),
            });

            setAssessmentForm({
                title: "",
                description: "",
                type: "CODING_CHALLENGE",
                language: "JAVA",
                maxScore: 100,
                prompt: "",
                starterCode: getDefaultStarterCode("JAVA"),
                expectedOutput: "Hello SkillSync",
            });

            setSuccessMessage("Assessment created successfully.");
            await fetchDashboardData();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.response?.data?.error ||
                "Failed to create assessment"
            );
        } finally {
            setCreatingAssessment(false);
        }
    };

    const handleAssignAssessment = async (event) => {
        event.preventDefault();

        if (assigningAssessment) {
            return;
        }

        setError("");
        setSuccessMessage("");
        setAssigningAssessment(true);

        try {
            await axiosClient.post("/assessments/assign", assignForm);

            setAssignForm({
                candidateId: "",
                assessmentId: "",
            });

            setSuccessMessage("Assessment assigned successfully.");
            await fetchDashboardData();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.response?.data?.error ||
                "Failed to assign assessment"
            );
        } finally {
            setAssigningAssessment(false);
        }
    };

    const handleGradeAssignment = async (assignmentId) => {
        if (gradingAssignmentId) {
            return;
        }

        setError("");
        setSuccessMessage("");

        const gradeForm = gradeForms[assignmentId];

        if (!gradeForm || gradeForm.score === undefined || gradeForm.score === "") {
            setError("Score is required before grading.");
            return;
        }

        setGradingAssignmentId(assignmentId);

        try {
            await axiosClient.patch(`/assessments/assignments/${assignmentId}/grade`, {
                score: Number(gradeForm.score),
                feedback: gradeForm.feedback || "",
            });

            setSuccessMessage("Assignment graded successfully.");

            setGradeForms((current) => ({
                ...current,
                [assignmentId]: {
                    score: "",
                    feedback: "",
                },
            }));

            await fetchDashboardData();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.response?.data?.error ||
                "Failed to grade assignment"
            );
        } finally {
            setGradingAssignmentId(null);
        }
    };
    const handleExecuteAssignment = async (assignmentId) => {
        if (executingAssignmentId) {
            return;
        }

        setError("");
        setSuccessMessage("");
        setExecutingAssignmentId(assignmentId);

        try {
            await axiosClient.post(`/assessments/assignments/${assignmentId}/execute`);

            setSuccessMessage("Code executed and automatically graded.");
            await fetchDashboardData();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.response?.data?.error ||
                "Failed to execute code"
            );
        } finally {
            setExecutingAssignmentId(null);
        }
    };

    return (
        <div className="page-container admin-page">
            <div className="dashboard-header">
                <div>
                    <p className="eyebrow">Organization Workspace</p>
                    <h1>Admin Dashboard</h1>
                    <p>Welcome, {user?.fullName}. Manage candidates, assessments, and results.</p>
                </div>

                <button
                    className="secondary-button"
                    onClick={fetchDashboardData}
                    disabled={loadingDashboard}
                >
                    {loadingDashboard ? "Refreshing..." : "Refresh"}
                </button>
            </div>

            {error && <div className="error-box">{error}</div>}
            {successMessage && <div className="success-box">{successMessage}</div>}
            {loadingDashboard && (
                <div className="info-box">
                    Loading latest dashboard data...
                </div>
            )}

            <div className="summary-grid">
                <MetricCard label="Candidates" value={dashboardStats.totalCandidates} />
                <MetricCard label="Assessments" value={dashboardStats.totalAssessments} />
                <MetricCard label="Pending Review" value={dashboardStats.pendingSubmissions} />
                <MetricCard label="Graded" value={dashboardStats.gradedSubmissions} />
            </div>

            <div className="admin-grid">
                <div className="form-card compact-form-card">
                    <h2>Invite Candidate</h2>

                    <form onSubmit={handleCreateCandidate}>
                        <label>Candidate Name</label>
                        <input
                            name="name"
                            value={candidateForm.name}
                            onChange={handleCandidateChange}
                            required
                        />

                        <label>Candidate Email</label>
                        <input
                            name="email"
                            type="email"
                            value={candidateForm.email}
                            onChange={handleCandidateChange}
                            required
                        />

                        <button className="primary-button" type="submit" disabled={creatingCandidate}>
                            {creatingCandidate ? "Inviting..." : "Invite Candidate"}
                        </button>
                    </form>
                </div>

                <div className="form-card compact-form-card">
                    <h2>Create Assessment</h2>

                    <form onSubmit={handleCreateAssessment}>
                        <label>Title</label>
                        <input
                            name="title"
                            value={assessmentForm.title}
                            onChange={handleAssessmentChange}
                            required
                        />

                        <label>Description</label>
                        <input
                            name="description"
                            value={assessmentForm.description}
                            onChange={handleAssessmentChange}
                        />

                        <div className="two-column-form">
                            <div>
                                <label>Type</label>
                                <select
                                    name="type"
                                    value={assessmentForm.type}
                                    onChange={handleAssessmentChange}
                                >
                                    <option value="CODING_CHALLENGE">Coding Challenge</option>
                                    <option value="QUIZ">Quiz</option>
                                </select>
                            </div>

                            {assessmentForm.type === "CODING_CHALLENGE" && (
                                <div>
                                    <label>Language</label>
                                    <select
                                        name="language"
                                        value={assessmentForm.language}
                                        onChange={handleAssessmentChange}
                                    >
                                        <option value="JAVA">Java</option>
                                        <option value="JAVASCRIPT">JavaScript</option>
                                        <option value="PYTHON">Python</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        <label>Max Score</label>
                        <input
                            name="maxScore"
                            type="number"
                            value={assessmentForm.maxScore}
                            onChange={handleAssessmentChange}
                            min="1"
                            required
                        />

                        <label>Prompt</label>
                        <textarea
                            name="prompt"
                            rows="4"
                            value={assessmentForm.prompt}
                            onChange={handleAssessmentChange}
                            required
                        />

                        {assessmentForm.type === "CODING_CHALLENGE" && (
                            <>
                                <label>Starter Code</label>
                                <textarea
                                    name="starterCode"
                                    rows="5"
                                    className="code-textarea"
                                    value={assessmentForm.starterCode}
                                    onChange={handleAssessmentChange}
                                />

                                <label>Expected Output</label>
                                <textarea
                                    name="expectedOutput"
                                    rows="2"
                                    value={assessmentForm.expectedOutput}
                                    onChange={handleAssessmentChange}
                                />
                            </>
                        )}

                        <button className="primary-button" type="submit" disabled={creatingAssessment}>
                            {creatingAssessment ? "Creating..." : "Create Assessment"}
                        </button>
                    </form>
                </div>

                <div className="form-card compact-form-card">
                    <h2>Assign Assessment</h2>

                    <form onSubmit={handleAssignAssessment}>
                        <label>Candidate</label>
                        <select
                            name="candidateId"
                            value={assignForm.candidateId}
                            onChange={handleAssignChange}
                            required
                        >
                            <option value="">Select candidate</option>
                            {candidates.map((candidate) => (
                                <option value={candidate.id} key={candidate.id}>
                                    {candidate.name} - {candidate.email}
                                </option>
                            ))}
                        </select>

                        <label>Assessment</label>
                        <select
                            name="assessmentId"
                            value={assignForm.assessmentId}
                            onChange={handleAssignChange}
                            required
                        >
                            <option value="">Select assessment</option>
                            {assessments.map((assessment) => (
                                <option value={assessment.id} key={assessment.id}>
                                    {assessment.title} ({assessment.type})
                                </option>
                            ))}
                        </select>

                        <button className="primary-button" type="submit" disabled={assigningAssessment}>
                            {assigningAssessment ? "Assigning..." : "Assign Assessment"}
                        </button>
                    </form>
                </div>
            </div>

            <div className="dashboard-sections">
                <section className="list-card">
                    <SectionHeader
                        title="Candidates"
                        subtitle="Candidates invited or linked to this organization."
                    />

                    <div className="table-toolbar">
                        <input
                            value={candidateSearch}
                            onChange={(event) => setCandidateSearch(event.target.value)}
                            placeholder="Search by name or email"
                        />

                        <select
                            value={candidateStatusFilter}
                            onChange={(event) => setCandidateStatusFilter(event.target.value)}
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
                                {paginatedCandidates.map((candidate) => (
                                    <tr key={candidate.id}>
                                        <td>{candidate.name}</td>
                                        <td>{candidate.email}</td>
                                        <td>
                                            <StatusBadge value={candidate.status || "INVITED"} />
                                        </td>
                                        <td className="muted-cell">{candidate.id}</td>
                                    </tr>
                                ))}

                                {paginatedCandidates.length === 0 && (
                                    <EmptyTableRow colSpan={4} message="No candidates found." />
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination
                        page={candidatePage}
                        totalItems={filteredCandidates.length}
                        onPageChange={setCandidatePage}
                    />
                </section>

                <section className="list-card">
                    <SectionHeader
                        title="Assessments"
                        subtitle="Assessment templates available for your organization."
                    />

                    <div className="table-toolbar">
                        <input
                            value={assessmentSearch}
                            onChange={(event) => setAssessmentSearch(event.target.value)}
                            placeholder="Search assessments"
                        />

                        <select
                            value={assessmentTypeFilter}
                            onChange={(event) => setAssessmentTypeFilter(event.target.value)}
                        >
                            <option value="ALL">All types</option>
                            <option value="CODING_CHALLENGE">Coding Challenge</option>
                            <option value="QUIZ">Quiz</option>
                        </select>

                        <select
                            value={assessmentLanguageFilter}
                            onChange={(event) => setAssessmentLanguageFilter(event.target.value)}
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
                                    <th>Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedAssessments.map((assessment) => (
                                    <tr key={assessment.id}>
                                        <td>{assessment.title}</td>
                                        <td>
                                            <StatusBadge value={assessment.type} />
                                        </td>
                                        <td>{formatLanguage(assessment.language)}</td>
                                        <td>{assessment.maxScore}</td>
                                        <td className="muted-cell">
                                            {assessment.description || "No description"}
                                        </td>
                                    </tr>
                                ))}

                                {paginatedAssessments.length === 0 && (
                                    <EmptyTableRow colSpan={5} message="No assessments found." />
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination
                        page={assessmentPage}
                        totalItems={filteredAssessments.length}
                        onPageChange={setAssessmentPage}
                    />
                </section>

                <section className="list-card">
                    <SectionHeader
                        title="Assignment Results"
                        subtitle="Review submissions, execute coding challenges, and grade results."
                    />

                    <div className="table-toolbar assignment-toolbar">
                        <input
                            value={assignmentSearch}
                            onChange={(event) => setAssignmentSearch(event.target.value)}
                            placeholder="Search candidate, email, or assessment"
                        />

                        <select
                            value={assignmentStatusFilter}
                            onChange={(event) => setAssignmentStatusFilter(event.target.value)}
                        >
                            <option value="ALL">All statuses</option>
                            <option value="ASSIGNED">Assigned</option>
                            <option value="SUBMITTED">Submitted</option>
                            <option value="GRADED">Graded</option>
                        </select>

                        <select
                            value={assignmentExecutionFilter}
                            onChange={(event) => setAssignmentExecutionFilter(event.target.value)}
                        >
                            <option value="ALL">All execution statuses</option>
                            <option value="NOT_RUN">Not executed</option>
                            <option value="PASSED">Passed</option>
                            <option value="FAILED">Failed</option>
                            <option value="ERROR">Error</option>
                            <option value="TIMEOUT">Timeout</option>
                        </select>

                        <select
                            value={assignmentLanguageFilter}
                            onChange={(event) => setAssignmentLanguageFilter(event.target.value)}
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
                                    <th>Score</th>
                                    <th>Submitted</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedAssignments.map((assignment) => (
                                    <tr key={assignment.id}>
                                        <td>
                                            <div className="primary-cell">{assignment.candidateName}</div>
                                            <div className="muted-cell">{assignment.candidateEmail}</div>
                                        </td>
                                        <td>
                                            <div className="primary-cell">{assignment.assessmentTitle}</div>
                                            <div className="muted-cell">{assignment.assessmentType}</div>
                                        </td>
                                        <td>{formatLanguage(assignment.language)}</td>
                                        <td>
                                            <StatusBadge value={assignment.status} />
                                        </td>
                                        <td>
                                            <StatusBadge value={assignment.executionStatus || "NOT_RUN"} />
                                        </td>
                                        <td>{assignment.score ?? "—"}</td>
                                        <td>{formatDate(assignment.submittedAt)}</td>
                                        <td>
                                            <div className="table-actions">
                                                {assignment.status === "SUBMITTED" &&
                                                    assignment.assessmentType === "CODING_CHALLENGE" && (
                                                        <button
                                                            className="primary-button small-button"
                                                            onClick={() => handleExecuteAssignment(assignment.id)}
                                                            disabled={executingAssignmentId === assignment.id || Boolean(executingAssignmentId)}
                                                        >
                                                            {executingAssignmentId === assignment.id ? "Running..." : "Run"}
                                                        </button>
                                                    )}

                                                <button
                                                    className="secondary-button small-button"
                                                    onClick={() =>
                                                        setExpandedAssignmentId((current) =>
                                                            current === assignment.id ? null : assignment.id
                                                        )
                                                    }
                                                >
                                                    {expandedAssignmentId === assignment.id
                                                        ? "Hide"
                                                        : "Details"}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {paginatedAssignments.length === 0 && (
                                    <EmptyTableRow colSpan={8} message="No assignment results found." />
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination
                        page={assignmentPage}
                        totalItems={filteredAssignments.length}
                        onPageChange={setAssignmentPage}
                    />

                    {expandedAssignmentId && (
                        <AssignmentDetails
                            assignment={assignments.find(
                                (assignment) => assignment.id === expandedAssignmentId
                            )}
                            gradeForms={gradeForms}
                            gradingAssignmentId={gradingAssignmentId}
                            onGradeChange={handleGradeChange}
                            onGradeAssignment={handleGradeAssignment}
                        />
                    )}
                </section>
            </div>
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

function SectionHeader({ title, subtitle }) {
    return (
        <div className="section-header">
            <div>
                <h2>{title}</h2>
                <p>{subtitle}</p>
            </div>
        </div>
    );
}

function AssignmentDetails({
    assignment,
    gradeForms,
    gradingAssignmentId,
    onGradeChange,
    onGradeAssignment,
}) {
    if (!assignment) {
        return null;
    }

    return (
        <div className="detail-panel">
            <div className="detail-panel-header">
                <div>
                    <h3>{assignment.assessmentTitle}</h3>
                    <p>
                        {assignment.candidateName} · {assignment.candidateEmail}
                    </p>
                </div>

                <StatusBadge value={assignment.status} />
            </div>

            <div className="detail-grid">
                <DetailItem label="Type" value={assignment.assessmentType} />
                <DetailItem label="Language" value={formatLanguage(assignment.language)} />
                <DetailItem label="Execution Status" value={assignment.executionStatus || "NOT_RUN"} />
                <DetailItem label="Score" value={assignment.score ?? "Not graded"} />
                <DetailItem label="Assigned At" value={formatDate(assignment.assignedAt)} />
                <DetailItem label="Submitted At" value={formatDate(assignment.submittedAt)} />
            </div>

            <CodeBlock title="Prompt" value={assignment.prompt} />
            <CodeBlock title="Submitted Answer" value={assignment.submittedAnswer} />
            <CodeBlock title="Submitted Code" value={assignment.submittedCode} />
            <CodeBlock title="Expected Output" value={assignment.expectedOutput} />
            <CodeBlock title="Actual Output" value={assignment.actualOutput} />
            <CodeBlock title="Execution Error" value={assignment.executionError} />

            {assignment.status === "SUBMITTED" && (
                <div className="grade-box detail-grade-box">
                    <h4>Manual Grade</h4>

                    <div className="two-column-form">
                        <div>
                            <label>Score</label>
                            <input
                                type="number"
                                min="0"
                                value={gradeForms[assignment.id]?.score || ""}
                                onChange={(event) =>
                                    onGradeChange(assignment.id, "score", event.target.value)
                                }
                                placeholder="Enter score"
                            />
                        </div>

                        <div>
                            <label>Feedback</label>
                            <textarea
                                rows="3"
                                value={gradeForms[assignment.id]?.feedback || ""}
                                onChange={(event) =>
                                    onGradeChange(assignment.id, "feedback", event.target.value)
                                }
                                placeholder="Write feedback"
                            />
                        </div>
                    </div>

                    <button
                        className="primary-button"
                        onClick={() => onGradeAssignment(assignment.id)}
                        disabled={gradingAssignmentId === assignment.id || Boolean(gradingAssignmentId)}
                    >
                        {gradingAssignmentId === assignment.id ? "Saving Grade..." : "Save Grade"}
                    </button>
                </div>
            )}

            {assignment.status === "GRADED" && (
                <div className="graded-box">
                    <p>
                        <strong>Feedback:</strong>{" "}
                        {assignment.feedback || "No feedback provided"}
                    </p>
                </div>
            )}
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

function EmptyTableRow({ colSpan, message }) {
    return (
        <tr>
            <td colSpan={colSpan} className="empty-table-cell">
                {message}
            </td>
        </tr>
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

function paginate(items, page) {
    return items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
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

function getDefaultStarterCode(language) {
    if (language === "JAVA") {
        return 'public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello SkillSync");\n  }\n}';
    }

    if (language === "JAVASCRIPT") {
        return 'console.log("Hello SkillSync");';
    }

    if (language === "PYTHON") {
        return 'print("Hello SkillSync")';
    }

    return "";
}

export default AdminDashboard;