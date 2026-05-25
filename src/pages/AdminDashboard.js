import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { assessmentApi } from "../api/assessmentApi";
import { auditApi } from "../api/auditApi";
import { candidateApi } from "../api/candidateApi";
import { teamApi } from "../api/teamApi";
import DashboardLayout from "../components/layout/DashboardLayout";
import AdminOverviewPanel from "../components/admin/AdminOverviewPanel";
import ManageCandidatesPanel from "../components/admin/ManageCandidatesPanel";
import CreateAssessmentPanel from "../components/admin/CreateAssessmentPanel";
import ViewResultsPanel from "../components/admin/ViewResultsPanel";
import AdminProfilePanel from "../components/admin/AdminProfilePanel";
import BillingSettingsPanel from "../components/admin/BillingSettingsPanel";
import TeamSettingsPanel from "../components/admin/TeamSettingsPanel";
import AuditLogPanel from "../components/admin/AuditLogPanel";
import AiAssessmentGeneratorModal from "../components/admin/AiAssessmentGeneratorModal";
import ConfirmModal from "../components/common/ConfirmModal";
import UsageLimitBanner from "../components/billing/UsageLimitBanner";
import { useSubscription } from "../hooks/useSubscription";
import { ADMIN_PAGE_SIZE } from "../constants/pagination";
import { PLAN_FEATURES } from "../constants/plans";
import {
    ASSESSMENT_QUESTION_TYPES,
    ASSESSMENT_TYPES,
    createDefaultTestCase,
    createInitialAssessmentForm,
    getAssessmentMaxScore,
    getPrimaryQuestion,
    normalizeSectionsForSubmit,
    normalizeTestCasesForSubmit,
} from "../features/assessments/assessmentFormUtils";
import { normalizeAiDraftForBuilder } from "../features/assessments/aiDraftUtils";
import { buildGradePayload } from "../features/results/manualReviewUtils";
import { getApiErrorMessage, isAuthRedirectError } from "../utils/errorUtils";
import { paginate } from "../utils/paginationUtils";
import { showError, showSuccess } from "../utils/toastUtils";

