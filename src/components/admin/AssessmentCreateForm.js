import { useMemo } from "react";

const steps = ["Basics", "Prompt", "Test Cases", "Review"];

function AssessmentCreateForm({
    assessmentForm,
    creatingAssessment,
    wizardOpen,
    wizardStep,
    onWizardOpenChange,
    onWizardStepChange,
    onGenerateWithAi,
    onAssessmentChange,
    onAssessmentTestCaseChange,
    onAddAssessmentTestCase,
    onRemoveAssessmentTestCase,
    onCreateAssessment,
}) {
    const open = wizardOpen;
    const stepIndex = wizardStep;

    const isCodingChallenge = assessmentForm.type === "CODING_CHALLENGE";

    const testCases = useMemo(() => {
        return assessmentForm.testCases || [];
    }, [assessmentForm.testCases]);

    const totalTestPoints = useMemo(() => {
        return testCases.reduce(
            (total, testCase) => total + Number(testCase.points || 0),
            0
        );
    }, [testCases]);

    const visibleTestCount = useMemo(() => {
        return testCases.filter((testCase) => !testCase.hidden).length;
    }, [testCases]);

    const canGoBack = stepIndex > 0;
    const canGoNext = stepIndex < steps.length - 1;

    const openWizard = () => {
        onWizardStepChange(0);
        onWizardOpenChange(true);
    };

    const closeWizard = () => {
        if (!creatingAssessment) {
            onWizardOpenChange(false);
        }
    };

    const goBack = () => {
        if (canGoBack) {
            onWizardStepChange(stepIndex - 1);
        }
    };

    const goNext = () => {
        if (canGoNext) {
            onWizardStepChange(stepIndex + 1);
        }
    };

    const handleCreate = async (event) => {
        const created = await onCreateAssessment(event);

        if (created) {
            onWizardOpenChange(false);
            onWizardStepChange(0);
        }
    };

    return (
        <>
            <div className="form-card compact-form-card assessment-create-launch-card">
                <div>
                    <p className="eyebrow">Assessment Builder</p>
                    <h2>Create Assessment</h2>
                    <p>
                        Build manually or generate a draft with AI, then review and
                        edit before saving.
                    </p>
                </div>

                <div className="assessment-launch-actions">
                    <button
                        type="button"
                        className="primary-button"
                        onClick={openWizard}
                    >
                        Create Manually
                    </button>

                    <button
                        type="button"
                        className="secondary-button"
                        onClick={onGenerateWithAi}
                    >
                        Generate with AI
                    </button>
                </div>
            </div>

            {open && (
                <div className="modal-backdrop">
                    <div className="modal-card assessment-wizard-modal">
                        <div className="modal-header">
                            <div>
                                <h3>Create Assessment</h3>
                                <p>
                                    Step {stepIndex + 1} of {steps.length}:{" "}
                                    {steps[stepIndex]}
                                </p>
                            </div>

                            <button
                                type="button"
                                className="icon-button"
                                onClick={closeWizard}
                                disabled={creatingAssessment}
                                aria-label="Close assessment builder"
                            >
                                x
                            </button>
                        </div>

                        <div className="wizard-steps">
                            {steps.map((step, index) => (
                                <button
                                    key={step}
                                    type="button"
                                    className={`wizard-step ${index === stepIndex ? "active" : ""
                                        } ${index < stepIndex ? "done" : ""}`}
                                    onClick={() => onWizardStepChange(index)}
                                    disabled={creatingAssessment}
                                >
                                    <span>{index + 1}</span>
                                    {step}
                                </button>
                            ))}
                        </div>

                        <form onSubmit={handleCreate} className="assessment-wizard-form">
                            {stepIndex === 0 && (
                                <WizardStepCard
                                    title="Assessment basics"
                                    subtitle="Choose the assessment type, language, and scoring."
                                >
                                    <label>Title</label>
                                    <input
                                        name="title"
                                        value={assessmentForm.title}
                                        onChange={onAssessmentChange}
                                        required
                                        placeholder="Java Arrays Screening Challenge"
                                    />

                                    <label>Description</label>
                                    <input
                                        name="description"
                                        value={assessmentForm.description}
                                        onChange={onAssessmentChange}
                                        placeholder="Short description for admins"
                                    />

                                    <div className="two-column-form">
                                        <div>
                                            <label>Type</label>
                                            <select
                                                name="type"
                                                value={assessmentForm.type}
                                                onChange={onAssessmentChange}
                                            >
                                                <option value="CODING_CHALLENGE">
                                                    Coding Challenge
                                                </option>
                                                <option value="QUIZ">Quiz</option>
                                            </select>
                                        </div>

                                        {isCodingChallenge && (
                                            <div>
                                                <label>Language</label>
                                                <select
                                                    name="language"
                                                    value={assessmentForm.language}
                                                    onChange={onAssessmentChange}
                                                >
                                                    <option value="JAVA">Java</option>
                                                    <option value="JAVASCRIPT">
                                                        JavaScript
                                                    </option>
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
                                </WizardStepCard>
                            )}

                            {stepIndex === 1 && (
                                <WizardStepCard
                                    title="Prompt and starter code"
                                    subtitle={
                                        isCodingChallenge
                                            ? "Write clear candidate instructions and provide runnable starter code."
                                            : "Write the quiz prompt candidates will answer."
                                    }
                                >
                                    <label>Prompt</label>
                                    <textarea
                                        name="prompt"
                                        rows="7"
                                        value={assessmentForm.prompt}
                                        onChange={onAssessmentChange}
                                        required
                                        placeholder="Explain the task clearly for candidates."
                                    />

                                    {isCodingChallenge && (
                                        <>
                                            <label>Starter Code</label>
                                            <textarea
                                                name="starterCode"
                                                rows="12"
                                                className="code-textarea"
                                                value={assessmentForm.starterCode}
                                                onChange={onAssessmentChange}
                                                placeholder="Provide complete runnable starter code."
                                            />

                                            <label>Legacy Expected Output</label>
                                            <textarea
                                                name="expectedOutput"
                                                rows="2"
                                                value={assessmentForm.expectedOutput}
                                                onChange={onAssessmentChange}
                                                placeholder="Optional fallback for old single-output grading"
                                            />
                                        </>
                                    )}
                                </WizardStepCard>
                            )}

                            {stepIndex === 2 && (
                                <WizardStepCard
                                    title="Test cases"
                                    subtitle={
                                        isCodingChallenge
                                            ? "Visible cases are shown to candidates. Hidden cases are used only for final grading."
                                            : "Quiz assessments do not use coding test cases."
                                    }
                                >
                                    {!isCodingChallenge && (
                                        <div className="info-box">
                                            Test cases are only required for coding
                                            challenges.
                                        </div>
                                    )}

                                    {isCodingChallenge && (
                                        <>
                                            <div className="test-case-summary-row">
                                                <span>
                                                    Total points:{" "}
                                                    <strong>
                                                        {totalTestPoints}/
                                                        {assessmentForm.maxScore || 0}
                                                    </strong>
                                                </span>

                                                <span>
                                                    Visible cases:{" "}
                                                    <strong>{visibleTestCount}</strong>
                                                </span>

                                                <button
                                                    type="button"
                                                    className="secondary-button small-button"
                                                    onClick={onAddAssessmentTestCase}
                                                >
                                                    Add Test Case
                                                </button>
                                            </div>

                                            {totalTestPoints !==
                                                Number(assessmentForm.maxScore || 0) && (
                                                    <div className="warning-box compact-warning-box">
                                                        Test case points should add up to the
                                                        max score.
                                                    </div>
                                                )}

                                            {visibleTestCount === 0 && (
                                                <div className="warning-box compact-warning-box">
                                                    Add at least one visible sample test
                                                    case.
                                                </div>
                                            )}

                                            <div className="test-case-section wizard-test-case-section">
                                                {testCases.map((testCase, index) => (
                                                    <div
                                                        className="test-case-card"
                                                        key={index}
                                                    >
                                                        <div className="test-case-card-header">
                                                            <strong>
                                                                Test Case {index + 1}
                                                            </strong>

                                                            <button
                                                                type="button"
                                                                className="secondary-button small-button"
                                                                onClick={() =>
                                                                    onRemoveAssessmentTestCase(
                                                                        index
                                                                    )
                                                                }
                                                                disabled={
                                                                    testCases.length === 1
                                                                }
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>

                                                        <label>Name</label>
                                                        <input
                                                            value={testCase.name || ""}
                                                            onChange={(event) =>
                                                                onAssessmentTestCaseChange(
                                                                    index,
                                                                    "name",
                                                                    event.target.value
                                                                )
                                                            }
                                                            placeholder="Sample case"
                                                        />

                                                        <label>Input</label>
                                                        <textarea
                                                            rows="4"
                                                            value={testCase.input || ""}
                                                            onChange={(event) =>
                                                                onAssessmentTestCaseChange(
                                                                    index,
                                                                    "input",
                                                                    event.target.value
                                                                )
                                                            }
                                                            placeholder="Example stdin input"
                                                        />

                                                        <label>Expected Output</label>
                                                        <textarea
                                                            rows="4"
                                                            value={
                                                                testCase.expectedOutput || ""
                                                            }
                                                            onChange={(event) =>
                                                                onAssessmentTestCaseChange(
                                                                    index,
                                                                    "expectedOutput",
                                                                    event.target.value
                                                                )
                                                            }
                                                            placeholder="Exact stdout expected"
                                                            required
                                                        />

                                                        <div className="two-column-form">
                                                            <div>
                                                                <label>Points</label>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    value={testCase.points ?? 0}
                                                                    onChange={(event) =>
                                                                        onAssessmentTestCaseChange(
                                                                            index,
                                                                            "points",
                                                                            event.target.value
                                                                        )
                                                                    }
                                                                />
                                                            </div>

                                                            <label className="checkbox-field">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={Boolean(
                                                                        testCase.hidden
                                                                    )}
                                                                    onChange={(event) =>
                                                                        onAssessmentTestCaseChange(
                                                                            index,
                                                                            "hidden",
                                                                            event.target.checked
                                                                        )
                                                                    }
                                                                />
                                                                Hidden test case
                                                            </label>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </WizardStepCard>
                            )}

                            {stepIndex === 3 && (
                                <WizardStepCard
                                    title="Review and create"
                                    subtitle="Review the draft before saving it to your assessment library."
                                >
                                    <div className="review-grid">
                                        <ReviewItem label="Title" value={assessmentForm.title} />
                                        <ReviewItem label="Type" value={assessmentForm.type} />
                                        <ReviewItem
                                            label="Language"
                                            value={assessmentForm.language}
                                        />
                                        <ReviewItem
                                            label="Max Score"
                                            value={assessmentForm.maxScore}
                                        />
                                        <ReviewItem
                                            label="Test Cases"
                                            value={
                                                isCodingChallenge
                                                    ? `${testCases.length} total, ${visibleTestCount} visible`
                                                    : "Not applicable"
                                            }
                                        />
                                        <ReviewItem
                                            label="Total Test Points"
                                            value={
                                                isCodingChallenge
                                                    ? `${totalTestPoints}/${assessmentForm.maxScore || 0
                                                    }`
                                                    : "Not applicable"
                                            }
                                        />
                                    </div>

                                    <div className="review-block">
                                        <strong>Prompt</strong>
                                        <p>{assessmentForm.prompt || "No prompt provided"}</p>
                                    </div>

                                    {isCodingChallenge && (
                                        <div className="review-block">
                                            <strong>Starter Code</strong>
                                            <pre>
                                                {assessmentForm.starterCode ||
                                                    "No starter code provided"}
                                            </pre>
                                        </div>
                                    )}
                                </WizardStepCard>
                            )}

                            <div className="wizard-actions">
                                <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={canGoBack ? goBack : closeWizard}
                                    disabled={creatingAssessment}
                                >
                                    {canGoBack ? "Back" : "Cancel"}
                                </button>

                                <div className="wizard-actions-right">
                                    {canGoNext && (
                                        <button
                                            type="button"
                                            className="primary-button"
                                            onClick={goNext}
                                            disabled={creatingAssessment}
                                        >
                                            Next
                                        </button>
                                    )}

                                    {!canGoNext && (
                                        <button
                                            className="primary-button"
                                            type="submit"
                                            disabled={creatingAssessment}
                                        >
                                            {creatingAssessment
                                                ? "Creating..."
                                                : "Create Assessment"}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

function WizardStepCard({ title, subtitle, children }) {
    return (
        <div className="wizard-step-card">
            <div className="wizard-step-card-header">
                <h4>{title}</h4>
                <p>{subtitle}</p>
            </div>

            <div className="wizard-step-card-body">{children}</div>
        </div>
    );
}

function ReviewItem({ label, value }) {
    return (
        <div className="review-item">
            <span>{label}</span>
            <strong>{value || "-"}</strong>
        </div>
    );
}

export default AssessmentCreateForm;
