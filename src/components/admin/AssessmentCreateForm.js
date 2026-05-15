function AssessmentCreateForm({
    assessmentForm,
    creatingAssessment,
    onAssessmentChange,
    onCreateAssessment,
}) {
    return (
        <div className="form-card compact-form-card">
            <h2>Create Assessment</h2>

            <form onSubmit={onCreateAssessment}>
                <label>Title</label>
                <input
                    name="title"
                    value={assessmentForm.title}
                    onChange={onAssessmentChange}
                    required
                />

                <label>Description</label>
                <input
                    name="description"
                    value={assessmentForm.description}
                    onChange={onAssessmentChange}
                />

                <div className="two-column-form">
                    <div>
                        <label>Type</label>
                        <select
                            name="type"
                            value={assessmentForm.type}
                            onChange={onAssessmentChange}
                        >
                            <option value="CODING_CHALLENGE">Coding Challenge</option>
                            <option value="QUIZ">Quiz</option>
                        </select>
                    </div>

                    {assessmentForm.type === "CODING_CHALLENGE" && (
                        <div>
                            <label>Language</label>
                            <select
                                name="language"
                                value={assessmentForm.language}
                                onChange={onAssessmentChange}
                            >
                                <option value="JAVA">Java</option>
                                <option value="JAVASCRIPT">JavaScript</option>
                                <option value="PYTHON">Python</option>
                            </select>
                        </div>
                    )}
                </div>

                <label>Max Score</label>
                <input
                    name="maxScore"
                    type="number"
                    value={assessmentForm.maxScore}
                    onChange={onAssessmentChange}
                    min="1"
                    required
                />

                <label>Prompt</label>
                <textarea
                    name="prompt"
                    rows="4"
                    value={assessmentForm.prompt}
                    onChange={onAssessmentChange}
                    required
                />

                {assessmentForm.type === "CODING_CHALLENGE" && (
                    <>
                        <label>Starter Code</label>
                        <textarea
                            name="starterCode"
                            rows="5"
                            className="code-textarea"
                            value={assessmentForm.starterCode}
                            onChange={onAssessmentChange}
                        />

                        <label>Expected Output</label>
                        <textarea
                            name="expectedOutput"
                            rows="2"
                            value={assessmentForm.expectedOutput}
                            onChange={onAssessmentChange}
                        />
                    </>
                )}

                <button
                    className="primary-button"
                    type="submit"
                    disabled={creatingAssessment}
                >
                    {creatingAssessment ? "Creating..." : "Create Assessment"}
                </button>
            </form>
        </div>
    );
}

export default AssessmentCreateForm;