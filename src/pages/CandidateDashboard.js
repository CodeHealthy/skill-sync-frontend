import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { assessmentApi } from "../api/assessmentApi";
import CandidateStats from "../components/candidate/CandidateStats";
import CandidateFilters from "../components/candidate/CandidateFilters";
import AssignmentList from "../components/candidate/AssignmentList";
import AssignmentDetail from "../components/candidate/AssignmentDetail";
import { CANDIDATE_PAGE_SIZE } from "../constants/pagination";
import { getApiErrorMessage } from "../utils/errorUtils";
import { paginate } from "../utils/paginationUtils";
import { showError, showSuccess, showWarning } from "../utils/toastUtils";

function CandidateDashboard() {
    const { user } = useAuth();

    const [assignments, setAssignments] = useState([]);
    const [answers, setAnswers] = useState({});
    const [codes, setCodes] = useState({});

    const [loadingAssignments, setLoadingAssignments] = useState(false);
    const [submittingAssignmentId, setSubmittingAssignmentId] = useState(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [organizationFilter, setOrganizationFilter] = useState("ALL");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [executionFilter, setExecutionFilter] = useState("ALL");
    const [languageFilter, setLanguageFilter] = useState("ALL");
    const [page, setPage] = useState(1);
    const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);

    const [runningAssignmentId, setRunningAssignmentId] = useState(null);
    const [runResults, setRunResults] = useState({});

    const fetchAssignments = async () => {
        setLoadingAssignments(true);

        try {
            const response = await assessmentApi.getMyAssignments();
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
            showError(getApiErrorMessage(err, "Failed to load assignments"));
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

    const paginatedAssignments = paginate(
        filteredAssignments,
        page,
        CANDIDATE_PAGE_SIZE
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

        const isCodingChallenge = assignment.assessmentType === "CODING_CHALLENGE";

        const payload = isCodingChallenge
            ? { submittedCode: codes[assignment.id] }
            : { submittedAnswer: answers[assignment.id] };

        if (isCodingChallenge && (!payload.submittedCode || !payload.submittedCode.trim())) {
            showWarning("Please enter your code before submitting.");
            return;
        }

        if (!isCodingChallenge && (!payload.submittedAnswer || !payload.submittedAnswer.trim())) {
            showWarning("Please enter your answer before submitting.");
            return;
        }

        setSubmittingAssignmentId(assignment.id);

        try {
            await assessmentApi.submitAssignment(assignment.id, payload);

            showSuccess("Assessment submitted successfully.");

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
            showError(getApiErrorMessage(err, "Failed to submit assessment"));
        } finally {
            setSubmittingAssignmentId(null);
        }
    };

    const handleRunCode = async (assignment) => {
        if (runningAssignmentId || submittingAssignmentId) {
            return;
        }

        const sourceCode = codes[assignment.id];

        if (!sourceCode || !sourceCode.trim()) {
            showWarning("Please enter your code before running.");
            return;
        }

        setRunningAssignmentId(assignment.id);

        try {
            const response = await assessmentApi.runAssignmentCode(assignment.id, {
                sourceCode,
            });

            const result = response.data;

            setRunResults((current) => ({
                ...current,
                [assignment.id]: result,
            }));

            if (result.timedOut) {
                showWarning("Code execution timed out. Check the Run Result panel.");
                return;
            }

            if (result.exitCode !== 0) {
                showWarning("Code ran with errors. Check the Run Result panel.");
                return;
            }

            showSuccess("Code executed successfully.");
        } catch (err) {
            showError(getApiErrorMessage(err, "Failed to run code"));
        } finally {
            setRunningAssignmentId(null);
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

            {loadingAssignments && (
                <div className="info-box">
                    Loading latest assignments...
                </div>
            )}

            <CandidateStats stats={stats} />

            <div className="candidate-workspace-grid">
                <section className="list-card">
                    <div className="section-header">
                        <div>
                            <h2>My Assessments</h2>
                            <p>Filter, review, and open assigned assessments.</p>
                        </div>
                    </div>

                    <CandidateFilters
                        searchTerm={searchTerm}
                        organizationFilter={organizationFilter}
                        statusFilter={statusFilter}
                        executionFilter={executionFilter}
                        languageFilter={languageFilter}
                        organizations={organizations}
                        onSearchTermChange={setSearchTerm}
                        onOrganizationFilterChange={setOrganizationFilter}
                        onStatusFilterChange={setStatusFilter}
                        onExecutionFilterChange={setExecutionFilter}
                        onLanguageFilterChange={setLanguageFilter}
                    />

                    <AssignmentList
                        assignments={assignments}
                        paginatedAssignments={paginatedAssignments}
                        filteredCount={filteredAssignments.length}
                        loadingAssignments={loadingAssignments}
                        selectedAssignment={selectedAssignment}
                        page={page}
                        pageSize={CANDIDATE_PAGE_SIZE}
                        onPageChange={setPage}
                        onSelectAssignment={setSelectedAssignmentId}
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
                            runningAssignmentId={runningAssignmentId}
                            runResult={runResults[selectedAssignment.id]}
                            onCodeChange={handleCodeChange}
                            onAnswerChange={handleAnswerChange}
                            onRunCode={handleRunCode}
                            onSubmit={handleSubmit}
                        />
                    )}
                </section>
            </div>
        </div>
    );
}

export default CandidateDashboard;