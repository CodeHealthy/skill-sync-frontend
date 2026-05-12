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
        answers:
            "public class Main {\n  public static void main(String[] args) {\n    System.out.println(\"Hello SkillSync\");\n  }\n}",
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
            });

            setSuccessMessage("Test result submitted successfully.");

            setTestResult((current) => ({
                ...current,
                answers: "",
            }));
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.response?.data?.error ||
                "Failed to submit test result"
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="page-container">
            <div className="dashboard-header">
                <div>
                    <h1>Candidate Portal</h1>
                    <p>Welcome, {user?.fullName}. Submit your challenge result here.</p>
                </div>
            </div>

            {error && <div className="error-box">{error}</div>}
            {successMessage && <div className="success-box">{successMessage}</div>}

            <div className="form-card wide-card">
                <h2>Submit Test Result</h2>

                <p>
                    For now, paste the candidate ID created by the admin. Later, this will
                    be replaced by assigned tests linked directly to the logged-in
                    candidate.
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
                        min="0"
                        max="100"
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

                    <label>Answers / Code Submission</label>
                    <textarea
                        name="answers"
                        value={testResult.answers}
                        onChange={handleChange}
                        rows="10"
                        placeholder="Paste your code or quiz answers here"
                    />

                    <button type="submit" className="primary-button" disabled={submitting}>
                        {submitting ? "Submitting..." : "Submit Result"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default CandidateDashboard;