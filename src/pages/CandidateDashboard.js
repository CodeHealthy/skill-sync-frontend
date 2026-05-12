import { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";
import { useAuth } from "../auth/AuthContext";

function CandidateDashboard() {
    const { user } = useAuth();

    const [assignments, setAssignments] = useState([]);
    const [answers, setAnswers] = useState({});
    const [codes, setCodes] = useState({});
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const fetchAssignments = async () => {
        setError("");

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
        }
    };

    useEffect(() => {
        fetchAssignments();
    }, []);

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

            fetchAssignments();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.response?.data?.error ||
                "Failed to submit assessment"
            );
        }
    };

    return (
        <div className="page-container">
            <div className="dashboard-header">
                <div>
                    <h1>Candidate Portal</h1>
                    <p>Welcome, {user?.fullName}. View and submit assigned assessments.</p>
                </div>

                <button className="secondary-button" onClick={fetchAssignments}>
                    Refresh
                </button>
            </div>

            {error && <div className="error-box">{error}</div>}
            {successMessage && <div className="success-box">{successMessage}</div>}

            <div className="list-card">
                <h2>My Assignments</h2>

                {assignments.length === 0 && (
                    <p>No assessments have been assigned to you yet.</p>
                )}

                <div className="candidate-list">
                    {assignments.map((assignment) => (
                        <div className="candidate-card" key={assignment.id}>
                            <h3>{assignment.assessmentTitle}</h3>

                            <p>
                                <strong>Status:</strong> {assignment.status}
                            </p>

                            <p>
                                <strong>Type:</strong> {assignment.assessmentType}
                            </p>

                            <p>
                                <strong>Language:</strong> {assignment.language}
                            </p>

                            <p>
                                <strong>Execution Status:</strong>{" "}
                                {assignment.executionStatus || "NOT_RUN"}
                            </p>

                            <p>
                                <strong>Assigned At:</strong>{" "}
                                {assignment.assignedAt
                                    ? new Date(assignment.assignedAt).toLocaleString()
                                    : "N/A"}
                            </p>

                            <p>
                                <strong>Prompt:</strong>
                            </p>
                            <pre>{assignment.prompt}</pre>

                            {assignment.expectedOutput && (
                                <>
                                    <p>
                                        <strong>Expected Output:</strong>
                                    </p>
                                    <pre>{assignment.expectedOutput}</pre>
                                </>
                            )}

                            {assignment.status === "ASSIGNED" &&
                                assignment.assessmentType === "CODING_CHALLENGE" && (
                                    <>
                                        <label>Your Code</label>
                                        <textarea
                                            rows="14"
                                            className="code-textarea"
                                            value={codes[assignment.id] || ""}
                                            onChange={(event) =>
                                                handleCodeChange(assignment.id, event.target.value)
                                            }
                                            placeholder="Write your code here"
                                        />

                                        <button
                                            className="primary-button"
                                            onClick={() => handleSubmit(assignment)}
                                        >
                                            Submit Code
                                        </button>
                                    </>
                                )}

                            {assignment.status === "ASSIGNED" &&
                                assignment.assessmentType === "QUIZ" && (
                                    <>
                                        <label>Your Answer</label>
                                        <textarea
                                            rows="8"
                                            value={answers[assignment.id] || ""}
                                            onChange={(event) =>
                                                handleAnswerChange(assignment.id, event.target.value)
                                            }
                                            placeholder="Write your answer here"
                                        />

                                        <button
                                            className="primary-button"
                                            onClick={() => handleSubmit(assignment)}
                                        >
                                            Submit Answer
                                        </button>
                                    </>
                                )}

                            {assignment.status !== "ASSIGNED" && (
                                <>
                                    <p>
                                        <strong>Submitted At:</strong>{" "}
                                        {assignment.submittedAt
                                            ? new Date(assignment.submittedAt).toLocaleString()
                                            : "N/A"}
                                    </p>

                                    {assignment.submittedAnswer && (
                                        <>
                                            <p>
                                                <strong>Your Submission:</strong>
                                            </p>
                                            <pre>{assignment.submittedAnswer}</pre>
                                        </>
                                    )}

                                    {assignment.submittedCode && (
                                        <>
                                            <p>
                                                <strong>Your Code:</strong>
                                            </p>
                                            <pre>{assignment.submittedCode}</pre>
                                        </>
                                    )}
                                </>
                            )}

                            {assignment.status === "SUBMITTED" && (
                                <div className="pending-grade-box">
                                    <p>Your submission is waiting for admin review.</p>
                                </div>
                            )}

                            {assignment.status === "GRADED" && (
                                <div className="graded-box">
                                    <h4>Grade</h4>
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
                    ))}
                </div>
            </div>
        </div>
    );
}

export default CandidateDashboard;