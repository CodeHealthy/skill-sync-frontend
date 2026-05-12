import { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";
import { useAuth } from "../auth/AuthContext";

function AdminDashboard() {
    const { user } = useAuth();

    const [candidateForm, setCandidateForm] = useState({
        name: "",
        email: "",
    });

    const [candidates, setCandidates] = useState([]);
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [selectedResults, setSelectedResults] = useState([]);

    const [loadingCandidates, setLoadingCandidates] = useState(false);
    const [loadingResults, setLoadingResults] = useState(false);
    const [creatingCandidate, setCreatingCandidate] = useState(false);

    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const fetchCandidates = async () => {
        setLoadingCandidates(true);
        setError("");

        try {
            const response = await axiosClient.get("/candidates");
            setCandidates(response.data);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.response?.data?.error ||
                "Failed to fetch candidates"
            );
        } finally {
            setLoadingCandidates(false);
        }
    };

    useEffect(() => {
        fetchCandidates();
    }, []);

    const handleChange = (event) => {
        setCandidateForm((current) => ({
            ...current,
            [event.target.name]: event.target.value,
        }));
    };

    const handleCreateCandidate = async (event) => {
        event.preventDefault();

        setError("");
        setSuccessMessage("");
        setCreatingCandidate(true);

        try {
            const response = await axiosClient.post("/candidates", candidateForm);

            setCandidates((current) => [...current, response.data]);

            setCandidateForm({
                name: "",
                email: "",
            });

            setSuccessMessage("Candidate created successfully.");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.response?.data?.error ||
                "Failed to create candidate"
            );
        } finally {
            setCreatingCandidate(false);
        }
    };

    const handleViewResults = async (candidate) => {
        setSelectedCandidate(candidate);
        setSelectedResults([]);
        setLoadingResults(true);
        setError("");

        try {
            const response = await axiosClient.get(
                `/candidates/${candidate.id}/test-results`
            );
            setSelectedResults(response.data);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.response?.data?.error ||
                "Failed to load candidate results"
            );
        } finally {
            setLoadingResults(false);
        }
    };

    return (
        <div className="page-container">
            <div className="dashboard-header">
                <div>
                    <h1>Admin Dashboard</h1>
                    <p>Welcome, {user?.fullName}. Manage candidates and review results.</p>
                </div>

                <button className="secondary-button" onClick={fetchCandidates}>
                    Refresh
                </button>
            </div>

            {error && <div className="error-box">{error}</div>}
            {successMessage && <div className="success-box">{successMessage}</div>}

            <div className="grid-layout">
                <div className="form-card">
                    <h2>Create Candidate</h2>

                    <form onSubmit={handleCreateCandidate}>
                        <label>Candidate Name</label>
                        <input
                            name="name"
                            type="text"
                            value={candidateForm.name}
                            onChange={handleChange}
                            placeholder="Candidate name"
                            required
                        />

                        <label>Candidate Email</label>
                        <input
                            name="email"
                            type="email"
                            value={candidateForm.email}
                            onChange={handleChange}
                            placeholder="candidate@example.com"
                            required
                        />

                        <button
                            type="submit"
                            className="primary-button"
                            disabled={creatingCandidate}
                        >
                            {creatingCandidate ? "Creating..." : "Create Candidate"}
                        </button>
                    </form>
                </div>

                <div className="list-card">
                    <h2>Candidates</h2>

                    {loadingCandidates && <p>Loading candidates...</p>}

                    {!loadingCandidates && candidates.length === 0 && (
                        <p>No candidates found.</p>
                    )}

                    {!loadingCandidates && candidates.length > 0 && (
                        <div className="candidate-list">
                            {candidates.map((candidate) => (
                                <div className="candidate-card" key={candidate.id}>
                                    <h3>{candidate.name}</h3>
                                    <p>{candidate.email}</p>
                                    <small>ID: {candidate.id}</small>

                                    <div className="card-actions">
                                        <button
                                            className="secondary-button"
                                            onClick={() => handleViewResults(candidate)}
                                        >
                                            View Results
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {selectedCandidate && (
                <div className="list-card results-section">
                    <h2>Results for {selectedCandidate.name}</h2>
                    <p>{selectedCandidate.email}</p>

                    {loadingResults && <p>Loading results...</p>}

                    {!loadingResults && selectedResults.length === 0 && (
                        <p>No test results submitted yet.</p>
                    )}

                    {!loadingResults && selectedResults.length > 0 && (
                        <div className="results-list">
                            {selectedResults.map((result, index) => (
                                <div className="result-card" key={`${result.testName}-${index}`}>
                                    <h3>{result.testName}</h3>
                                    <p>
                                        <strong>Score:</strong> {result.score}
                                    </p>
                                    <p>
                                        <strong>Status:</strong> {result.status}
                                    </p>
                                    <p>
                                        <strong>Submitted:</strong>{" "}
                                        {result.submissionTime
                                            ? new Date(result.submissionTime).toLocaleString()
                                            : "N/A"}
                                    </p>
                                    <p>
                                        <strong>Answers:</strong>
                                    </p>
                                    <pre>{result.answers || "No answer provided"}</pre>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default AdminDashboard;