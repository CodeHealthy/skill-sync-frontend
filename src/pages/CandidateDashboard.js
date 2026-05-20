import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { assessmentApi } from "../api/assessmentApi";
import DashboardLayout from "../components/layout/DashboardLayout";
import CandidateOverviewPanel from "../components/candidate/CandidateOverviewPanel";
import MyAssignmentsPanel from "../components/candidate/MyAssignmentsPanel";
import CandidateResultsPanel from "../components/candidate/CandidateResultsPanel";
import CandidateProfilePanel from "../components/candidate/CandidateProfilePanel";
import { CANDIDATE_PAGE_SIZE } from "../constants/pagination";
import { getApiErrorMessage } from "../utils/errorUtils";
import { paginate } from "../utils/paginationUtils";
import { showError, showSuccess, showWarning } from "../utils/toastUtils";

// ====================================================
// CANDIDATE DASHBOARD COMPONENT
// ====================================================

function CandidateDashboard() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState("overview");

    // ---- Data ----
    const [assignments, setAssignments] = useState([]);
    const [answers, setAnswers] = useState({});
    const [codes, setCodes] = useState({});

    // ---- Loading States ----
    const [loadingAssignments, setLoadingAssignments] = useState(false);
    const [startingAssignmentId, setStartingAssignmentId] = useState(null);
    const [submittingAssignmentId, setSubmittingAssignmentId] = useState(null);
    const [runningAssignmentId, setRunningAssignmentId] = useState(null);

    // ---- Assignments Tab State ----
    const [searchTerm, setSearchTerm] = useState("");
    const [organizationFilter, setOrganizationFilter] = useState("ALL");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [executionFilter, setExecutionFilter] = useState("ALL");
    const [languageFilter, setLanguageFilter] = useState("ALL");
    const [page, setPage] = useState(1);
    const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);

    // ---- Run Results ----
    const [runResults, setRunResults] = useState({});

    // ---- Fetch Assignments ----

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

    // ---- Computed Data ----

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

    // ---- Event Handlers ----

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

    const handleStartAssignment = async (assignment) => {
        if (startingAssignmentId || submittingAssignmentId || runningAssignmentId) {
            return;
        }

        setStartingAssignmentId(assignment.id);

        try {
            await assessmentApi.startAssignment(assignment.id);
            showSuccess("Assessment started.");
            await fetchAssignments();
        } catch (err) {
            showError(getApiErrorMessage(err, "Failed to start assessment"));
        } finally {
            setStartingAssignmentId(null);
        }
    };

    const handleSubmit = async (assignment, options = {}) => {
        if (submittingAssignmentId) {
            return;
        }

        const isAutoSubmit = options.autoSubmit === true;
        const isCodingChallenge = assignment.assessmentType === "CODING_CHALLENGE";

        const payload = isCodingChallenge
            ? { submittedCode: codes[assignment.id] }
            : { submittedAnswer: answers[assignment.id] };

        if (isAutoSubmit) {
            payload.autoSubmitted = true;
        }

        if (isCodingChallenge && (!payload.submittedCode || !payload.submittedCode.trim())) {
            showWarning(
                isAutoSubmit
                    ? "Time expired, but no code was available to submit."
                    : "Please enter your code before submitting."
            );
            return;
        }

        if (!isCodingChallenge && (!payload.submittedAnswer || !payload.submittedAnswer.trim())) {
            showWarning(
                isAutoSubmit
                    ? "Time expired, but no answer was available to submit."
                    : "Please enter your answer before submitting."
            );
            return;
        }

        setSubmittingAssignmentId(assignment.id);

        try {
            await assessmentApi.submitAssignment(assignment.id, payload);

            showSuccess(
                isAutoSubmit
                    ? "Time expired. Assessment submitted automatically."
                    : "Assessment submitted successfully."
            );

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

            const totalTests = result.totalTests || 0;
            const passedTests = result.passedTests || 0;

            if (totalTests === 0) {
                showWarning("No sample test cases were available.");
                return;
            }

            if (passedTests === totalTests) {
                showSuccess("All visible sample tests passed.");
                return;
            }

            if (passedTests > 0) {
                showWarning(
                    `${passedTests}/${totalTests} visible sample tests passed. Check the Run Result panel.`
                );
                return;
            }

            showWarning("Visible sample tests failed. Check the Run Result panel.");
        } catch (err) {
            showError(getApiErrorMessage(err, "Failed to run code"));
        } finally {
            setRunningAssignmentId(null);
        }
    };

    // ---- Dashboard Tabs ----

    const dashboardTabs = [
        {
            id: "overview",
            label: "Overview",
            icon: "overview",
            content: (
                <CandidateOverviewPanel
                    stats={stats}
                    assignments={assignments}
                    loadingAssignments={loadingAssignments}
                    onRefresh={fetchAssignments}
                />
            ),
        },
        {
            id: "assignments",
            label: "My Assessments",
            icon: "assignments",
            content: (
                <MyAssignmentsPanel
                    assignments={assignments}
                    paginatedAssignments={paginatedAssignments}
                    filteredCount={filteredAssignments.length}
                    loadingAssignments={loadingAssignments}
                    selectedAssignment={selectedAssignment}
                    page={page}
                    pageSize={CANDIDATE_PAGE_SIZE}
                    searchTerm={searchTerm}
                    organizationFilter={organizationFilter}
                    statusFilter={statusFilter}
                    executionFilter={executionFilter}
                    languageFilter={languageFilter}
                    organizations={organizations}
                    code={codes[selectedAssignment?.id] || ""}
                    answer={answers[selectedAssignment?.id] || ""}
                    submittingAssignmentId={submittingAssignmentId}
                    runningAssignmentId={runningAssignmentId}
                    startingAssignmentId={startingAssignmentId}
                    runResult={runResults[selectedAssignment?.id]}
                    onPageChange={setPage}
                    onSelectAssignment={setSelectedAssignmentId}
                    onSearchTermChange={setSearchTerm}
                    onOrganizationFilterChange={setOrganizationFilter}
                    onStatusFilterChange={setStatusFilter}
                    onExecutionFilterChange={setExecutionFilter}
                    onLanguageFilterChange={setLanguageFilter}
                    onRefresh={fetchAssignments}
                    onCodeChange={handleCodeChange}
                    onAnswerChange={handleAnswerChange}
                    onRunCode={handleRunCode}
                    onStartAssignment={handleStartAssignment}
                    onSubmit={handleSubmit}
                />
            ),
        },
        {
            id: "results",
            label: "View Results",
            icon: "results",
            content: (
                <CandidateResultsPanel
                    assignments={assignments}
                />
            ),
        },
        {
            id: "profile",
            label: "Profile",
            icon: "profile",
            content: (
                <CandidateProfilePanel user={user} />
            ),
        },
    ];

    return (
        <DashboardLayout
            tabs={dashboardTabs}
            activeTabId={activeTab}
            onTabChange={setActiveTab}
            userRole="candidate"
            userName={user?.fullName}
            userTitle="Candidate"
        />
    );
}

export default CandidateDashboard;
