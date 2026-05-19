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
import AiAssessmentGeneratorModal from "../components/admin/AiAssessmentGeneratorModal";
import ConfirmModal from "../components/common/ConfirmModal";
import { ADMIN_PAGE_SIZE } from "../constants/pagination";
import { getDefaultStarterCode } from "../constants/starterCode";
import { getApiErrorMessage } from "../utils/errorUtils";
import { paginate } from "../utils/paginationUtils";
import { showError, showSuccess, showWarning } from "../utils/toastUtils";

const createDefaultTestCase = (index = 1, maxScore = 100) => ({
    name: index === 1 ? "Sample case" : `Test case ${index}`,
    input: "",
    expectedOutput: "",
    hidden: index !== 1,
    points: index === 1 ? maxScore : 0,
});

const createInitialAssessmentForm = () => ({
    title: "",
    description: "",
    type: "CODING_CHALLENGE",
    language: "JAVA",
    maxScore: 100,
    prompt: "",
    starterCode: getDefaultStarterCode("JAVA"),
    expectedOutput: "Hello SkillSync",
    testCases: [
        {
            name: "Sample case",
            input: "",
            expectedOutput: "Hello SkillSync",
            hidden: false,
            points: 100,
        },
    ],
});

const normalizeTestCasesForSubmit = (testCases) => {
    return (testCases || [])
        .filter((testCase) => testCase?.expectedOutput?.trim())
        .map((testCase, index) => ({
            name: testCase.name?.trim() || `Test case ${index + 1}`,
            input: testCase.input || "",
            expectedOutput: testCase.expectedOutput.trim(),
            hidden: Boolean(testCase.hidden),
            points: Number(testCase.points || 0),
        }));
};

