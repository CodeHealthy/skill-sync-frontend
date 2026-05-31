function CandidateInviteForm({
    candidateForm,
    creatingCandidate,
    canInviteCandidate = true,
    onCandidateChange,
    onCreateCandidate,
}) {
    return (
        <div className="form-card compact-form-card">
            <h2>Invite Candidate</h2>

            {!canInviteCandidate && (
                <div className="warning-box compact-warning-box">
                    Your current plan has reached its monthly candidate invite limit.
                </div>
            )}

            <form onSubmit={onCreateCandidate}>
                <label htmlFor="candidate-invite-name">Candidate Name</label>
                <input
                    id="candidate-invite-name"
                    name="name"
                    value={candidateForm.name}
                    onChange={onCandidateChange}
                    required
                />

                <label htmlFor="candidate-invite-email-address">Candidate Email</label>
                <input
                    id="candidate-invite-email-address"
                    name="email"
                    type="email"
                    value={candidateForm.email}
                    onChange={onCandidateChange}
                    required
                />

                <button
                    className="primary-button"
                    type="submit"
                    disabled={creatingCandidate || !canInviteCandidate}
                >
                    {creatingCandidate ? "Inviting..." : "Invite Candidate"}
                </button>
            </form>
        </div>
    );
}

export default CandidateInviteForm;
