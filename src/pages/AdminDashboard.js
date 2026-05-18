import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { assessmentApi } from "../api/assessmentApi";
import { candidateApi } from "../api/candidateApi";
import AdminStats from "../components/admin/AdminStats";
import AssessmentAssignForm from "../components/admin/AssessmentAssignForm";
import AssessmentCreateForm from "../components/admin/AssessmentCreateForm";
import AssessmentDetailsTable from "../components/admin/AssessmentDetailsTable";
import AssignmentDetailsPanel from "../components/admin/AssignmentDetailsPanel";
import AssignmentResultsTable from "../components/admin/AssignmentResultsTable";
import CandidateInviteForm from "../components/admin/CandidateInviteForm";
import CandidateTable from "../components/admin/CandidateTable";
import ConfirmModal from "../components/common/ConfirmModal";
import { ADMIN_PAGE_SIZE } from "../constants/pagination";
import { getDefaultStarterCode } from "../constants/starterCode";
import { getApiErrorMessage } from "../utils/errorUtils";
import { paginate } from "../utils/paginationUtils";
import { showError, showSuccess, showWarning } from "../utils/toastUtils";

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
        starterCode: getDefaultStarterCode("JAVA"),
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

    const [loadingDashboard, setLoadingDashboard] = useState(false);
    const [creatingCandidate, setCreatingCandidate] = useState(false);
    const [creatingAssessment, setCreatingAssessment] = useState(false);
    const [assigningAssessment, setAssigningAssessment] = useState(false);
    const [gradingAssignmentId, setGradingAssignmentId] = useState(null);
    const [executingAssignmentId, setExecutingAssignmentId] = useState(null);
    const [confirmAction, setConfirmAction] = useState(null);

    const fetchDashboardData = async () => {
        setLoadingDashboard(true);

        try {
            const [candidateResponse, assessmentResponse, assignmentResponse] =
                await Promise.all([
                    candidateApi.getCandidates(),
                    assessmentApi.getAssessments(),
                    assessmentApi.getAssignments(),
                ]);

            setCandidates(candidateResponse.data);
            setAssessments(assessmentResponse.data);
            setAssignments(assignmentResponse.data);
        } catch (err) {
            showError(getApiErrorMessage(err, "Failed to load dashboard data"));
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

    const paginatedCandidates = paginate(
        filteredCandidates,
        candidatePage,
        ADMIN_PAGE_SIZE
    );

    const paginatedAssessments = paginate(
        filteredAssessments,
        assessmentPage,
        ADMIN_PAGE_SIZE
    );

    const paginatedAssignments = paginate(
        filteredAssignments,
        assignmentPage,
        ADMIN_PAGE_SIZE
    );

    const expandedAssignment = assignments.find(
        (assignment) => assignment.id === expandedAssignmentId
    );

    const confirmLoading =
        assigningAssessment ||
        Boolean(gradingAssignmentId) ||
        Boolean(executingAssignmentId);

    const closeConfirmModal = () => {
        if (!confirmLoading) {
            setConfirmAction(null);
        }
    };

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
                updated.language =
                    current.language === "TEXT" ? "JAVA" : current.language;
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

        setCreatingCandidate(true);

        try {
            await candidateApi.createCandidate(candidateForm);

            setCandidateForm({
                name: "",
                email: "",
            });

            showSuccess("Candidate invited successfully.");
            await fetchDashboardData();
        } catch (err) {
            showError(getApiErrorMessage(err, "Failed to create candidate"));
        } finally {
            setCreatingCandidate(false);
        }
    };

    const handleCreateAssessment = async (event) => {
        event.preventDefault();

        if (creatingAssessment) {
            return;
        }

        setCreatingAssessment(true);

        try {
            await assessmentApi.createAssessment({
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

            showSuccess("Assessment created successfully.");
            await fetchDashboardData();
        } catch (err) {
            showError(getApiErrorMessage(err, "Failed to create assessment"));
        } finally {
            setCreatingAssessment(false);
        }
    };

    const handleAssignAssessment = async () => {
        if (assigningAssessment) {
            return;
        }

        setAssigningAssessment(true);

        try {
            await assessmentApi.assignAssessment(assignForm);

            setAssignForm({
                candidateId: "",
                assessmentId: "",
            });

            setConfirmAction(null);
            showSuccess("Assessment assigned successfully.");
            await fetchDashboardData();
        } catch (err) {
            showError(getApiErrorMessage(err, "Failed to assign assessment"));
        } finally {
            setAssigningAssessment(false);
        }
    };

    const requestAssignAssessment = (event) => {
        event.preventDefault();

        const selectedCandidate = candidates.find(
            (candidate) => candidate.id === assignForm.candidateId
        );

        const selectedAssessment = assessments.find(
            (assessment) => assessment.id === assignForm.assessmentId
        );

        setConfirmAction({
            title: "Assign assessment?",
            message: `Assign "${selectedAssessment?.title || "this assessment"}" to ${selectedCandidate?.name || "this candidate"
                }?`,
            confirmText: "Assign Assessment",
            onConfirm: handleAssignAssessment,
        });
    };

    const handleGradeAssignment = async (assignmentId) => {
        if (gradingAssignmentId) {
            return;
        }

        const gradeForm = gradeForms[assignmentId];

        if (!gradeForm || gradeForm.score === undefined || gradeForm.score === "") {
            showWarning("Score is required before grading.");
            return;
        }

        setGradingAssignmentId(assignmentId);

        try {
            await assessmentApi.gradeAssignment(assignmentId, {
                score: Number(gradeForm.score),
                feedback: gradeForm.feedback || "",
            });

            showSuccess("Assignment graded successfully.");
            setConfirmAction(null);

            setGradeForms((current) => ({
                ...current,
                [assignmentId]: {
                    score: "",
                    feedback: "",
                },
            }));

            await fetchDashboardData();
        } catch (err) {
            showError(getApiErrorMessage(err, "Failed to grade assignment"));
        } finally {
            setGradingAssignmentId(null);
        }
    };

    const requestGradeAssignment = (assignmentId) => {
        const gradeForm = gradeForms[assignmentId];

        if (!gradeForm || gradeForm.score === undefined || gradeForm.score === "") {
            showWarning("Score is required before grading.");
            return;
        }

        const assignment = assignments.find((item) => item.id === assignmentId);

        setConfirmAction({
            title: "Save manual grade?",
            message: `Save score ${gradeForm.score} for ${assignment?.candidateName || "this candidate"
                } on "${assignment?.assessmentTitle || "this assessment"}"?`,
            confirmText: "Save Grade",
            onConfirm: () => handleGradeAssignment(assignmentId),
        });
    };

    const handleExecuteAssignment = async (assignmentId) => {
        if (executingAssignmentId) {
            return;
        }

        setExecutingAssignmentId(assignmentId);

        try {
            await assessmentApi.executeAssignment(assignmentId);

            showSuccess("Code executed and automatically graded.");
            setConfirmAction(null);
            await fetchDashboardData();
        } catch (err) {
            showError(getApiErrorMessage(err, "Failed to execute code"));
        } finally {
            setExecutingAssignmentId(null);
        }
    };

    const requestExecuteAssignment = (assignmentId) => {
        const assignment = assignments.find((item) => item.id === assignmentId);

        setConfirmAction({
            title: "Run Docker grading?",
            message: `Execute and auto-grade "${assignment?.assessmentTitle || "this coding challenge"
                }" for ${assignment?.candidateName || "this candidate"}?`,
            confirmText: "Run Grading",
            onConfirm: () => handleExecuteAssignment(assignmentId),
        });
    };

    const handleToggleAssignmentDetails = (assignmentId) => {
        setExpandedAssignmentId((current) =>
            current === assignmentId ? null : assignmentId
        );
    };

    return (
        <div className="page-container admin-page">
            <div className="dashboard-header">
                <div>
                    <p className="eyebrow">Organization Workspace</p>
                    <h1>Admin Dashboard</h1>
                    <p>
                        Welcome, {user?.fullName}. Manage candidates, assessments,
                        and results.
                    </p>
                </div>

                <button
                    className="secondary-button"
                    onClick={fetchDashboardData}
                    disabled={loadingDashboard}
                >
                    {loadingDashboard ? "Refreshing..." : "Refresh"}
                </button>
            </div>

            {loadingDashboard && (
                <div className="info-box">
                    Loading latest dashboard data...
                </div>
            )}

            <AdminStats stats={dashboardStats} />

            <div className="admin-grid">
                <CandidateInviteForm
                    candidateForm={candidateForm}
                    creatingCandidate={creatingCandidate}
                    onCandidateChange={handleCandidateChange}
                    onCreateCandidate={handleCreateCandidate}
                />

                <AssessmentCreateForm
                    assessmentForm={assessmentForm}
                    creatingAssessment={creatingAssessment}
                    onAssessmentChange={handleAssessmentChange}
                    onCreateAssessment={handleCreateAssessment}
                />

                <AssessmentAssignForm
                    candidates={candidates}
                    assessments={assessments}
                    assignForm={assignForm}
                    assigningAssessment={assigningAssessment}
                    onAssignChange={handleAssignChange}
                    onAssignAssessment={requestAssignAssessment}
                />
            </div>

            <div className="dashboard-sections">
                <CandidateTable
                    candidates={paginatedCandidates}
                    totalItems={filteredCandidates.length}
                    page={candidatePage}
                    pageSize={ADMIN_PAGE_SIZE}
                    candidateSearch={candidateSearch}
                    candidateStatusFilter={candidateStatusFilter}
                    onCandidateSearchChange={setCandidateSearch}
                    onCandidateStatusFilterChange={setCandidateStatusFilter}
                    onPageChange={setCandidatePage}
                />

                <AssessmentDetailsTable
                    assessments={paginatedAssessments}
                    totalItems={filteredAssessments.length}
                    page={assessmentPage}
                    pageSize={ADMIN_PAGE_SIZE}
                    assessmentSearch={assessmentSearch}
                    assessmentTypeFilter={assessmentTypeFilter}
                    assessmentLanguageFilter={assessmentLanguageFilter}
                    onAssessmentSearchChange={setAssessmentSearch}
                    onAssessmentTypeFilterChange={setAssessmentTypeFilter}
                    onAssessmentLanguageFilterChange={setAssessmentLanguageFilter}
                    onPageChange={setAssessmentPage}
                />

                <AssignmentResultsTable
                    assignments={paginatedAssignments}
                    totalItems={filteredAssignments.length}
                    page={assignmentPage}
                    pageSize={ADMIN_PAGE_SIZE}
                    assignmentSearch={assignmentSearch}
                    assignmentStatusFilter={assignmentStatusFilter}
                    assignmentExecutionFilter={assignmentExecutionFilter}
                    assignmentLanguageFilter={assignmentLanguageFilter}
                    expandedAssignmentId={expandedAssignmentId}
                    executingAssignmentId={executingAssignmentId}
                    onAssignmentSearchChange={setAssignmentSearch}
                    onAssignmentStatusFilterChange={setAssignmentStatusFilter}
                    onAssignmentExecutionFilterChange={setAssignmentExecutionFilter}
                    onAssignmentLanguageFilterChange={setAssignmentLanguageFilter}
                    onPageChange={setAssignmentPage}
                    onToggleDetails={handleToggleAssignmentDetails}
                    onExecuteAssignment={requestExecuteAssignment}
                />

                {expandedAssignmentId && (
                    <AssignmentDetailsPanel
                        assignment={expandedAssignment}
                        gradeForms={gradeForms}
                        gradingAssignmentId={gradingAssignmentId}
                        onGradeChange={handleGradeChange}
                        onGradeAssignment={requestGradeAssignment}
                    />
                )}
            </div>

            <ConfirmModal
                open={Boolean(confirmAction)}
                title={confirmAction?.title}
                message={confirmAction?.message}
                confirmText={confirmAction?.confirmText}
                danger={confirmAction?.danger}
                loading={confirmLoading}
                onCancel={closeConfirmModal}
                onConfirm={confirmAction?.onConfirm}
            />
        </div>
    );
}

export default AdminDashboard;