import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
    const draftSaveTimerRef = useRef(null);
    const lastDraftSignatureRef = useRef({});
    const lastDraftErrorAtRef = useRef(0);
    const integrityEventThrottleRef = useRef({});

    const assignment = useMemo(
        () => assignments.find((item) => item.id === assignmentId) || null,
        [assignmentId, assignments]
    );

    const replaceAssignment = useCallback((nextAssignment) => {
        setAssignments((current) =>
            current.map((assignmentItem) =>
                assignmentItem.id === nextAssignment.id ? nextAssignment : assignmentItem
            )
        );
    }, []);

    const fetchAssignments = async () => {
        setLoading(true);

        try {
            const response = await assessmentApi.getMyAssignments();
            setAssignments(response.data);

            const initialCodes = {};
            const initialAnswers = {};
            response.data.forEach((item) => {
                if (item.status === "ASSIGNED") {
                    lastDraftSignatureRef.current[item.id] = JSON.stringify({
                        draftCode: item.assessmentType === "CODING_CHALLENGE"
                            ? item.draftCode ?? item.starterCode ?? ""
                            : null,
                        draftAnswers: item.draftAnswers || {},
                    });
                }

                if (item.assessmentType === "CODING_CHALLENGE" && item.status === "ASSIGNED") {
                    initialCodes[item.id] = item.draftCode ?? item.starterCode ?? "";
                }

                if (item.status === "ASSIGNED" && item.draftAnswers) {
                    initialAnswers[item.id] = item.draftAnswers;
                }
            });

            setCodes((current) => ({
                ...initialCodes,
                ...current,
            }));
            setAnswers((current) => ({
                ...initialAnswers,
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

    useEffect(() => {
        if (!assignment || assignment.status !== "ASSIGNED") {
            return undefined;
        }

        if (assignment.timeLimitMinutes && !assignment.startedAt) {
            return undefined;
        }

        const payload = {
            draftCode: assignment.assessmentType === "CODING_CHALLENGE"
                ? codes[assignment.id] || ""
                : null,
            draftAnswers: answers[assignment.id] || {},
        };
        const signature = JSON.stringify(payload);

        if (lastDraftSignatureRef.current[assignment.id] === signature) {
            return undefined;
        }

        if (draftSaveTimerRef.current) {
            window.clearTimeout(draftSaveTimerRef.current);
        }

        draftSaveTimerRef.current = window.setTimeout(async () => {
            try {
                const response = await assessmentApi.saveAssignmentDraft(assignment.id, payload);
                lastDraftSignatureRef.current[assignment.id] = signature;
                replaceAssignment(response.data);
            } catch (error) {
                const now = Date.now();

                if (now - lastDraftErrorAtRef.current > 30_000) {
                    lastDraftErrorAtRef.current = now;
                    showWarning(getApiErrorMessage(error, "Autosave failed. Keep this page open and try again."));
                }
            }
        }, 1_000);

        return () => {
            if (draftSaveTimerRef.current) {
                window.clearTimeout(draftSaveTimerRef.current);
            }
        };
    }, [assignment, answers, codes, replaceAssignment]);

    const recordIntegrityEvent = useCallback((type, detail = "") => {
        if (!assignment || assignment.status !== "ASSIGNED") {
            return;
        }

        if (assignment.timeLimitMinutes && !assignment.startedAt) {
            return;
        }

        const throttleKey = `${assignment.id}:${type}`;
        const now = Date.now();

        if (
            integrityEventThrottleRef.current[throttleKey] &&
            now - integrityEventThrottleRef.current[throttleKey] < 5_000
        ) {
            return;
        }

        integrityEventThrottleRef.current[throttleKey] = now;

        assessmentApi.recordIntegrityEvent(assignment.id, {
            type,
            detail,
        }).catch(() => {
            // Integrity logging is advisory and should never interrupt the candidate's work.
        });
    }, [assignment]);

    useEffect(() => {
        if (!assignment || assignment.status !== "ASSIGNED") {
            return undefined;
        }

        recordIntegrityEvent("SESSION_START", "Candidate opened the assessment workspace.");

        const handleBlur = () => {
            recordIntegrityEvent("WINDOW_BLUR", "Assessment window lost focus.");
        };
        const handleFocus = () => {
            recordIntegrityEvent("WINDOW_FOCUS", "Assessment window regained focus.");
        };
        const handleVisibilityChange = () => {
            recordIntegrityEvent(
                document.hidden ? "VISIBILITY_HIDDEN" : "VISIBILITY_VISIBLE",
                document.hidden ? "Assessment tab became hidden." : "Assessment tab became visible."
            );
        };
        const handleCopy = () => {
            recordIntegrityEvent("COPY", "Candidate copied content during the assessment.");
        };
        const handlePaste = () => {
            recordIntegrityEvent("PASTE", "Candidate pasted content during the assessment.");
        };
        const handleContextMenu = () => {
            recordIntegrityEvent("CONTEXT_MENU", "Candidate opened the context menu during the assessment.");
        };
        const handleBeforeUnload = () => {
            recordIntegrityEvent("SESSION_END", "Candidate left or refreshed the assessment workspace.");
        };

        window.addEventListener("blur", handleBlur);
        window.addEventListener("focus", handleFocus);
        window.addEventListener("beforeunload", handleBeforeUnload);
        document.addEventListener("visibilitychange", handleVisibilityChange);
        document.addEventListener("copy", handleCopy);
        document.addEventListener("paste", handlePaste);
        document.addEventListener("contextmenu", handleContextMenu);

        return () => {
            recordIntegrityEvent("SESSION_END", "Candidate closed the assessment workspace.");
            window.removeEventListener("blur", handleBlur);
            window.removeEventListener("focus", handleFocus);
            window.removeEventListener("beforeunload", handleBeforeUnload);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            document.removeEventListener("copy", handleCopy);
            document.removeEventListener("paste", handlePaste);
            document.removeEventListener("contextmenu", handleContextMenu);
        };
    }, [assignment, recordIntegrityEvent]);

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
            const response = await assessmentApi.startAssignment(item.id);
            replaceAssignment(response.data);
            showSuccess("Assessment started.");
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
            recordIntegrityEvent("AUTO_SUBMIT", "Assessment submitted automatically by timer.");
        } else {
            recordIntegrityEvent("MANUAL_SUBMIT", "Candidate clicked final submit.");
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
            const response = await assessmentApi.submitAssignment(item.id, payload);
            replaceAssignment(response.data);
            lastDraftSignatureRef.current[item.id] = JSON.stringify({
                draftCode: "",
                draftAnswers: {},
            });

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
