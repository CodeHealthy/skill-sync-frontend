import { useState } from "react";
import axiosClient from "../api/axiosClient";
import { useAuth } from "../auth/AuthContext";

function CandidateDashboard() {
    const { user } = useAuth();

    const [candidateId, setCandidateId] = useState("");
    const [testResult, setTestResult] = useState({
        testName: "Java Basics Challenge",
        score: 85,
        status: "Passed",
        answers: "Sample candidate answer",
    });

    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (event) => {
        setTestResult((current) => ({
            ...current,
            [event.target.name]: event.target.value,
        }));
    };

    const handleSubmitResult = async (event) => {
        event.preventDefault();

        setError("");
        setSuccessMessage("");

        if (!candidateId.trim()) {
            setError("Candidate ID is required for this temporary test.");
            return;
        }

        setSubmitting(true);

        try {
            await axiosClient.post(`/candidates/${candidateId}/test-results`, {
                ...testResult,
                score: Number(testResult.score),
                submissionTime: new Date().toISOString(),
            });

            setSuccessMessage("Test result submitted successfully.");
        } catch (err) {
            const message =
                err.response?.data?.message ||
                err.response?.data?.error ||
                "Failed to submit test result";

            setError(message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="page-container">
            <div className="dashboard-header">
                <div>
                    <h1>Candidate Portal</h1>
                    <p>Welcome, {user?.fullName}. Take assigned challenges here.</p>
                </div>
            </div>

            {error && <div className="error-box">{error}</div>}
            {successMessage && <div className="success-box">{successMessage}</div>}

            <div className="form-card wide-card">
                <h2>Temporary Test Result Submission</h2>
                <p>
                    For now, paste a candidate ID from the Admin Dashboard to test the
                    backend API. Later we will connect this to assigned tests.
                </p>

                <form onSubmit={handleSubmitResult}>
                    <label>Candidate ID</label>
                    <input
                        type="text"
                        value={candidateId}
                        onChange={(event) => setCandidateId(event.target.value)}
                        placeholder="Paste candidate ID from Admin Dashboard"
                        required
                    />

                    <label>Test Name</label>
                    <input
                        name="testName"
                        type="text"
                        value={testResult.testName}
                        onChange={handleChange}
                        required
                    />

                    <label>Score</label>
                    <input
                        name="score"
                        type="number"
                        value={testResult.score}
                        onChange={handleChange}
                        required
                    />

                    <label>Status</label>
                    <select
                        name="status"
                        value={testResult.status}
                        onChange={handleChange}
                    >
                        <option value="Pending">Pending</option>
                        <option value="Passed">Passed</option>
                        <option value="Failed">Failed</option>
                    </select>

                    <label>Answers</label>
                    <textarea
                        name="answers"
                        value={testResult.answers}
                        onChange={handleChange}
                        rows="5"
                        placeholder="Candidate answer"
                    />

                    <button type="submit" className="primary-button" disabled={submitting}>
                        {submitting ? "Submitting..." : "Submit Test Result"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default CandidateDashboard;