function AdminDashboard() {
    const { user } = useAuth();

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
    const [aiModalOpen, setAiModalOpen] = useState(false);
    const [assessmentWizardOpen, setAssessmentWizardOpen] = useState(false);
    const [assessmentWizardStep, setAssessmentWizardStep] = useState(0);

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

    const detectLanguageFromStarterCode = (starterCode) => {
        const code = starterCode || "";

        if (
            code.includes("public class") ||
            code.includes("public static void main") ||
            code.includes("System.out")
        ) {
            return "JAVA";
        }

        if (
            code.includes("console.log") ||
            code.includes("function ") ||
            code.includes("const ") ||
            code.includes("let ")
        ) {
            return "JAVASCRIPT";
        }

        if (
            code.includes("def ") ||
            code.includes("print(") ||
            code.includes("input(")
        ) {
            return "PYTHON";
        }

        return null;
    };

    const handleAiAssessmentGenerated = (draft) => {
        const hasCodingFields =
            Boolean(draft?.starterCode?.trim()) ||
            Boolean(draft?.expectedOutput?.trim()) ||
            Boolean(draft?.testCases?.length);

        const nextType = hasCodingFields ? "CODING_CHALLENGE" : "QUIZ";
        const detectedLanguage = detectLanguageFromStarterCode(draft?.starterCode);

        const nextLanguage =
            nextType === "CODING_CHALLENGE"
                ? detectedLanguage ||
                (assessmentForm.language === "TEXT" ? "JAVA" : assessmentForm.language)
                : "TEXT";

        const descriptionParts = [];

        if (draft?.description?.trim()) {
            descriptionParts.push(draft.description.trim());
        }

        if (draft?.rubric?.trim()) {
            descriptionParts.push(`Rubric:\n${draft.rubric.trim()}`);
        }

        const aiTestCases = Array.isArray(draft?.testCases)
            ? draft.testCases.map((testCase, index) => ({
                name: testCase.name || `Test case ${index + 1}`,
                input: testCase.input || "",
                expectedOutput: testCase.expectedOutput || "",
                hidden: Boolean(testCase.hidden),
                points: Number(testCase.points || 0),
            }))
            : [];

        const fallbackTestCases =
            nextType === "CODING_CHALLENGE" && aiTestCases.length === 0
                ? [
                    {
                        name: "Sample case",
                        input: "",
                        expectedOutput: draft?.expectedOutput || "",
                        hidden: false,
                        points: draft?.maxScore || 100,
                    },
                ]
                : aiTestCases;

        setAssessmentForm({
            title: draft?.title || "",
            description: descriptionParts.join("\n\n"),
            type: nextType,
            language: nextLanguage,
            maxScore: draft?.maxScore || 100,
            prompt: draft?.prompt || "",
            starterCode:
                nextType === "CODING_CHALLENGE"
                    ? draft?.starterCode || getDefaultStarterCode(nextLanguage)
                    : "",
            expectedOutput:
                nextType === "CODING_CHALLENGE"
                    ? draft?.expectedOutput ||
                    fallbackTestCases.find((testCase) => !testCase.hidden)
                        ?.expectedOutput ||
                    ""
                    : "",
            testCases: nextType === "CODING_CHALLENGE" ? fallbackTestCases : [],
        });

        setAssessmentSearch("");
        setAssessmentTypeFilter("ALL");
        setAssessmentLanguageFilter("ALL");

        setAssessmentWizardStep(3);
        setAssessmentWizardOpen(true);
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

            if (name === "maxScore") {
                updated.maxScore = value;
            }

            if (name === "type" && value === "QUIZ") {
                updated.language = "TEXT";
                updated.starterCode = "";
                updated.expectedOutput = "";
                updated.testCases = [];
            }

            if (name === "type" && value === "CODING_CHALLENGE") {
                updated.language =
                    current.language === "TEXT" ? "JAVA" : current.language;

                if (!current.starterCode) {
                    updated.starterCode = getDefaultStarterCode(updated.language);
                }

                if (!current.expectedOutput) {
                    updated.expectedOutput = "Hello SkillSync";
                }

                if (!current.testCases || current.testCases.length === 0) {
                    updated.testCases = [
                        {
                            name: "Sample case",
                            input: "",
                            expectedOutput: updated.expectedOutput,
                            hidden: false,
                            points: Number(updated.maxScore || 100),
                        },
                    ];
                }
            }

            if (name === "language") {
                updated.starterCode = getDefaultStarterCode(value);
            }

            return updated;
        });
    };

    const handleAssessmentTestCaseChange = (index, field, value) => {
        setAssessmentForm((current) => {
            const testCases = [...(current.testCases || [])];

            testCases[index] = {
                ...testCases[index],
                [field]: field === "hidden" ? Boolean(value) : value,
            };

            return {
                ...current,
                testCases,
            };
        });
    };

    const handleAddAssessmentTestCase = () => {
        setAssessmentForm((current) => {
            const currentTestCases = current.testCases || [];
            const nextIndex = currentTestCases.length + 1;

            return {
                ...current,
                testCases: [
                    ...currentTestCases,
                    createDefaultTestCase(nextIndex, 0),
                ],
            };
        });
    };

    const handleRemoveAssessmentTestCase = (index) => {
        setAssessmentForm((current) => {
            const testCases = (current.testCases || []).filter(
                (_, itemIndex) => itemIndex !== index
            );

            return {
                ...current,
                testCases:
                    testCases.length > 0
                        ? testCases
                        : [
                            createDefaultTestCase(
                                1,
                                Number(current.maxScore || 100)
                            ),
                        ],
            };
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
            return false;
        }

        const payload = {
            ...assessmentForm,
            maxScore: Number(assessmentForm.maxScore),
            testCases:
                assessmentForm.type === "CODING_CHALLENGE"
                    ? normalizeTestCasesForSubmit(assessmentForm.testCases)
                    : [],
        };

        if (
            payload.type === "CODING_CHALLENGE" &&
            (!payload.testCases || payload.testCases.length === 0)
        ) {
            showWarning("Please add at least one test case with expected output.");
            return false;
        }

        if (payload.type === "CODING_CHALLENGE") {
            const totalPoints = payload.testCases.reduce(
                (total, testCase) => total + Number(testCase.points || 0),
                0
            );

            const hasVisibleCase = payload.testCases.some(
                (testCase) => !testCase.hidden
            );

            if (!hasVisibleCase) {
                showWarning("Please keep at least one visible sample test case.");
                return false;
            }

            if (totalPoints !== payload.maxScore) {
                showWarning("Test case points must add up to the max score.");
                return false;
            }
        }

        setCreatingAssessment(true);

        try {
            await assessmentApi.createAssessment(payload);

            setAssessmentForm(createInitialAssessmentForm());

            showSuccess("Assessment created successfully.");
            await fetchDashboardData();

            return true;
        } catch (err) {
            showError(getApiErrorMessage(err, "Failed to create assessment"));
            return false;
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

                <div className="dashboard-header-actions">
                    <button
                        type="button"
                        className="secondary-button"
                        onClick={fetchDashboardData}
                        disabled={loadingDashboard}
                    >
                        {loadingDashboard ? "Refreshing..." : "Refresh"}
                    </button>
                </div>
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
                    wizardOpen={assessmentWizardOpen}
                    wizardStep={assessmentWizardStep}
                    onWizardOpenChange={setAssessmentWizardOpen}
                    onWizardStepChange={setAssessmentWizardStep}
                    onGenerateWithAi={() => setAiModalOpen(true)}
                    onAssessmentChange={handleAssessmentChange}
                    onAssessmentTestCaseChange={handleAssessmentTestCaseChange}
                    onAddAssessmentTestCase={handleAddAssessmentTestCase}
                    onRemoveAssessmentTestCase={handleRemoveAssessmentTestCase}
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
        </div>
    );
}

export default AdminDashboard;