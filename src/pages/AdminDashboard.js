import { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";
import { useAuth } from "../auth/AuthContext";

function AdminDashboard() {
    const { user } = useAuth();

    const [candidateForm, setCandidateForm] = useState({
        name: "",
        email: "",
    });

    const [assessmentForm, setAssessmentForm] = useState({
        title: "",
        description: "",
        type: "CODING_CHALLENGE",
        maxScore: 100,
        prompt: "",
    });

    const [assignForm, setAssignForm] = useState({
        candidateId: "",
        assessmentId: "",
    });

    const [candidates, setCandidates] = useState([]);
    const [assessments, setAssessments] = useState([]);
    const [assignments, setAssignments] = useState([]);

    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const fetchDashboardData = async () => {
        setError("");

        try {
            const [candidateResponse, assessmentResponse, assignmentResponse] =
                await Promise.all([
                    axiosClient.get("/candidates"),
                    axiosClient.get("/assessments"),
                    axiosClient.get("/assessments/assignments"),
                ]);

            setCandidates(candidateResponse.data);
            setAssessments(assessmentResponse.data);
            setAssignments(assignmentResponse.data);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.response?.data?.error ||
                "Failed to load dashboard data"
            );
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const handleCandidateChange = (event) => {
        setCandidateForm((current) => ({
            ...current,
            [event.target.name]: event.target.value,
        }));
    };

    const handleAssessmentChange = (event) => {
        setAssessmentForm((current) => ({
            ...current,
            [event.target.name]: event.target.value,
        }));
    };

    const handleAssignChange = (event) => {
        setAssignForm((current) => ({
            ...current,
            [event.target.name]: event.target.value,
        }));
    };

    const handleCreateCandidate = async (event) => {
        event.preventDefault();
        setError("");
        setSuccessMessage("");

        try {
            await axiosClient.post("/candidates", candidateForm);

            setCandidateForm({
                name: "",
                email: "",
            });

            setSuccessMessage("Candidate created successfully.");
            fetchDashboardData();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.response?.data?.error ||
                "Failed to create candidate"
            );
        }
    };

    const handleCreateAssessment = async (event) => {
        event.preventDefault();
        setError("");
        setSuccessMessage("");

        try {
            await axiosClient.post("/assessments", {
                ...assessmentForm,
                maxScore: Number(assessmentForm.maxScore),
            });

            setAssessmentForm({
                title: "",
                description: "",
                type: "CODING_CHALLENGE",
                maxScore: 100,
                prompt: "",
            });

            setSuccessMessage("Assessment created successfully.");
            fetchDashboardData();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.response?.data?.error ||
                "Failed to create assessment"
            );
        }
    };

    const handleAssignAssessment = async (event) => {
        event.preventDefault();
        setError("");
        setSuccessMessage("");

        try {
            await axiosClient.post("/assessments/assign", assignForm);

            setAssignForm({
                candidateId: "",
                assessmentId: "",
            });

            setSuccessMessage("Assessment assigned successfully.");
            fetchDashboardData();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.response?.data?.error ||
                "Failed to assign assessment"
            );
        }
    };

    return (
        <div className="page-container">
            <div className="dashboard-header">
                <div>
                    <h1>Admin Dashboard</h1>
                    <p>Welcome, {user?.fullName}. Create and assign assessments.</p>
                </div>

                <button className="secondary-button" onClick={fetchDashboardData}>
                    Refresh
                </button>
            </div>

            {error && <div className="error-box">{error}</div>}
            {successMessage && <div className="success-box">{successMessage}</div>}

            <div className="admin-grid">
                <div className="form-card">
                    <h2>Create Candidate</h2>

                    <form onSubmit={handleCreateCandidate}>
                        <label>Candidate Name</label>
                        <input
                            name="name"
                            value={candidateForm.name}
                            onChange={handleCandidateChange}
                            required
                        />

                        <label>Candidate Email</label>
                        <input
                            name="email"
                            type="email"
                            value={candidateForm.email}
                            onChange={handleCandidateChange}
                            required
                        />

                        <button className="primary-button" type="submit">
                            Create Candidate
                        </button>
                    </form>
                </div>

                <div className="form-card">
                    <h2>Create Assessment</h2>

                    <form onSubmit={handleCreateAssessment}>
                        <label>Title</label>
                        <input
                            name="title"
                            value={assessmentForm.title}
                            onChange={handleAssessmentChange}
                            required
                        />

                        <label>Description</label>
                        <input
                            name="description"
                            value={assessmentForm.description}
                            onChange={handleAssessmentChange}
                        />

                        <label>Type</label>
                        <select
                            name="type"
                            value={assessmentForm.type}
                            onChange={handleAssessmentChange}
                        >
                            <option value="CODING_CHALLENGE">Coding Challenge</option>
                            <option value="QUIZ">Quiz</option>
                        </select>

                        <label>Max Score</label>
                        <input
                            name="maxScore"
                            type="number"
                            value={assessmentForm.maxScore}
                            onChange={handleAssessmentChange}
                            min="1"
                            required
                        />

                        <label>Prompt</label>
                        <textarea
                            name="prompt"
                            rows="6"
                            value={assessmentForm.prompt}
                            onChange={handleAssessmentChange}
                            required
                        />

                        <button className="primary-button" type="submit">
                            Create Assessment
                        </button>
                    </form>
                </div>

                <div className="form-card">
                    <h2>Assign Assessment</h2>

                    <form onSubmit={handleAssignAssessment}>
                        <label>Candidate</label>
                        <select
                            name="candidateId"
                            value={assignForm.candidateId}
                            onChange={handleAssignChange}
                            required
                        >
                            <option value="">Select candidate</option>
                            {candidates.map((candidate) => (
                                <option value={candidate.id} key={candidate.id}>
                                    {candidate.name} - {candidate.email}
                                </option>
                            ))}
                        </select>

                        <label>Assessment</label>
                        <select
                            name="assessmentId"
                            value={assignForm.assessmentId}
                            onChange={handleAssignChange}
                            required
                        >
                            <option value="">Select assessment</option>
                            {assessments.map((assessment) => (
                                <option value={assessment.id} key={assessment.id}>
                                    {assessment.title}
                                </option>
                            ))}
                        </select>

                        <button className="primary-button" type="submit">
                            Assign Assessment
                        </button>
                    </form>
                </div>
            </div>

            <div className="dashboard-sections">
                <div className="list-card">
                    <h2>Candidates</h2>

                    {candidates.length === 0 && <p>No candidates created yet.</p>}

                    <div className="candidate-list">
                        {candidates.map((candidate) => (
                            <div className="candidate-card" key={candidate.id}>
                                <h3>{candidate.name}</h3>
                                <p>{candidate.email}</p>
                                <small>ID: {candidate.id}</small>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="list-card">
                    <h2>Assessments</h2>

                    {assessments.length === 0 && <p>No assessments created yet.</p>}

                    <div className="candidate-list">
                        {assessments.map((assessment) => (
                            <div className="candidate-card" key={assessment.id}>
                                <h3>{assessment.title}</h3>
                                <p>{assessment.description}</p>
                                <p>
                                    <strong>Type:</strong> {assessment.type}
                                </p>
                                <p>
                                    <strong>Max Score:</strong> {assessment.maxScore}
                                </p>
                                <pre>{assessment.prompt}</pre>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="list-card">
                    <h2>Assignments</h2>

                    {assignments.length === 0 && <p>No assignments yet.</p>}

                    <div className="candidate-list">
                        {assignments.map((assignment) => (
                            <div className="candidate-card" key={assignment.id}>
                                <h3>{assignment.assessmentTitle}</h3>
                                <p>
                                    <strong>Candidate:</strong> {assignment.candidateName}
                                </p>
                                <p>
                                    <strong>Email:</strong> {assignment.candidateEmail}
                                </p>
                                <p>
                                    <strong>Status:</strong> {assignment.status}
                                </p>
                                {assignment.submittedAnswer && (
                                    <>
                                        <p>
                                            <strong>Submitted Answer:</strong>
                                        </p>
                                        <pre>{assignment.submittedAnswer}</pre>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;