function AdminDashboard() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState("overview");

    // ---- Forms ----
    const [candidateForm, setCandidateForm] = useState({
        name: "",
        email: "",
    });

    const [assessmentForm, setAssessmentForm] = useState(
        createInitialAssessmentForm
    );

    const [assignForm, setAssignForm] = useState({
        candidateId: "",
        assessmentId: "",
        dueAt: "",
        timeLimitMinutes: "",
    });

    const [teamInviteForm, setTeamInviteForm] = useState({
        fullName: "",
        email: "",
        role: "RECRUITER",
    });

    const [gradeForms, setGradeForms] = useState({});

    // ---- Data ----
    const [candidates, setCandidates] = useState([]);
    const [assessments, setAssessments] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [pendingTeamInvites, setPendingTeamInvites] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);

    // ---- Candidates Tab State ----
    const [candidateSearch, setCandidateSearch] = useState("");
    const [candidateStatusFilter, setCandidateStatusFilter] = useState("ALL");
    const [candidatePage, setCandidatePage] = useState(1);

    // ---- Assessments Tab State ----
    const [assessmentSearch, setAssessmentSearch] = useState("");
    const [assessmentTypeFilter, setAssessmentTypeFilter] = useState("ALL");
    const [assessmentLanguageFilter, setAssessmentLanguageFilter] = useState("ALL");
    const [assessmentPage, setAssessmentPage] = useState(1);

    // ---- Results Tab State ----
    const [assignmentSearch, setAssignmentSearch] = useState("");
    const [assignmentStatusFilter, setAssignmentStatusFilter] = useState("ALL");
    const [assignmentExecutionFilter, setAssignmentExecutionFilter] = useState("ALL");
    const [assignmentLanguageFilter, setAssignmentLanguageFilter] = useState("ALL");
    const [assignmentPage, setAssignmentPage] = useState(1);
    const [expandedAssignmentId, setExpandedAssignmentId] = useState(null);
    const [auditActionFilter, setAuditActionFilter] = useState("");

    // ---- Loading & Modal States ----
    const [loadingDashboard, setLoadingDashboard] = useState(false);
    const [creatingCandidate, setCreatingCandidate] = useState(false);
    const [creatingAssessment, setCreatingAssessment] = useState(false);
    const [assigningAssessment, setAssigningAssessment] = useState(false);
    const [loadingTeam, setLoadingTeam] = useState(false);
    const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);
    const [invitingTeamMember, setInvitingTeamMember] = useState(false);
    const [teamActionId, setTeamActionId] = useState(null);
    const [gradingAssignmentId, setGradingAssignmentId] = useState(null);
    const [executingAssignmentId, setExecutingAssignmentId] = useState(null);
    const [confirmAction, setConfirmAction] = useState(null);
    const [aiModalOpen, setAiModalOpen] = useState(false);
    const [assessmentWizardOpen, setAssessmentWizardOpen] = useState(false);
    const [assessmentWizardStep, setAssessmentWizardStep] = useState(0);

    // ---- Fetch Data ----

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
            if (isAuthRedirectError(err)) {
                return;
            }

            showError(getApiErrorMessage(err, "Failed to load dashboard data"));
        } finally {
            setLoadingDashboard(false);
        }
    };

    const fetchTeamMembers = async () => {
        setLoadingTeam(true);

        try {
            const [membersResponse, invitesResponse] = await Promise.all([
                teamApi.getTeamMembers(),
                teamApi.getPendingInvites(),
            ]);

            setTeamMembers(membersResponse.data || []);
            setPendingTeamInvites(invitesResponse.data || []);
        } catch (err) {
            if (isAuthRedirectError(err)) {
                return;
            }

            showError(getApiErrorMessage(err, "Failed to load team members"));
        } finally {
            setLoadingTeam(false);
        }
    };

    const fetchAuditLogs = useCallback(async (action = "") => {
        setLoadingAuditLogs(true);

        try {
            const response = await auditApi.getOrganizationLogs(
                action ? { action } : {}
            );

            setAuditLogs(response.data || []);
        } catch (err) {
            if (isAuthRedirectError(err)) {
                return;
            }

            showError(getApiErrorMessage(err, "Failed to load activity history"));
        } finally {
            setLoadingAuditLogs(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
        fetchTeamMembers();
    }, []);

    useEffect(() => {
        fetchAuditLogs(auditActionFilter);
    }, [auditActionFilter, fetchAuditLogs]);

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

    // ---- Computed Stats ----

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

    const subscriptionFallbackUsage = useMemo(
        () => ({
            [PLAN_FEATURES.ACTIVE_ASSESSMENTS]: assessments.length,
            [PLAN_FEATURES.CANDIDATE_INVITES]: candidates.length,
            [PLAN_FEATURES.TEAM_MEMBERS]: teamMembers.filter(
                (member) => member.active !== false
            ).length,
        }),
        [assessments.length, candidates.length, teamMembers]
    );

    const {
        subscription,
        plan,
        assessmentUsage,
        inviteUsage,
        teamUsage,
        canCreateAssessment,
        canInviteCandidate,
        canInviteTeamMember,
        canUseAiGeneration,
        loading: loadingSubscription,
        refreshSubscription,
    } = useSubscription(subscriptionFallbackUsage);

    // ---- Filter & Paginate ----

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
                assessment.type === assessmentTypeFilter ||
                (assessmentTypeFilter === "MCQ" && assessment.type === "QUIZ");

            const matchesLanguage =
                assessmentLanguageFilter === "ALL" ||
                assessment.language === assessmentLanguageFilter;

            return matchesSearch && matchesType && matchesLanguage;
        });
    }, [assessments, assessmentSearch, assessmentTypeFilter, assessmentLanguageFilter]);

    const filteredAssignments = useMemo(() => {
        const search = assignmentSearch.trim().toLowerCase();

        return assignments.filter((assignment) => {
            const matchesSearch =
                !search ||
                assignment.candidateName?.toLowerCase().includes(search) ||
                assignment.candidateEmail?.toLowerCase().includes(search) ||
                assignment.assessmentTitle?.toLowerCase().includes(search);

            const matchesStatus = matchesAssignmentStatusFilter(
                assignment,
                assignmentStatusFilter
            );

            const matchesExecution =
                assignmentExecutionFilter === "ALL" ||
                assignment.executionStatus === assignmentExecutionFilter;

            const matchesLanguage =
                assignmentLanguageFilter === "ALL" ||
                assignment.language === assignmentLanguageFilter;

            return matchesSearch && matchesStatus && matchesExecution && matchesLanguage;
        });
    }, [
        assignments,
        assignmentSearch,
        assignmentStatusFilter,
        assignmentExecutionFilter,
        assignmentLanguageFilter,
    ]);

    const paginatedCandidates = paginate(filteredCandidates, candidatePage, ADMIN_PAGE_SIZE);
    const paginatedAssessments = paginate(filteredAssessments, assessmentPage, ADMIN_PAGE_SIZE);
    const paginatedAssignments = paginate(filteredAssignments, assignmentPage, ADMIN_PAGE_SIZE);

    const expandedAssignment = assignments.find((item) => item.id === expandedAssignmentId);

    // ---- Event Handlers (same as before) ----

    const handleCandidateChange = (event) => {
        const { name, value } = event.target;
        setCandidateForm((current) => ({
            ...current,
            [name]: value,
        }));
    };

    const handleCreateCandidate = async (event) => {
        event.preventDefault();

        if (!canInviteCandidate) {
            showError("Your current plan has reached its monthly candidate invite limit.");
            return;
        }

        if (!candidateForm.name.trim() || !candidateForm.email.trim()) {
            showError("Please provide both name and email.");
            return;
        }

        setCreatingCandidate(true);

        try {
            await candidateApi.inviteCandidate({
                name: candidateForm.name,
                email: candidateForm.email,
            });

            showSuccess("Candidate invited successfully.");
            setCandidateForm({ name: "", email: "" });
            await fetchDashboardData();
        } catch (err) {
            showError(getApiErrorMessage(err, "Failed to invite candidate"));
        } finally {
            setCreatingCandidate(false);
        }
    };

    const handleAssessmentChange = (event) => {
        const { name, value } = event.target;
        setAssessmentForm((current) => ({
            ...current,
            [name]: value,
        }));
    };

    const handleAssessmentPatch = (patch) => {
        setAssessmentForm((current) => {
            if (typeof patch === "function") {
                return patch(current);
            }

            return {
                ...current,
                ...patch,
            };
        });
    };

    const handleAssessmentTestCaseChange = (index, field, value) => {
        setAssessmentForm((current) => {
            const updatedTestCases = [...current.testCases];
            updatedTestCases[index] = {
                ...updatedTestCases[index],
                [field]: value,
            };
            return {
                ...current,
                testCases: updatedTestCases,
            };
        });
    };

    const handleAddAssessmentTestCase = () => {
        setAssessmentForm((current) => ({
            ...current,
            testCases: [
                ...current.testCases,
                createDefaultTestCase(current.testCases.length + 1, current.maxScore),
            ],
        }));
    };

    const handleRemoveAssessmentTestCase = (index) => {
        setAssessmentForm((current) => ({
            ...current,
            testCases: current.testCases.filter((_, i) => i !== index),
        }));
    };

    const handleCreateAssessment = async (event) => {
        event.preventDefault();

        if (!canCreateAssessment) {
            showError("Your current plan has reached its active assessment limit.");
            return;
        }

        if (!assessmentForm.title.trim()) {
            showError("Please provide an assessment title.");
            return;
        }

        const primaryQuestion = getPrimaryQuestion(assessmentForm.sections);

        if (!primaryQuestion || !primaryQuestion.prompt?.trim()) {
            showError("Please provide an assessment prompt.");
            return;
        }

        if (
            primaryQuestion.type === ASSESSMENT_QUESTION_TYPES.CODING_CHALLENGE &&
            (!primaryQuestion.testCases || primaryQuestion.testCases.length === 0)
        ) {
            showError("Please add at least one test case for coding questions.");
            return;
        }

        setCreatingAssessment(true);

        try {
            const normalizedSections = normalizeSectionsForSubmit(assessmentForm.sections);
            const normalizedTestCases = primaryQuestion.type === ASSESSMENT_QUESTION_TYPES.CODING_CHALLENGE
                ? normalizeTestCasesForSubmit(primaryQuestion.testCases)
                : [];

            await assessmentApi.createAssessment({
                title: assessmentForm.title,
                description: assessmentForm.description,
                roleTitle: assessmentForm.roleTitle,
                status: assessmentForm.status,
                durationMinutes: assessmentForm.durationMinutes
                    ? Number(assessmentForm.durationMinutes)
                    : null,
                type: primaryQuestion.type === ASSESSMENT_QUESTION_TYPES.CODING_CHALLENGE
                    ? ASSESSMENT_TYPES.CODING_CHALLENGE
                    : ASSESSMENT_TYPES.MCQ,
                language: primaryQuestion.type === ASSESSMENT_QUESTION_TYPES.CODING_CHALLENGE
                    ? primaryQuestion.language
                    : "TEXT",
                maxScore: getAssessmentMaxScore(normalizedSections, assessmentForm.maxScore),
                prompt: primaryQuestion.prompt,
                starterCode: primaryQuestion.starterCode || "",
                expectedOutput: primaryQuestion.expectedOutput || "",
                testCases: normalizedTestCases,
                sections: normalizedSections,
            });

            showSuccess("Assessment created successfully.");
            setAssessmentForm(createInitialAssessmentForm());
            setAssessmentWizardOpen(false);
            setAssessmentWizardStep(0);
            await fetchDashboardData();
        } catch (err) {
            showError(getApiErrorMessage(err, "Failed to create assessment"));
        } finally {
            setCreatingAssessment(false);
        }
    };

    const handleAiAssessmentGenerated = (draft) => {
        setAssessmentForm({
            ...createInitialAssessmentForm(),
            ...normalizeAiDraftForBuilder(draft, assessmentForm),
        });
        setAssessmentWizardOpen(true);
        setAssessmentWizardStep(1);
    };

    const handleAssignChange = (event) => {
        const { name, value } = event.target;
        setAssignForm((current) => ({
            ...current,
            [name]: value,
        }));
    };

    const handleTeamInviteChange = (event) => {
        const { name, value } = event.target;

        setTeamInviteForm((current) => ({
            ...current,
            [name]: value,
        }));
    };

    const handleInviteTeamMember = async (event) => {
        event.preventDefault();

        if (!teamInviteForm.fullName.trim() || !teamInviteForm.email.trim()) {
            showError("Please provide both name and email.");
            return;
        }

        setInvitingTeamMember(true);

        try {
            const response = await teamApi.inviteTeamMember({
                fullName: teamInviteForm.fullName.trim(),
                email: teamInviteForm.email.trim().toLowerCase(),
                role: teamInviteForm.role || "RECRUITER",
            });

            showSuccess(response.data?.message || "Team invite sent.");
            setTeamInviteForm({ fullName: "", email: "", role: "RECRUITER" });
            await fetchTeamMembers();
        } catch (err) {
            if (isAuthRedirectError(err)) {
                return;
            }

            showError(getApiErrorMessage(err, "Failed to invite team member"));
        } finally {
            setInvitingTeamMember(false);
        }
    };

    const handleResendTeamInvite = async (inviteId) => {
        setTeamActionId(inviteId);

        try {
            const response = await teamApi.resendInvite(inviteId);
            showSuccess(response.data?.message || "Team invite resent.");
            await fetchTeamMembers();
        } catch (err) {
            if (isAuthRedirectError(err)) {
                return;
            }

            showError(getApiErrorMessage(err, "Failed to resend team invite"));
        } finally {
            setTeamActionId(null);
        }
    };

    const handleRevokeTeamInvite = async (inviteId) => {
        setTeamActionId(inviteId);

        try {
            const response = await teamApi.revokeInvite(inviteId);
            showSuccess(response.data?.message || "Team invite revoked.");
            await fetchTeamMembers();
        } catch (err) {
            if (isAuthRedirectError(err)) {
                return;
            }

            showError(getApiErrorMessage(err, "Failed to revoke team invite"));
        } finally {
            setTeamActionId(null);
        }
    };

    const handleDeactivateTeamMember = async (userId) => {
        setTeamActionId(userId);

        try {
            const response = await teamApi.deactivateMember(userId);
            showSuccess(response.data?.message || "Team member deactivated.");
            await fetchTeamMembers();
        } catch (err) {
            if (isAuthRedirectError(err)) {
                return;
            }

            showError(getApiErrorMessage(err, "Failed to deactivate team member"));
        } finally {
            setTeamActionId(null);
        }
    };

    const handleAssignAssessment = async (event) => {
        event?.preventDefault();

        if (!assignForm.candidateId || !assignForm.assessmentId) {
            showError("Please select both candidate and assessment.");
            return;
        }

        setAssigningAssessment(true);

        try {
            await assessmentApi.assignAssessment({
                candidateId: assignForm.candidateId,
                assessmentId: assignForm.assessmentId,
                dueAt: assignForm.dueAt
                    ? new Date(assignForm.dueAt).toISOString()
                    : null,
                timeLimitMinutes: assignForm.timeLimitMinutes
                    ? Number(assignForm.timeLimitMinutes)
                    : null,
            });

            showSuccess("Assessment assigned successfully.");
            setAssignForm({
                candidateId: "",
                assessmentId: "",
                dueAt: "",
                timeLimitMinutes: "",
            });
            setConfirmAction(null);
            await fetchDashboardData();
        } catch (err) {
            showError(getApiErrorMessage(err, "Failed to assign assessment"));
        } finally {
            setAssigningAssessment(false);
        }
    };

    const requestAssignAssessment = (event) => {
        event.preventDefault();

        if (!assignForm.candidateId || !assignForm.assessmentId) {
            showError("Please select both candidate and assessment.");
            return;
        }

        if (assignForm.dueAt && new Date(assignForm.dueAt) <= new Date()) {
            showError("Due date must be in the future.");
            return;
        }

        if (
            assignForm.timeLimitMinutes &&
            Number(assignForm.timeLimitMinutes) <= 0
        ) {
            showError("Time limit must be greater than zero.");
            return;
        }

        if (
            assignForm.timeLimitMinutes &&
            Number(assignForm.timeLimitMinutes) > 480
        ) {
            showError("Time limit cannot exceed 480 minutes.");
            return;
        }

        const candidate = candidates.find((c) => c.id === assignForm.candidateId);
        const assessment = assessments.find((a) => a.id === assignForm.assessmentId);

        setConfirmAction({
            title: "Assign assessment?",
            message: `Assign "${assessment?.title}" to ${candidate?.name}?`,
            confirmText: "Assign",
            onConfirm: handleAssignAssessment,
        });
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

    const handleGradeAssignment = async (assignmentId) => {
        const gradeForm = gradeForms[assignmentId];
        const assignment = assignments.find((item) => item.id === assignmentId);

        if (!assignment) {
            showError("Assignment not found.");
            return;
        }

        const gradePayload = buildGradePayload(assignment, gradeForm);
        if (Number.isNaN(gradePayload.score)) {
            showError("Please enter a score.");
            return;
        }

        setGradingAssignmentId(assignmentId);

        try {
            await assessmentApi.gradeAssignment(assignmentId, gradePayload);

            showSuccess("Grade saved successfully.");
            setGradeForms((current) => ({
                ...current,
                [assignmentId]: { score: "", feedback: "", questionReviews: [] },
            }));
            setConfirmAction(null);
            await fetchDashboardData();
        } catch (err) {
            showError(getApiErrorMessage(err, "Failed to save grade"));
        } finally {
            setGradingAssignmentId(null);
        }
    };

    const requestGradeAssignment = (assignmentId) => {
        const assignment = assignments.find((item) => item.id === assignmentId);

        setConfirmAction({
            title: "Save manual grade?",
            message: `Save grade for ${assignment?.candidateName || "this candidate"} on "${assignment?.assessmentTitle || "this assessment"
                }"?`,
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

    const closeConfirmModal = () => {
        setConfirmAction(null);
    };

    const confirmLoading = gradingAssignmentId || executingAssignmentId || assigningAssessment;

    // ---- Dashboard Tabs ----

    const dashboardTabs = [
        {
            id: "overview",
            label: "Overview",
            icon: "overview",
            content: (
                <div className="dashboard-panel-stack">
                    <div className="dashboard-panel-grid dashboard-panel-grid-equal">
                        <UsageLimitBanner
                            label="Active assessments"
                            usage={assessmentUsage}
                        />
                        <UsageLimitBanner
                            label="Candidate invites this month"
                            usage={inviteUsage}
                        />
                    </div>
                    <AdminOverviewPanel
                        stats={dashboardStats}
                        loadingDashboard={loadingDashboard}
                        onRefresh={fetchDashboardData}
                        assignments={assignments}
                        assessments={assessments}
                        candidates={candidates}
                    />
                </div>
            ),
        },
        {
            id: "candidates",
            label: "Manage Candidates",
            icon: "candidates",
            content: (
                <ManageCandidatesPanel
                    candidates={paginatedCandidates}
                    filteredCount={filteredCandidates.length}
                    page={candidatePage}
                    pageSize={ADMIN_PAGE_SIZE}
                    candidateSearch={candidateSearch}
                    candidateStatusFilter={candidateStatusFilter}
                    onCandidateSearchChange={setCandidateSearch}
                    onCandidateStatusFilterChange={setCandidateStatusFilter}
                    onPageChange={setCandidatePage}
                    candidateForm={candidateForm}
                    creatingCandidate={creatingCandidate}
                    canInviteCandidate={canInviteCandidate}
                    onCandidateChange={handleCandidateChange}
                    onCreateCandidate={handleCreateCandidate}
                />
            ),
        },
        {
            id: "create",
            label: "Create Assessment",
            icon: "assessment",
            content: (
                <CreateAssessmentPanel
                    assessmentForm={assessmentForm}
                    creatingAssessment={creatingAssessment}
                    canCreateAssessment={canCreateAssessment}
                    canUseAiGeneration={canUseAiGeneration}
                    wizardOpen={assessmentWizardOpen}
                    wizardStep={assessmentWizardStep}
                    assignForm={assignForm}
                    assigningAssessment={assigningAssessment}
                    candidates={candidates}
                    assessments={assessments}
                    tableAssessments={paginatedAssessments}
                    filteredAssessments={filteredAssessments}
                    assessmentPage={assessmentPage}
                    pageSize={ADMIN_PAGE_SIZE}
                    assessmentSearch={assessmentSearch}
                    assessmentTypeFilter={assessmentTypeFilter}
                    assessmentLanguageFilter={assessmentLanguageFilter}
                    onAssessmentSearchChange={setAssessmentSearch}
                    onAssessmentTypeFilterChange={setAssessmentTypeFilter}
                    onAssessmentLanguageFilterChange={setAssessmentLanguageFilter}
                    onAssessmentPageChange={setAssessmentPage}
                    onWizardOpenChange={setAssessmentWizardOpen}
                    onWizardStepChange={setAssessmentWizardStep}
                    onGenerateWithAi={() => setAiModalOpen(true)}
                    onAssessmentChange={handleAssessmentChange}
                    onAssessmentPatch={handleAssessmentPatch}
                    onAssessmentTestCaseChange={handleAssessmentTestCaseChange}
                    onAddAssessmentTestCase={handleAddAssessmentTestCase}
                    onRemoveAssessmentTestCase={handleRemoveAssessmentTestCase}
                    onCreateAssessment={handleCreateAssessment}
                    onAssignChange={handleAssignChange}
                    onAssignAssessment={requestAssignAssessment}
                />
            ),
        },
        {
            id: "results",
            label: "View Results",
            icon: "results",
            content: (
                <ViewResultsPanel
                    assignments={paginatedAssignments}
                    filteredCount={filteredAssignments.length}
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
                    expandedAssignment={expandedAssignment}
                    gradeForms={gradeForms}
                    gradingAssignmentId={gradingAssignmentId}
                    onGradeChange={handleGradeChange}
                    onGradeAssignment={requestGradeAssignment}
                />
            ),
        },
        {
            id: "billing",
            label: "Billing",
            icon: "billing",
            content: (
                <BillingSettingsPanel
                    plan={plan}
                    subscription={subscription}
                    assessmentUsage={assessmentUsage}
                    inviteUsage={inviteUsage}
                    teamUsage={teamUsage}
                    loading={loadingSubscription}
                    onRefresh={refreshSubscription}
                />
            ),
        },
        {
            id: "team",
            label: "Team",
            icon: "candidates",
            content: (
                <TeamSettingsPanel
                    teamMembers={teamMembers}
                    pendingInvites={pendingTeamInvites}
                    teamInviteForm={teamInviteForm}
                    currentUserId={user?.userId}
                    loadingTeam={loadingTeam}
                    invitingTeamMember={invitingTeamMember}
                    canInviteTeamMember={canInviteTeamMember}
                    teamActionId={teamActionId}
                    onTeamInviteChange={handleTeamInviteChange}
                    onInviteTeamMember={handleInviteTeamMember}
                    onResendInvite={handleResendTeamInvite}
                    onRevokeInvite={handleRevokeTeamInvite}
                    onDeactivateMember={handleDeactivateTeamMember}
                    onRefresh={fetchTeamMembers}
                />
            ),
        },
        {
            id: "activity",
            label: "Activity",
            icon: "results",
            content: (
                <AuditLogPanel
                    logs={auditLogs}
                    loading={loadingAuditLogs}
                    actionFilter={auditActionFilter}
                    onActionFilterChange={setAuditActionFilter}
                    onRefresh={() => fetchAuditLogs(auditActionFilter)}
                />
            ),
        },
        {
            id: "profile",
            label: "Profile",
            icon: "profile",
            content: (
                <AdminProfilePanel user={user} />
            ),
        },
    ];

    return (
        <>
            <DashboardLayout
                tabs={dashboardTabs}
                activeTabId={activeTab}
                onTabChange={setActiveTab}
                userRole="admin"
                userName={user?.fullName}
                userTitle="Organization Admin"
            />

            <AiAssessmentGeneratorModal
                isOpen={aiModalOpen}
                onClose={() => setAiModalOpen(false)}
                onGenerated={handleAiAssessmentGenerated}
            />

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
        </>
    );
}

function matchesAssignmentStatusFilter(assignment, filter) {
    if (filter === "ALL") {
        return true;
    }

    if (filter === "OVERDUE") {
        return isAssignmentOverdue(assignment);
    }

    if (filter === "EXPIRED") {
        return isAssignmentExpired(assignment);
    }

    if (filter === "AUTO_SUBMITTED") {
        return Boolean(assignment.autoSubmitted);
    }

    return assignment.status === filter;
}

function isAssignmentOverdue(assignment) {
    return assignment.status === "ASSIGNED" &&
        Boolean(assignment.dueAt) &&
        new Date(assignment.dueAt).getTime() < Date.now();
}

function isAssignmentExpired(assignment) {
    return assignment.status === "ASSIGNED" &&
        Boolean(assignment.expiresAt) &&
        new Date(assignment.expiresAt).getTime() < Date.now();
}

export default AdminDashboard;
