import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { assessmentApi } from "../api/assessmentApi";
import AssignmentDetail from "../components/candidate/AssignmentDetail";
import { getApiErrorMessage } from "../utils/errorUtils";
import { showError, showSuccess, showWarning } from "../utils/toastUtils";

function CandidateAssessmentSessionPage() {
    const { assignmentId } = useParams();
    const navigate = useNavigate();
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [answers, setAnswers] = useState({});
    const [codes, setCodes] = useState({});
    const [runResults, setRunResults] = useState({});
    const [startingAssignmentId, setStartingAssignmentId] = useState(null);
    const [submittingAssignmentId, setSubmittingAssignmentId] = useState(null);
    const [runningAssignmentId, setRunningAssignmentId] = useState(null);

    const assignment = useMemo(
        () => assignments.find((item) => item.id === assignmentId) || null,
        [assignmentId, assignments]
    );

    const fetchAssignments = async () => {
        setLoading(true);

        try {
            const response = await assessmentApi.getMyAssignments();
            setAssignments(response.data);

            const initialCodes = {};
            response.data.forEach((item) => {
                if (item.assessmentType === "CODING_CHALLENGE" && item.status === "ASSIGNED") {
                    initialCodes[item.id] = item.starterCode || "";
                }
            });

            setCodes((current) => ({
                ...initialCodes,
                ...current,
            }));
        } catch (error) {
            showError(getApiErrorMessage(error, "Failed to load assessment"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssignments();
    }, [assignmentId]);

    const handleAnswerChange = (id, value) => {
        setAnswers((current) => ({
            ...current,
            [id]: value,
        }));
    };

    const handleCodeChange = (id, value) => {
        setCodes((current) => ({
            ...current,
            [id]: value,
        }));
    };

    const handleStartAssignment = async (item) => {
        if (startingAssignmentId || submittingAssignmentId || runningAssignmentId) {
            return;
        }

        setStartingAssignmentId(item.id);

        try {
            await assessmentApi.startAssignment(item.id);
            showSuccess("Assessment started.");
            await fetchAssignments();
        } catch (error) {
            showError(getApiErrorMessage(error, "Failed to start assessment"));
        } finally {
            setStartingAssignmentId(null);
        }
    };

    const handleStartSection = async (item, sectionId) => {
        try {
            const response = await assessmentApi.startAssignmentSection(item.id, sectionId);
            setAssignments((current) =>
                current.map((assignmentItem) =>
                    assignmentItem.id === item.id ? response.data : assignmentItem
                )
            );
        } catch (error) {
            showError(getApiErrorMessage(error, "Failed to start section"));
        }
    };

    const handleCompleteSection = async (item, sectionId) => {
        try {
            const response = await assessmentApi.completeAssignmentSection(item.id, sectionId);
            setAssignments((current) =>
                current.map((assignmentItem) =>
                    assignmentItem.id === item.id ? response.data : assignmentItem
                )
            );
        } catch (error) {
            showError(getApiErrorMessage(error, "Failed to complete section"));
            throw error;
        }
    };

    const handleSubmit = async (item, options = {}) => {
        if (submittingAssignmentId) {
            return;
        }

        const isAutoSubmit = options.autoSubmit === true;
        const isCodingChallenge = item.assessmentType === "CODING_CHALLENGE";
        const payload = isCodingChallenge
            ? {
                submittedCode: codes[item.id],
                submittedAnswers: answers[item.id] || {},
            }
            : { submittedAnswers: answers[item.id] || {} };

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

        if (
            !isCodingChallenge &&
            Object.values(payload.submittedAnswers || {}).every(
                (value) => !value || !String(value).trim()
            )
        ) {
            showWarning(
                isAutoSubmit
                    ? "Time expired, but no answer was available to submit."
                    : "Please enter your answer before submitting."
            );
            return;
        }

        setSubmittingAssignmentId(item.id);

        try {
            await assessmentApi.submitAssignment(item.id, payload);

            showSuccess(
                isAutoSubmit
                    ? "Time expired. Assessment submitted automatically."
                    : "Assessment submitted successfully."
            );

            await fetchAssignments();
            navigate("/candidate");
        } catch (error) {
            showError(getApiErrorMessage(error, "Failed to submit assessment"));
        } finally {
            setSubmittingAssignmentId(null);
        }
    };

    const handleRunCode = async (item) => {
        if (runningAssignmentId || submittingAssignmentId) {
            return;
        }

        const sourceCode = codes[item.id];

        if (!sourceCode || !sourceCode.trim()) {
            showWarning("Please enter your code before running.");
            return;
        }

        setRunningAssignmentId(item.id);

        try {
            const response = await assessmentApi.runAssignmentCode(item.id, {
                sourceCode,
            });
            const result = response.data;

            setRunResults((current) => ({
                ...current,
                [item.id]: result,
            }));

            if (!result.totalTests) {
                showWarning("No sample test cases were available.");
            } else if (result.passedTests === result.totalTests) {
                showSuccess("All visible sample tests passed.");
            } else {
                showWarning(`${result.passedTests || 0}/${result.totalTests || 0} visible sample tests passed.`);
            }
        } catch (error) {
            showError(getApiErrorMessage(error, "Failed to run code"));
        } finally {
            setRunningAssignmentId(null);
        }
    };

    if (loading) {
        return (
            <main className="assessment-session-page">
                <div className="empty-state">
                    <h3>Loading assessment</h3>
                    <p>Preparing your test workspace.</p>
                </div>
            </main>
        );
    }

    if (!assignment) {
        return (
            <main className="assessment-session-page">
                <div className="empty-state">
                    <h3>Assessment not found</h3>
                    <p>This assessment may no longer be available.</p>
                    <Link className="secondary-button" to="/candidate">Back to dashboard</Link>
                </div>
            </main>
        );
    }

    return (
        <main className="assessment-session-page">
            <AssignmentDetail
                assignment={assignment}
                code={codes[assignment.id] || ""}
                answer={answers[assignment.id] || {}}
                submittingAssignmentId={submittingAssignmentId}
                runningAssignmentId={runningAssignmentId}
                startingAssignmentId={startingAssignmentId}
                runResult={runResults[assignment.id]}
                sessionMode
                onBack={() => navigate("/candidate")}
                onCodeChange={handleCodeChange}
                onAnswerChange={handleAnswerChange}
                onRunCode={handleRunCode}
                onStartAssignment={handleStartAssignment}
                onStartSection={handleStartSection}
                onCompleteSection={handleCompleteSection}
                onSubmit={handleSubmit}
            />
        </main>
    );
}

export default CandidateAssessmentSessionPage;
