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
        language: "JAVA",
        maxScore: 100,
        prompt: "",
        starterCode:
            'public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello SkillSync");\n  }\n}',
        expectedOutput: "Hello SkillSync",
    });

    const [assignForm, setAssignForm] = useState({
        candidateId: "",
        assessmentId: "",
    });

    const [gradeForms, setGradeForms] = useState({});

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
        const { name, value } = event.target;

        setAssessmentForm((current) => {
            const updated = {
                ...current,
                [name]: value,
            };

            if (name === "type" && value === "QUIZ") {
                updated.language = "TEXT";
                updated.starterCode = "";
                updated.expectedOutput = "";
            }

            if (name === "type" && value === "CODING_CHALLENGE") {
                updated.language = current.language === "TEXT" ? "JAVA" : current.language;
            }

            if (name === "language") {
                updated.starterCode = getDefaultStarterCode(value);
            }

            return updated;
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
                language: "JAVA",
                maxScore: 100,
                prompt: "",
                starterCode: getDefaultStarterCode("JAVA"),
                expectedOutput: "Hello SkillSync",
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

    const handleGradeAssignment = async (assignmentId) => {
        setError("");
        setSuccessMessage("");

        const gradeForm = gradeForms[assignmentId];

        if (!gradeForm || gradeForm.score === undefined || gradeForm.score === "") {
            setError("Score is required before grading.");
            return;
        }

        try {
            await axiosClient.patch(`/assessments/assignments/${assignmentId}/grade`, {
                score: Number(gradeForm.score),
                feedback: gradeForm.feedback || "",
            });

            setSuccessMessage("Assignment graded successfully.");

            setGradeForms((current) => ({
                ...current,
                [assignmentId]: {
                    score: "",
                    feedback: "",
                },
            }));

            fetchDashboardData();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.response?.data?.error ||
                "Failed to grade assignment"
            );
        }
    };

    return (
        <div className="page-container">
            <div className="dashboard-header">
                <div>
                    <h1>Admin Dashboard</h1>
                    <p>Welcome, {user?.fullName}. Create, assign, and grade assessments.</p>
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

                        {assessmentForm.type === "CODING_CHALLENGE" && (
                            <>
                                <label>Language</label>
                                <select
                                    name="language"
                                    value={assessmentForm.language}
                                    onChange={handleAssessmentChange}
                                >
                                    <option value="JAVA">Java</option>
                                    <option value="JAVASCRIPT">JavaScript</option>
                                    <option value="PYTHON">Python</option>
                                </select>
                            </>
                        )}

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

                        {assessmentForm.type === "CODING_CHALLENGE" && (
                            <>
                                <label>Starter Code</label>
                                <textarea
                                    name="starterCode"
                                    rows="8"
                                    value={assessmentForm.starterCode}
                                    onChange={handleAssessmentChange}
                                />

                                <label>Expected Output</label>
                                <textarea
                                    name="expectedOutput"
                                    rows="3"
                                    value={assessmentForm.expectedOutput}
                                    onChange={handleAssessmentChange}
                                />
                            </>
                        )}

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
                                    {assessment.title} ({assessment.type})
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
                                    <strong>Language:</strong> {assessment.language}
                                </p>
                                <p>
                                    <strong>Max Score:</strong> {assessment.maxScore}
                                </p>
                                <p>
                                    <strong>Prompt:</strong>
                                </p>
                                <pre>{assessment.prompt}</pre>

                                {assessment.type === "CODING_CHALLENGE" && (
                                    <>
                                        <p>
                                            <strong>Starter Code:</strong>
                                        </p>
                                        <pre>{assessment.starterCode}</pre>

                                        <p>
                                            <strong>Expected Output:</strong>
                                        </p>
                                        <pre>{assessment.expectedOutput}</pre>
                                    </>
                                )}
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
                                    <strong>Type:</strong> {assignment.assessmentType}
                                </p>

                                <p>
                                    <strong>Language:</strong> {assignment.language}
                                </p>

                                <p>
                                    <strong>Status:</strong> {assignment.status}
                                </p>

                                <p>
                                    <strong>Execution Status:</strong>{" "}
                                    {assignment.executionStatus || "NOT_RUN"}
                                </p>

                                {assignment.submittedAt && (
                                    <p>
                                        <strong>Submitted At:</strong>{" "}
                                        {new Date(assignment.submittedAt).toLocaleString()}
                                    </p>
                                )}

                                {assignment.submittedAnswer && (
                                    <>
                                        <p>
                                            <strong>Submitted Answer:</strong>
                                        </p>
                                        <pre>{assignment.submittedAnswer}</pre>
                                    </>
                                )}

                                {assignment.submittedCode && (
                                    <>
                                        <p>
                                            <strong>Submitted Code:</strong>
                                        </p>
                                        <pre>{assignment.submittedCode}</pre>
                                    </>
                                )}

                                {assignment.status === "SUBMITTED" && (
                                    <div className="grade-box">
                                        <h4>Grade Submission</h4>

                                        <label>Score</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={gradeForms[assignment.id]?.score || ""}
                                            onChange={(event) =>
                                                handleGradeChange(
                                                    assignment.id,
                                                    "score",
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Enter score"
                                        />

                                        <label>Feedback</label>
                                        <textarea
                                            rows="4"
                                            value={gradeForms[assignment.id]?.feedback || ""}
                                            onChange={(event) =>
                                                handleGradeChange(
                                                    assignment.id,
                                                    "feedback",
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Write feedback"
                                        />

                                        <button
                                            className="primary-button"
                                            onClick={() => handleGradeAssignment(assignment.id)}
                                        >
                                            Save Grade
                                        </button>
                                    </div>
                                )}

                                {assignment.status === "GRADED" && (
                                    <div className="graded-box">
                                        <p>
                                            <strong>Score:</strong> {assignment.score}
                                        </p>
                                        <p>
                                            <strong>Feedback:</strong>{" "}
                                            {assignment.feedback || "No feedback provided"}
                                        </p>
                                    </div>
                                )}

                                {assignment.status === "ASSIGNED" && (
                                    <p className="muted-text">
                                        Waiting for candidate submission.
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function getDefaultStarterCode(language) {
    if (language === "JAVA") {
        return 'public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello SkillSync");\n  }\n}';
    }

    if (language === "JAVASCRIPT") {
        return 'console.log("Hello SkillSync");';
    }

    if (language === "PYTHON") {
        return 'print("Hello SkillSync")';
    }

    return "";
}

export default AdminDashboard;