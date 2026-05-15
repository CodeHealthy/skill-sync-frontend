function AssessmentAssignForm({
    candidates,
    assessments,
    assignForm,
    assigningAssessment,
    onAssignChange,
    onAssignAssessment,
}) {
    return (
        <div className="form-card compact-form-card">
            <h2>Assign Assessment</h2>

            <form onSubmit={onAssignAssessment}>
                <label>Candidate</label>
                <select
                    name="candidateId"
                    value={assignForm.candidateId}
                    onChange={onAssignChange}
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
                    onChange={onAssignChange}
                    required
                >
                    <option value="">Select assessment</option>
                    {assessments.map((assessment) => (
                        <option value={assessment.id} key={assessment.id}>
                            {assessment.title} ({assessment.type})
                        </option>
                    ))}
                </select>

                <button
                    className="primary-button"
                    type="submit"
                    disabled={assigningAssessment}
                >
                    {assigningAssessment ? "Assigning..." : "Assign Assessment"}
                </button>
            </form>
        </div>
    );
}

export default AssessmentAssignForm;