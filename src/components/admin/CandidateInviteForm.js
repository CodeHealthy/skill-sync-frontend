function CandidateInviteForm({
    candidateForm,
    creatingCandidate,
    onCandidateChange,
    onCreateCandidate,
}) {
    return (
        <div className="form-card compact-form-card">
            <h2>Invite Candidate</h2>

            <form onSubmit={onCreateCandidate}>
                <label>Candidate Name</label>
                <input
                    name="name"
                    value={candidateForm.name}
                    onChange={onCandidateChange}
                    required
                />

                <label>Candidate Email</label>
                <input
                    name="email"
                    type="email"
                    value={candidateForm.email}
                    onChange={onCandidateChange}
                    required
                />

                <button
                    className="primary-button"
                    type="submit"
                    disabled={creatingCandidate}
                >
                    {creatingCandidate ? "Inviting..." : "Invite Candidate"}
                </button>
            </form>
        </div>
    );
}

export default CandidateInviteForm;