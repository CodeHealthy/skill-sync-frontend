import { useMemo } from "react";
import {
    ASSESSMENT_QUESTION_TYPES,
    createDefaultOption,
    createDefaultQuestion,
    createDefaultSection,
    createDefaultTestCase,
    getAssessmentQuestions,
    getScoreBreakdown,
    normalizeQuestionPatch,
    summarizeQuestionMix,
} from "../../features/assessments/assessmentFormUtils";

const steps = ["Basics", "Sections", "Review"];

function AssessmentCreateForm({
    assessmentForm,
    creatingAssessment,
    canCreateAssessment = true,
    canUseAiGeneration = true,
    wizardOpen,
    wizardStep,
    onWizardOpenChange,
    onWizardStepChange,
    onGenerateWithAi,
    onAssessmentChange,
    onAssessmentPatch,
    onCreateAssessment,
}) {
    const sections = useMemo(
        () => assessmentForm.sections || [],
        [assessmentForm.sections]
    );
    const questions = useMemo(() => getAssessmentQuestions(sections), [sections]);
    const scoreBreakdown = useMemo(() => getScoreBreakdown(sections), [sections]);
    const maxScore = scoreBreakdown.total;

    const canGoBack = wizardStep > 0;
    const canGoNext = wizardStep < steps.length - 1;

    const openWizard = () => {
        onWizardStepChange(0);
        onWizardOpenChange(true);
    };

    const closeWizard = () => {
        if (!creatingAssessment) {
            onWizardOpenChange(false);
        }
    };

    const patchForm = (updater) => {
        onAssessmentPatch(updater);
    };

    const addSection = () => {
        patchForm((current) => ({
            ...current,
            sections: [
                ...(current.sections || []),
                createDefaultSection((current.sections || []).length + 1),
            ],
        }));
    };

    const updateSection = (sectionIndex, patch) => {
        patchForm((current) => ({
            ...current,
            sections: (current.sections || []).map((section, index) =>
                index === sectionIndex ? { ...section, ...patch } : section
            ),
        }));
    };

    const removeSection = (sectionIndex) => {
        patchForm((current) => ({
            ...current,
            sections: (current.sections || []).filter((_, index) => index !== sectionIndex),
        }));
    };

    const addQuestion = (sectionIndex, type = "MULTIPLE_CHOICE") => {
        patchForm((current) => ({
            ...current,
            sections: (current.sections || []).map((section, index) => {
                if (index !== sectionIndex) {
                    return section;
                }

                return {
                    ...section,
                    questions: [
                        ...(section.questions || []),
                        createDefaultQuestion((section.questions || []).length + 1, type),
                    ],
                };
            }),
        }));
    };

    const updateQuestion = (sectionIndex, questionIndex, patch) => {
        patchForm((current) => ({
            ...current,
            sections: (current.sections || []).map((section, index) => {
                if (index !== sectionIndex) {
                    return section;
                }

                return {
                    ...section,
                    questions: (section.questions || []).map((question, qIndex) =>
                        qIndex === questionIndex ? normalizeQuestionPatch(question, patch) : question
                    ),
                };
            }),
        }));
    };

    const removeQuestion = (sectionIndex, questionIndex) => {
        patchForm((current) => ({
            ...current,
            sections: (current.sections || []).map((section, index) => {
                if (index !== sectionIndex) {
                    return section;
                }

                return {
                    ...section,
                    questions: (section.questions || []).filter((_, qIndex) => qIndex !== questionIndex),
                };
            }),
        }));
    };

    const updateOption = (sectionIndex, questionIndex, optionIndex, patch) => {
        updateQuestion(sectionIndex, questionIndex, {
            options: sections[sectionIndex].questions[questionIndex].options.map((option, index) =>
                index === optionIndex ? { ...option, ...patch } : option
            ),
        });
    };

    const markCorrectOption = (sectionIndex, questionIndex, optionIndex) => {
        updateQuestion(sectionIndex, questionIndex, {
            options: sections[sectionIndex].questions[questionIndex].options.map((option, index) => ({
                ...option,
                correct: index === optionIndex,
            })),
        });
    };

    const addOption = (sectionIndex, questionIndex) => {
        const optionCount = sections[sectionIndex].questions[questionIndex].options.length;
        updateQuestion(sectionIndex, questionIndex, {
            options: [
                ...sections[sectionIndex].questions[questionIndex].options,
                createDefaultOption(optionCount + 1, false),
            ],
        });
    };

    const removeOption = (sectionIndex, questionIndex, optionIndex) => {
        const options = sections[sectionIndex].questions[questionIndex].options.filter(
            (_, index) => index !== optionIndex
        );

        updateQuestion(sectionIndex, questionIndex, {
            options: options.some((option) => option.correct)
                ? options
                : options.map((option, index) => ({ ...option, correct: index === 0 })),
        });
    };

    const updateTestCase = (sectionIndex, questionIndex, testCaseIndex, patch) => {
        updateQuestion(sectionIndex, questionIndex, {
            testCases: sections[sectionIndex].questions[questionIndex].testCases.map((testCase, index) =>
                index === testCaseIndex ? { ...testCase, ...patch } : testCase
            ),
        });
    };

    const addTestCase = (sectionIndex, questionIndex) => {
        const question = sections[sectionIndex].questions[questionIndex];
        updateQuestion(sectionIndex, questionIndex, {
            testCases: [
                ...(question.testCases || []),
                createDefaultTestCase((question.testCases || []).length + 1, Number(question.points || 10)),
            ],
        });
    };

    const removeTestCase = (sectionIndex, questionIndex, testCaseIndex) => {
        updateQuestion(sectionIndex, questionIndex, {
            testCases: sections[sectionIndex].questions[questionIndex].testCases.filter(
                (_, index) => index !== testCaseIndex
            ),
        });
    };

    return (
        <>
            <div className="form-card compact-form-card assessment-create-launch-card">
                <div>
                    <p className="eyebrow">Assessment Builder</p>
                    <h2>Create Assessment</h2>
                    <p>
                        Build sections with multiple choice, short-answer, and coding
                        questions, then save as a draft or publish for assignment.
                    </p>
                    {!canCreateAssessment && (
                        <div className="warning-box compact-warning-box">
                            Your current plan has reached its active assessment limit.
                        </div>
                    )}
                </div>

                <div className="assessment-launch-actions">
                    <button
                        type="button"
                        className="primary-button"
                        onClick={openWizard}
                        disabled={!canCreateAssessment}
                    >
                        Open Builder
                    </button>

                    <button
                        type="button"
                        className="secondary-button"
                        onClick={onGenerateWithAi}
                        disabled={!canCreateAssessment || !canUseAiGeneration}
                    >
                        Generate with AI
                    </button>
                </div>
            </div>

            {wizardOpen && (
                <div className="modal-backdrop">
                    <div className="modal-card assessment-wizard-modal assessment-builder-modal">
                        <div className="modal-header">
                            <div>
                                <h3>Assessment Builder</h3>
                                <p>
                                    Step {wizardStep + 1} of {steps.length}: {steps[wizardStep]}
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
                                    className={`wizard-step ${index === wizardStep ? "active" : ""} ${index < wizardStep ? "done" : ""}`}
                                    onClick={() => onWizardStepChange(index)}
                                    disabled={creatingAssessment}
                                >
                                    <span>{index + 1}</span>
                                    {step}
                                </button>
                            ))}
                        </div>

                        <form onSubmit={onCreateAssessment} className="assessment-wizard-form">
                            {wizardStep === 0 && (
                                <WizardStepCard
                                    title="Assessment basics"
                                    subtitle="Set the role, timing, scoring, and publish state."
                                >
                                    <div className="form-grid">
                                        <label>
                                            Title
                                            <input
                                                name="title"
                                                value={assessmentForm.title}
                                                onChange={onAssessmentChange}
                                                required
                                                placeholder="Frontend Engineer Screening"
                                            />
                                        </label>

                                        <label>
                                            Role
                                            <input
                                                name="roleTitle"
                                                value={assessmentForm.roleTitle || ""}
                                                onChange={onAssessmentChange}
                                                placeholder="Frontend Engineer"
                                            />
                                        </label>

                                        <label>
                                            Status
                                            <select
                                                name="status"
                                                value={assessmentForm.status || "PUBLISHED"}
                                                onChange={onAssessmentChange}
                                            >
                                                <option value="DRAFT">Draft</option>
                                                <option value="PUBLISHED">Published</option>
                                                <option value="ARCHIVED">Archived</option>
                                            </select>
                                        </label>

                                        <label>
                                            Time Limit
                                            <input
                                                name="durationMinutes"
                                                type="number"
                                                min="1"
                                                max="480"
                                                value={assessmentForm.durationMinutes || ""}
                                                onChange={onAssessmentChange}
                                                placeholder="Minutes"
                                            />
                                        </label>

                                        <label className="form-field-full">
                                            Description
                                            <textarea
                                                name="description"
                                                rows="3"
                                                value={assessmentForm.description}
                                                onChange={onAssessmentChange}
                                                placeholder="Internal description for recruiters"
                                            />
                                        </label>
                                    </div>
                                </WizardStepCard>
                            )}

                            {wizardStep === 1 && (
                                <WizardStepCard
                                    title="Sections and questions"
                                    subtitle="Mix question types and scoring inside one assessment."
                                >
                                    <div className="builder-toolbar">
                                        <div>
                                            <strong>{sections.length} sections</strong>
                                            <span>{questions.length} questions, {maxScore} total points</span>
                                        </div>
                                        <button type="button" className="secondary-button small-button" onClick={addSection}>
                                            Add Section
                                        </button>
                                    </div>

                                    <div className="builder-section-list">
                                        {sections.map((section, sectionIndex) => (
                                            <section className="builder-section" key={section.id || sectionIndex}>
                                                <div className="builder-section-header">
                                                    <div className="form-grid">
                                                        <label>
                                                            Section Title
                                                            <input
                                                                value={section.title || ""}
                                                                onChange={(event) => updateSection(sectionIndex, { title: event.target.value })}
                                                            />
                                                        </label>
                                                        <label>
                                                            Section Time Limit
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                max="480"
                                                                value={section.timeLimitMinutes || ""}
                                                                onChange={(event) => updateSection(sectionIndex, { timeLimitMinutes: event.target.value })}
                                                                placeholder="Optional minutes"
                                                            />
                                                        </label>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        className="secondary-button small-button"
                                                        onClick={() => removeSection(sectionIndex)}
                                                        disabled={sections.length === 1}
                                                    >
                                                        Remove Section
                                                    </button>
                                                </div>

                                                <label>
                                                    Section Description
                                                    <textarea
                                                        rows="2"
                                                        value={section.description || ""}
                                                        onChange={(event) => updateSection(sectionIndex, { description: event.target.value })}
                                                        placeholder="Optional section context"
                                                    />
                                                </label>

                                                <div className="question-add-row">
                                                    <button type="button" className="secondary-button small-button" onClick={() => addQuestion(sectionIndex, "MULTIPLE_CHOICE")}>
                                                        Add Multiple Choice
                                                    </button>
                                                    <button type="button" className="secondary-button small-button" onClick={() => addQuestion(sectionIndex, "SHORT_ANSWER")}>
                                                        Add Short Answer
                                                    </button>
                                                    <button type="button" className="secondary-button small-button" onClick={() => addQuestion(sectionIndex, "CODING_CHALLENGE")}>
                                                        Add Coding
                                                    </button>
                                                </div>

                                                {(section.questions || []).map((question, questionIndex) => (
                                                    <QuestionEditor
                                                        key={question.id || questionIndex}
                                                        question={question}
                                                        sectionIndex={sectionIndex}
                                                        questionIndex={questionIndex}
                                                        canRemove={(section.questions || []).length > 1}
                                                        onUpdateQuestion={updateQuestion}
                                                        onRemoveQuestion={removeQuestion}
                                                        onUpdateOption={updateOption}
                                                        onMarkCorrectOption={markCorrectOption}
                                                        onAddOption={addOption}
                                                        onRemoveOption={removeOption}
                                                        onUpdateTestCase={updateTestCase}
                                                        onAddTestCase={addTestCase}
                                                        onRemoveTestCase={removeTestCase}
                                                    />
                                                ))}
                                            </section>
                                        ))}
                                    </div>
                                </WizardStepCard>
                            )}

                            {wizardStep === 2 && (
                                <WizardStepCard
                                    title="Review and save"
                                    subtitle="Confirm the structure before creating this assessment."
                                >
                                    <div className="review-grid">
                                        <ReviewItem label="Title" value={assessmentForm.title} />
                                        <ReviewItem label="Status" value={assessmentForm.status} />
                                        <ReviewItem label="Role" value={assessmentForm.roleTitle || "-"} />
                                        <ReviewItem label="Duration" value={assessmentForm.durationMinutes ? `${assessmentForm.durationMinutes} min` : "No limit"} />
                                        <ReviewItem label="Sections" value={sections.length} />
                                        <ReviewItem label="Questions" value={questions.length} />
                                        <ReviewItem label="Max Score" value={maxScore} />
                                    </div>

                                    <div className="review-block">
                                        <strong>Question mix</strong>
                                        <p>{summarizeQuestionMix(questions)}</p>
                                    </div>

                                    <div className="review-block">
                                        <strong>Scoring split</strong>
                                        <p>
                                            Coding {scoreBreakdown.coding} pts, multiple choice {scoreBreakdown.multipleChoice} pts,
                                            short answer {scoreBreakdown.shortAnswer} pts.
                                        </p>
                                    </div>
                                </WizardStepCard>
                            )}

                            <div className="wizard-actions">
                                <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={canGoBack ? () => onWizardStepChange(wizardStep - 1) : closeWizard}
                                    disabled={creatingAssessment}
                                >
                                    {canGoBack ? "Back" : "Cancel"}
                                </button>

                                <div className="wizard-actions-right">
                                    {canGoNext && (
                                        <button
                                            type="button"
                                            className="primary-button"
                                            onClick={() => onWizardStepChange(wizardStep + 1)}
                                            disabled={creatingAssessment}
                                        >
                                            Next
                                        </button>
                                    )}

                                    {!canGoNext && (
                                        <button className="primary-button" type="submit" disabled={creatingAssessment}>
                                            {creatingAssessment ? "Saving..." : "Save Assessment"}
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

function QuestionEditor({
    question,
    sectionIndex,
    questionIndex,
    canRemove,
    onUpdateQuestion,
    onRemoveQuestion,
    onUpdateOption,
    onMarkCorrectOption,
    onAddOption,
    onRemoveOption,
    onUpdateTestCase,
    onAddTestCase,
    onRemoveTestCase,
}) {
    const isMultipleChoice = question.type === ASSESSMENT_QUESTION_TYPES.MULTIPLE_CHOICE;
    const isCoding = question.type === ASSESSMENT_QUESTION_TYPES.CODING_CHALLENGE;

    return (
        <article className="builder-question">
            <div className="builder-question-header">
                <div className="form-grid">
                    <label>
                        Question Title
                        <input
                            value={question.title || ""}
                            onChange={(event) => onUpdateQuestion(sectionIndex, questionIndex, { title: event.target.value })}
                        />
                    </label>
                    <label>
                        Question Type
                        <select
                            value={question.type}
                            onChange={(event) => onUpdateQuestion(sectionIndex, questionIndex, { type: event.target.value })}
                        >
                            <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                            <option value="SHORT_ANSWER">Short Answer</option>
                            <option value="CODING_CHALLENGE">Coding Challenge</option>
                        </select>
                    </label>
                    <label>
                        Points
                        <input
                            type="number"
                            min="1"
                            value={question.points || 1}
                            onChange={(event) => onUpdateQuestion(sectionIndex, questionIndex, { points: event.target.value })}
                        />
                    </label>
                </div>

                <button
                    type="button"
                    className="secondary-button small-button"
                    onClick={() => onRemoveQuestion(sectionIndex, questionIndex)}
                    disabled={!canRemove}
                >
                    Remove Question
                </button>
            </div>

            <label>
                Candidate Prompt
                <textarea
                    rows="4"
                    value={question.prompt || ""}
                    onChange={(event) => onUpdateQuestion(sectionIndex, questionIndex, { prompt: event.target.value })}
                    placeholder="Write the candidate-facing question."
                    required
                />
            </label>

            {isMultipleChoice && (
                <div className="builder-nested-block">
                    <div className="builder-toolbar">
                        <strong>Options</strong>
                        <button type="button" className="secondary-button small-button" onClick={() => onAddOption(sectionIndex, questionIndex)}>
                            Add Option
                        </button>
                    </div>
                    {(question.options || []).map((option, optionIndex) => (
                        <div className="option-editor-row" key={option.id || optionIndex}>
                            <input
                                value={option.text || ""}
                                onChange={(event) => onUpdateOption(sectionIndex, questionIndex, optionIndex, { text: event.target.value })}
                                placeholder={`Option ${optionIndex + 1}`}
                            />
                            <label className="checkbox-field compact-checkbox-field">
                                <input
                                    type="radio"
                                    checked={Boolean(option.correct)}
                                    onChange={() => onMarkCorrectOption(sectionIndex, questionIndex, optionIndex)}
                                />
                                Correct
                            </label>
                            <button
                                type="button"
                                className="secondary-button small-button"
                                onClick={() => onRemoveOption(sectionIndex, questionIndex, optionIndex)}
                                disabled={(question.options || []).length <= 2}
                            >
                                Remove
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {!isMultipleChoice && !isCoding && (
                <label>
                    Reviewer Notes / Expected Answer
                    <textarea
                        rows="3"
                        value={question.correctAnswer || ""}
                        onChange={(event) => onUpdateQuestion(sectionIndex, questionIndex, { correctAnswer: event.target.value })}
                        placeholder="Optional notes for manual grading"
                    />
                </label>
            )}

            {isCoding && (
                <div className="builder-nested-block">
                    <div className="form-grid">
                        <label>
                            Language
                            <select
                                value={question.language || "JAVA"}
                                onChange={(event) => onUpdateQuestion(sectionIndex, questionIndex, { language: event.target.value })}
                            >
                                <option value="JAVA">Java</option>
                                <option value="JAVASCRIPT">JavaScript</option>
                                <option value="PYTHON">Python</option>
                            </select>
                        </label>
                        <label>
                            Legacy Expected Output
                            <input
                                value={question.expectedOutput || ""}
                                onChange={(event) => onUpdateQuestion(sectionIndex, questionIndex, { expectedOutput: event.target.value })}
                            />
                        </label>
                    </div>

                    <label>
                        Starter Code
                        <textarea
                            rows="8"
                            className="code-textarea"
                            value={question.starterCode || ""}
                            onChange={(event) => onUpdateQuestion(sectionIndex, questionIndex, { starterCode: event.target.value })}
                        />
                    </label>

                    <div className="builder-toolbar">
                        <strong>Test Cases</strong>
                        <button type="button" className="secondary-button small-button" onClick={() => onAddTestCase(sectionIndex, questionIndex)}>
                            Add Test Case
                        </button>
                    </div>

                    {(question.testCases || []).map((testCase, testCaseIndex) => (
                        <div className="test-case-card" key={`${question.id}-${testCaseIndex}`}>
                            <div className="test-case-card-header">
                                <strong>Test Case {testCaseIndex + 1}</strong>
                                <button
                                    type="button"
                                    className="secondary-button small-button"
                                    onClick={() => onRemoveTestCase(sectionIndex, questionIndex, testCaseIndex)}
                                    disabled={(question.testCases || []).length <= 1}
                                >
                                    Remove
                                </button>
                            </div>
                            <div className="form-grid">
                                <label>
                                    Name
                                    <input
                                        value={testCase.name || ""}
                                        onChange={(event) => onUpdateTestCase(sectionIndex, questionIndex, testCaseIndex, { name: event.target.value })}
                                    />
                                </label>
                                <label>
                                    Points
                                    <input
                                        type="number"
                                        min="0"
                                        value={testCase.points ?? 0}
                                        onChange={(event) => onUpdateTestCase(sectionIndex, questionIndex, testCaseIndex, { points: event.target.value })}
                                    />
                                </label>
                            </div>
                            <label>
                                Input
                                <textarea
                                    rows="3"
                                    value={testCase.input || ""}
                                    onChange={(event) => onUpdateTestCase(sectionIndex, questionIndex, testCaseIndex, { input: event.target.value })}
                                />
                            </label>
                            <label>
                                Expected Output
                                <textarea
                                    rows="3"
                                    value={testCase.expectedOutput || ""}
                                    onChange={(event) => onUpdateTestCase(sectionIndex, questionIndex, testCaseIndex, { expectedOutput: event.target.value })}
                                    required
                                />
                            </label>
                            <label className="checkbox-field compact-checkbox-field">
                                <input
                                    type="checkbox"
                                    checked={Boolean(testCase.hidden)}
                                    onChange={(event) => onUpdateTestCase(sectionIndex, questionIndex, testCaseIndex, { hidden: event.target.checked })}
                                />
                                Hidden test case
                            </label>
                        </div>
                    ))}
                </div>
            )}
        </article>
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
