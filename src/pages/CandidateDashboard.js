import { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";
import { useAuth } from "../auth/AuthContext";

function CandidateDashboard() {
    const { user } = useAuth();

    const [assignments, setAssignments] = useState([]);
    const [answers, setAnswers] = useState({});
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const fetchAssignments = async () => {
        setError("");

        try {
            const response = await axiosClient.get("/assessments/my-assignments");
            setAssignments(response.data);
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

    const handleSubmit = async (assignmentId) => {
        setError("");
        setSuccessMessage("");

        const submittedAnswer = answers[assignmentId];

        if (!submittedAnswer || !submittedAnswer.trim()) {
            setError("Please enter your answer before submitting.");
            return;
        }

        try {
            await axiosClient.post(`/assessments/assignments/${assignmentId}/submit`, {
                submittedAnswer,
            });

            setSuccessMessage("Assessment submitted successfully.");
            setAnswers((current) => ({
                ...current,
                [assignmentId]: "",
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
                                <strong>Assigned At:</strong>{" "}
                                {assignment.assignedAt
                                    ? new Date(assignment.assignedAt).toLocaleString()
                                    : "N/A"}
                            </p>

                            {assignment.status === "ASSIGNED" && (
                                <>
                                    <label>Your Answer / Code Submission</label>
                                    <textarea
                                        rows="10"
                                        value={answers[assignment.id] || ""}
                                        onChange={(event) =>
                                            handleAnswerChange(assignment.id, event.target.value)
                                        }
                                        placeholder="Write your answer or code here"
                                    />

                                    <button
                                        className="primary-button"
                                        onClick={() => handleSubmit(assignment.id)}
                                    >
                                        Submit Assessment
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

                                    <p>
                                        <strong>Your Submission:</strong>
                                    </p>

                                    <pre>{assignment.submittedAnswer}</pre>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default CandidateDashboard;