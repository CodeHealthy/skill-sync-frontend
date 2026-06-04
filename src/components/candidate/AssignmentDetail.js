import { useEffect, useMemo, useState } from "react";
import StatusBadge from "../common/StatusBadge";
import DetailItem from "../common/DetailItem";
import CodeBlock from "../common/CodeBlock";
import {
    formatAssessmentType,
    formatDate,
    formatLanguage,
} from "../../utils/formatters";

function AssignmentDetail({
    assignment,
    code,
    answer,
    submittingAssignmentId,
    runningAssignmentId,
    startingAssignmentId,
    runResult,
    onCodeChange,
    onAnswerChange,
    onRunCode,
    onStartAssignment,
    onStartSection,
    onCompleteSection,
    onSubmit,
    onBack,
}) {
    const isCodingChallenge = assignment.assessmentType === "CODING_CHALLENGE";
    const isAssigned = assignment.status === "ASSIGNED";
    const sections = Array.isArray(assignment.sections) ? assignment.sections : [];
    const questions = sections.flatMap((section) => section.questions || []);
    const codingQuestions = questions.filter((question) => question.type === "CODING_CHALLENGE");
    const nonCodingQuestions = sections
        .flatMap((section) => section.questions || [])
        .filter((question) => question.type !== "CODING_CHALLENGE");

    const isSubmitting = submittingAssignmentId === assignment.id;
    const isRunning = runningAssignmentId === assignment.id;
    const isStarting = startingAssignmentId === assignment.id;

    const isAnySubmitting = Boolean(submittingAssignmentId);
    const isAnyRunning = Boolean(runningAssignmentId);
    const isAnyStarting = Boolean(startingAssignmentId);
    const isBusy = isAnySubmitting || isAnyRunning || isAnyStarting;
    const isTimed = Boolean(assignment.timeLimitMinutes);
    const mustStartTimedAssignment = isAssigned && isTimed && !assignment.startedAt;
    const expiresAtMs = useMemo(
        () => (assignment.expiresAt ? new Date(assignment.expiresAt).getTime() : null),
        [assignment.expiresAt]
    );
    const dueAtMs = useMemo(
        () => (assignment.dueAt ? new Date(assignment.dueAt).getTime() : null),
        [assignment.dueAt]
    );
    const [nowMs, setNowMs] = useState(Date.now());
    const [autoSubmitAttempted, setAutoSubmitAttempted] = useState(false);
    const [introAccepted, setIntroAccepted] = useState(false);
    const [activeSectionIndex, setActiveSectionIndex] = useState(0);
    const [sectionStartedAtMs, setSectionStartedAtMs] = useState(Date.now());
    const remainingMs =
        expiresAtMs && Number.isFinite(expiresAtMs)
            ? Math.max(expiresAtMs - nowMs, 0)
            : null;
    const isExpired = remainingMs === 0;
    const isPastDue =
        dueAtMs && Number.isFinite(dueAtMs) && nowMs > dueAtMs;
    const isLocked = Boolean(isExpired || isPastDue);
    const normalizedSections = sections.length > 0
        ? sections
        : [buildLegacySection(assignment, questions)];
    const activeSection = normalizedSections[Math.min(activeSectionIndex, normalizedSections.length - 1)];
    const activeSectionQuestions = activeSection?.questions || [];
    const activeSectionNonCodingQuestions = activeSectionQuestions.filter(
        (question) => question.type !== "CODING_CHALLENGE"
    );
    const activeSectionHasCoding = activeSectionQuestions.some(
        (question) => question.type === "CODING_CHALLENGE"
    ) || (isCodingChallenge && normalizedSections.length === 1);
    const activeSectionAttempt = findSectionAttempt(assignment, activeSection?.id);
    const activeSectionExpiresAtMs = activeSectionAttempt?.expiresAt
        ? new Date(activeSectionAttempt.expiresAt).getTime()
        : null;
    const activeSectionTimeLimitMs = activeSectionExpiresAtMs
        ? activeSectionExpiresAtMs - nowMs
        : activeSection?.timeLimitMinutes
            ? Number(activeSection.timeLimitMinutes) * 60 * 1000
            : null;
    const sectionRemainingMs = activeSectionExpiresAtMs
        ? Math.max(activeSectionExpiresAtMs - nowMs, 0)
        : activeSectionTimeLimitMs
            ? Math.max(activeSectionTimeLimitMs - (nowMs - sectionStartedAtMs), 0)
        : null;
    const isSectionExpired = sectionRemainingMs === 0;

    useEffect(() => {
        setNowMs(Date.now());
        setAutoSubmitAttempted(false);
        setIntroAccepted(Boolean(assignment.startedAt));
    }, [assignment.id, assignment.startedAt]);

    useEffect(() => {
        if (!isAssigned || (!expiresAtMs && !dueAtMs && !activeSectionTimeLimitMs)) {
            return undefined;
        }

        const timer = window.setInterval(() => {
            setNowMs(Date.now());
        }, 1000);

        return () => window.clearInterval(timer);
    }, [activeSectionTimeLimitMs, dueAtMs, expiresAtMs, isAssigned]);

    useEffect(() => {
        if (
            !isAssigned ||
            !assignment.startedAt ||
            !expiresAtMs ||
            remainingMs !== 0 ||
            autoSubmitAttempted ||
            isAnySubmitting
        ) {
            return;
        }

        setAutoSubmitAttempted(true);
        onSubmit(assignment, { autoSubmit: true });
    }, [
        assignment,
        autoSubmitAttempted,
        expiresAtMs,
        isAnySubmitting,
        isAssigned,
        onSubmit,
        remainingMs,
    ]);

    const visibleTestCases = Array.isArray(assignment.testCases)
        ? assignment.testCases.filter((testCase) => !testCase.hidden)
        : [];

    const testCaseResults = Array.isArray(assignment.testCaseResults)
        ? assignment.testCaseResults
        : [];
    const progress = getAssignmentProgress({
        assignment,
        answers: answer || {},
        code,
        nonCodingQuestions,
        codingQuestions,
    });
    const canWork = isAssigned && introAccepted && !mustStartTimedAssignment;

    useEffect(() => {
        setActiveSectionIndex(0);
        setSectionStartedAtMs(Date.now());
    }, [assignment.id]);

    useEffect(() => {
        setSectionStartedAtMs(Date.now());
    }, [activeSectionIndex]);

    useEffect(() => {
        if (!canWork || !activeSection?.id || !onStartSection || activeSectionAttempt) {
            return;
        }

        onStartSection(assignment, activeSection.id);
    }, [activeSection?.id, activeSectionAttempt, assignment, canWork, onStartSection]);

    const goToPreviousSection = () => {
        setActiveSectionIndex((current) => Math.max(current - 1, 0));
    };

    const goToNextSection = async () => {
        if (onCompleteSection && activeSection?.id) {
            await onCompleteSection(assignment, activeSection.id);
        }

        setActiveSectionIndex((current) => Math.min(current + 1, normalizedSections.length - 1));
    };

    return (
        <div className="candidate-session-shell">
            <div className="candidate-session-topbar">
                {onBack && (
                    <button type="button" className="secondary-button" onClick={onBack}>
                        Back to dashboard
                    </button>
                )}
                <div className="detail-status-stack">
                    <StatusBadge value={assignment.status} />
                    <StatusBadge value={assignment.executionStatus || "NOT_RUN"} />
                </div>
            </div>

            <div className="detail-panel-header candidate-detail-header">
                <OrganizationLogo
                    imageUrl={assignment.organizationLogoUrl}
                    name={assignment.organizationName}
                />
                <div>
                    <p className="eyebrow">{assignment.organizationName || "Organization"}</p>
                    <h2>{assignment.assessmentTitle}</h2>
                    {!canWork && <p>{assignment.prompt}</p>}
                </div>
            </div>

            {!canWork && (
                <div className="detail-grid">
                <DetailItem
                    label="Organization"
                    value={assignment.organizationName || "Organization"}
                />
                <DetailItem
                    label="Type"
                    value={formatAssessmentType(assignment.assessmentType)}
                />
                <DetailItem
                    label="Language"
                    value={formatLanguage(assignment.language)}
                />
                <DetailItem
                    label="Assigned At"
                    value={formatDate(assignment.assignedAt)}
                />
                <DetailItem
                    label="Due At"
                    value={formatDate(assignment.dueAt)}
                />
                <DetailItem
                    label="Time Limit"
                    value={
                        assignment.timeLimitMinutes
                            ? `${assignment.timeLimitMinutes} minutes`
                            : "No limit"
                    }
                />
                <DetailItem
                    label="Started At"
                    value={formatDate(assignment.startedAt)}
                />
                <DetailItem
                    label="Expires At"
                    value={formatDate(assignment.expiresAt)}
                />
                <DetailItem
                    label="Submitted At"
                    value={formatDate(assignment.submittedAt)}
                />
                <DetailItem
                    label="Score"
                    value={
                        assignment.score !== null && assignment.score !== undefined
                            ? `${assignment.score}/${assignment.maxScore || 100}`
                            : "Not graded"
                    }
                />
                </div>
            )}

            {isAssigned && !introAccepted && !isPastDue && !isExpired && (
                <AssessmentIntroPanel
                    assignment={assignment}
                    sections={sections}
                    questions={questions}
                    codingQuestions={codingQuestions}
                    nonCodingQuestions={nonCodingQuestions}
                    isStarting={isStarting}
                    isBusy={isBusy}
                    mustStartTimedAssignment={mustStartTimedAssignment}
                    onStart={() => onStartAssignment(assignment)}
                    onContinue={() => setIntroAccepted(true)}
                />
            )}

            {isAssigned && assignment.startedAt && assignment.expiresAt && (
                <div className={isExpired ? "timer-box expired" : "timer-box"}>
                    <strong>
                        {isExpired
                            ? "Time expired"
                            : `Time remaining: ${formatDuration(remainingMs)}`}
                    </strong>
                    <span>Expires at {formatDate(assignment.expiresAt)}</span>
                </div>
            )}

            {isAssigned && isPastDue && (
                <div className="timer-box expired">
                    <strong>Due date passed</strong>
                    <span>Due at {formatDate(assignment.dueAt)}</span>
                </div>
            )}

            {canWork && (
                <AssessmentProgressStrip
                    assignment={assignment}
                    progress={progress}
                    remainingMs={remainingMs}
                    isExpired={isExpired}
                    activeSection={activeSection}
                    sectionRemainingMs={sectionRemainingMs}
                    isSectionExpired={isSectionExpired}
                />
            )}

            {canWork && (
                <div className="candidate-test-workspace">
                    <SectionNavigator
                        sections={normalizedSections}
                        activeSectionIndex={activeSectionIndex}
                        answers={answer || {}}
                        code={code}
                        onSelectSection={setActiveSectionIndex}
                    />

                    <section className="candidate-test-stage">
                        <SectionHeaderPanel
                            section={activeSection}
                            sectionIndex={activeSectionIndex}
                            sectionCount={normalizedSections.length}
                            sectionRemainingMs={sectionRemainingMs}
                            isSectionExpired={isSectionExpired}
                        />

                        {activeSectionHasCoding && visibleTestCases.length > 0 && (
                            <SampleTestCases testCases={visibleTestCases} />
                        )}

                        {activeSectionNonCodingQuestions.length > 0 && (
                            <QuestionAnswerList
                                section={activeSection}
                                questions={activeSectionNonCodingQuestions}
                                answers={answer || {}}
                                disabled={isBusy || isLocked || isSectionExpired}
                                onAnswerChange={(questionId, value) =>
                                    onAnswerChange(assignment.id, {
                                        ...(answer || {}),
                                        [questionId]: value,
                                    })
                                }
                            />
                        )}

                        {activeSectionHasCoding && (
                            <CodingWorkspace
                                assignment={assignment}
                                code={code}
                                isBusy={isBusy}
                                isLocked={isLocked || isSectionExpired}
                                isRunning={isRunning}
                                runResult={runResult}
                                onCodeChange={onCodeChange}
                                onRunCode={onRunCode}
                            />
                        )}

                        <SectionControls
                            assignment={assignment}
                            activeSectionIndex={activeSectionIndex}
                            sectionCount={normalizedSections.length}
                            isBusy={isBusy}
                            isLocked={isLocked}
                            isSubmitting={isSubmitting}
                            onPrevious={goToPreviousSection}
                            onNext={goToNextSection}
                            onSubmit={() => onSubmit(assignment)}
                        />

                        <SubmissionReadiness progress={progress} isCodingChallenge={isCodingChallenge} />
                    </section>
                </div>
            )}

            {!isAssigned && (
                <>
                    <SubmittedAnswersPanel assignment={assignment} />
                    <CodeBlock title="Your Code" value={assignment.submittedCode} />

                    {testCaseResults.length === 0 && (
                        <>
                            <CodeBlock title="Actual Output" value={assignment.actualOutput} />
                            <CodeBlock title="Execution Error" value={assignment.executionError} />
                        </>
                    )}

                    {testCaseResults.length > 0 && (
                        <div className="test-case-preview-section">
                            <h4>Grading Test Results</h4>
                            <p className="muted-cell">
                                Hidden test cases show pass/fail only. Details are hidden.
                            </p>

                            <div className="test-case-result-list">
                                {testCaseResults.map((result, index) => (
                                    <TestCaseResultCard
                                        key={`${result.name}-${index}`}
                                        result={result}
                                        index={index}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {assignment.status === "SUBMITTED" && (
                <div className="pending-grade-box">
                    <strong>Submitted for review</strong>
                    <p>Thank you for submitting your test, your submission is waiting for admin review.</p>
                </div>
            )}

            {assignment.status === "GRADED" && (
                <div className="graded-box">
                    <h4>Result</h4>
                    <p>
                        <strong>Score:</strong>{" "}
                        {assignment.score !== null && assignment.score !== undefined
                            ? `${assignment.score}/${assignment.maxScore || 100}`
                            : "Not available"}
                    </p>
                    <p>
                        <strong>Feedback:</strong>{" "}
                        {assignment.feedback || "No feedback provided"}
                    </p>
                </div>
            )}
        </div>
    );
}

function OrganizationLogo({ imageUrl, name }) {
    const initials = (name || "SS").slice(0, 2).toUpperCase();

    return (
        <span className="candidate-organization-logo large" aria-hidden="true">
            {imageUrl ? <img src={imageUrl} alt="" /> : initials}
        </span>
    );
}

function AssessmentIntroPanel({
    assignment,
    sections,
    questions,
    codingQuestions,
    nonCodingQuestions,
    isStarting,
    isBusy,
    mustStartTimedAssignment,
    onStart,
    onContinue,
}) {
    return (
        <section className="candidate-assessment-intro">
            <div className="candidate-intro-header">
                <div>
                    <span className="eyebrow">Before You Begin</span>
                    <h3>{assignment.assessmentTitle}</h3>
                    <p>
                        Review the structure and rules before entering the assessment workspace.
                    </p>
                </div>
                <div className="candidate-intro-score">
                    <strong>{assignment.maxScore || 100}</strong>
                    <span>max score</span>
                </div>
            </div>

            <div className="candidate-intro-metrics">
                <IntroMetric label="Sections" value={sections.length || 1} />
                <IntroMetric label="Questions" value={questions.length || 1} />
                <IntroMetric label="Coding" value={codingQuestions.length} />
                <IntroMetric label="Manual Review" value={nonCodingQuestions.filter((question) => question.type === "SHORT_ANSWER").length} />
                <IntroMetric
                    label="Time Limit"
                    value={assignment.timeLimitMinutes ? `${assignment.timeLimitMinutes} min` : "No limit"}
                />
            </div>

            <div className="candidate-rules-grid">
                <RuleItem title="Work independently" text="Use the instructions provided in the assessment. Do not submit someone else's work." />
                <RuleItem title="Watch the timer" text="Timed assessments submit automatically when time expires." />
                <RuleItem title="Answer all sections" text="MCQs may be scored automatically. Short answers are reviewed manually." />
                <RuleItem title="Submit once" text="Review your answers carefully before final submission." />
            </div>

            {sections.length > 0 && (
                <div className="candidate-intro-outline">
                    <h4>Assessment outline</h4>
                    {sections.map((section, index) => (
                        <div className="candidate-outline-row" key={section.id || index}>
                            <span>{index + 1}</span>
                            <div>
                                <strong>{section.title || `Section ${index + 1}`}</strong>
                                <small>
                                    {(section.questions || []).length} questions
                                    {section.timeLimitMinutes ? `, ${section.timeLimitMinutes} min` : ""}
                                </small>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="candidate-intro-actions">
                <button
                    type="button"
                    className="primary-button"
                    onClick={mustStartTimedAssignment ? onStart : onContinue}
                    disabled={isBusy}
                >
                    {isStarting
                        ? "Starting..."
                        : mustStartTimedAssignment
                            ? "Start Assessment"
                            : "Enter Assessment"}
                </button>
            </div>
        </section>
    );
}

function SectionNavigator({
    sections,
    activeSectionIndex,
    answers,
    code,
    onSelectSection,
}) {
    return (
        <aside className="candidate-section-rail">
            <span className="eyebrow">Test Sections</span>
            {sections.map((section, index) => {
                const questions = section.questions || [];
                const completed = getSectionCompletedCount(section, answers, code);
                const total = Math.max(questions.length, 1);

                return (
                    <button
                        type="button"
                        className={activeSectionIndex === index ? "candidate-section-step active" : "candidate-section-step"}
                        key={section.id || index}
                        onClick={() => onSelectSection(index)}
                    >
                        <span>{index + 1}</span>
                        <div>
                            <strong>{section.title || `Section ${index + 1}`}</strong>
                            <small>
                                {completed}/{total} complete
                                {section.timeLimitMinutes ? `, ${section.timeLimitMinutes} min` : ""}
                            </small>
                        </div>
                    </button>
                );
            })}
        </aside>
    );
}

function SectionHeaderPanel({
    section,
    sectionIndex,
    sectionCount,
    sectionRemainingMs,
    isSectionExpired,
}) {
    return (
        <div className="candidate-section-stage-header">
            <div>
                <span className="eyebrow">Section {sectionIndex + 1} of {sectionCount}</span>
                <h3>{section?.title || `Section ${sectionIndex + 1}`}</h3>
                {section?.description && <p>{section.description}</p>}
            </div>

            <div className={isSectionExpired ? "section-timer-pill expired" : "section-timer-pill"}>
                <span>Section timer</span>
                <strong>
                    {sectionRemainingMs === null
                        ? "No limit"
                        : isSectionExpired
                            ? "Expired"
                            : formatDuration(sectionRemainingMs)}
                </strong>
            </div>
        </div>
    );
}

function SampleTestCases({ testCases }) {
    return (
        <div className="test-case-preview-section">
            <h4>Sample Test Cases</h4>
            <p className="muted-cell">
                These are visible examples. Final grading may include hidden test cases.
            </p>

            <div className="test-case-result-list">
                {testCases.map((testCase, index) => (
                    <div className="test-case-result-card" key={`${testCase.name}-${index}`}>
                        <div className="test-case-result-header">
                            <strong>{testCase.name || `Sample case ${index + 1}`}</strong>
                            <span>{testCase.points ?? 0} pts</span>
                        </div>

                        <CodeBlock
                            title="Input"
                            value={testCase.input || "No input"}
                            maxHeight="140px"
                        />

                        <CodeBlock
                            title="Expected Output"
                            value={testCase.expectedOutput || ""}
                            maxHeight="140px"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

function CodingWorkspace({
    assignment,
    code,
    isBusy,
    isLocked,
    isRunning,
    runResult,
    onCodeChange,
    onRunCode,
}) {
    const codeInputId = `assignment-${assignment.id}-code`;

    return (
        <div className="candidate-code-workspace">
            <label htmlFor={codeInputId}>Your Code</label>
            <textarea
                id={codeInputId}
                rows="18"
                className="code-textarea"
                value={code}
                onChange={(event) => onCodeChange(assignment.id, event.target.value)}
                placeholder="Write your code here"
                disabled={isBusy || isLocked}
            />

            <div className="button-row-left">
                <button
                    className="secondary-button"
                    onClick={() => onRunCode(assignment)}
                    disabled={isBusy || isLocked}
                >
                    {isRunning ? "Running..." : "Run visible samples"}
                </button>
            </div>

            {runResult && <RunResultPanel runResult={runResult} />}
        </div>
    );
}

function SectionControls({
    activeSectionIndex,
    sectionCount,
    isBusy,
    isLocked,
    isSubmitting,
    onPrevious,
    onNext,
    onSubmit,
}) {
    const isFirst = activeSectionIndex === 0;
    const isLast = activeSectionIndex === sectionCount - 1;

    return (
        <div className="candidate-section-controls">
            <button
                type="button"
                className="secondary-button"
                onClick={onPrevious}
                disabled={isFirst || isBusy}
            >
                Previous section
            </button>

            {isLast ? (
                <button
                    type="button"
                    className="primary-button"
                    onClick={onSubmit}
                    disabled={isBusy || isLocked}
                >
                    {isSubmitting ? "Submitting..." : "Submit assessment"}
                </button>
            ) : (
                <button
                    type="button"
                    className="primary-button"
                    onClick={onNext}
                    disabled={isBusy}
                >
                    Next section
                </button>
            )}
        </div>
    );
}

function AssessmentProgressStrip({
    assignment,
    progress,
    remainingMs,
    isExpired,
    activeSection,
    sectionRemainingMs,
    isSectionExpired,
}) {
    return (
        <section className="candidate-progress-strip">
            <div>
                <span>Progress</span>
                <strong>{progress.completed}/{progress.total} items complete</strong>
            </div>
            <div className="candidate-progress-bar" aria-hidden="true">
                <span style={{ width: `${progress.percent}%` }} />
            </div>
            <div>
                <span>Score</span>
                <strong>{assignment.maxScore || 100} pts</strong>
            </div>
            <div>
                <span>Assessment Timer</span>
                <strong>
                    {assignment.expiresAt
                        ? isExpired
                            ? "Expired"
                            : formatDuration(remainingMs)
                        : "No limit"}
                </strong>
            </div>
            <div>
                <span>Current Section</span>
                <strong>
                    {activeSection?.timeLimitMinutes
                        ? isSectionExpired
                            ? "Expired"
                            : formatDuration(sectionRemainingMs)
                        : "No limit"}
                </strong>
            </div>
        </section>
    );
}

function SubmissionReadiness({ progress, isCodingChallenge }) {
    return (
        <div className="submission-readiness">
            <strong>Submission readiness</strong>
            <p>
                {progress.completed}/{progress.total} required items have content.
                {isCodingChallenge
                    ? " Run visible samples when possible, then submit final code."
                    : " Review your answers before submitting."}
            </p>
        </div>
    );
}

function IntroMetric({ label, value }) {
    return (
        <div className="candidate-intro-metric">
            <span>{label}</span>
            <strong>{value}</strong>
        </div>
    );
}

function RuleItem({ title, text }) {
    return (
        <div className="candidate-rule-item">
            <strong>{title}</strong>
            <p>{text}</p>
        </div>
    );
}

function RunResultPanel({ runResult }) {
    const testResults = Array.isArray(runResult.testResults)
        ? runResult.testResults
        : [];

    return (
        <div className="run-result-box">
            <h4>Run Result</h4>

            <div className="detail-grid">
                <DetailItem
                    label="Status"
                    value={getRunResultStatus(runResult)}
                />
                <DetailItem
                    label="Language"
                    value={formatLanguage(runResult.language)}
                />
                <DetailItem
                    label="Passed Tests"
                    value={`${runResult.passedTests || 0}/${runResult.totalTests || 0}`}
                />
                <DetailItem
                    label="Sample Score"
                    value={`${runResult.awardedPoints || 0}/${runResult.totalPoints || 0}`}
                />
            </div>

            {testResults.length > 0 && (
                <div className="test-case-result-list">
                    {testResults.map((result, index) => (
                        <TestCaseResultCard
                            key={`${result.name}-${index}`}
                            result={result}
                            index={index}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function TestCaseResultCard({ result, index }) {
    const isHidden = Boolean(result.hidden);

    return (
        <div className="test-case-result-card">
            <div className="test-case-result-header">
                <div>
                    <strong>{result.name || `Test case ${index + 1}`}</strong>
                    {isHidden && <span className="hidden-test-label">Hidden</span>}
                </div>

                <StatusBadge value={result.passed ? "PASSED" : "FAILED"} />
            </div>

            {!isHidden && (
                <div className="detail-grid">
                    <DetailItem
                        label="Points"
                        value={`${result.awardedPoints || 0}/${result.points || 0}`}
                    />
                    <DetailItem
                        label="Exit Code"
                        value={result.exitCode ?? "-"}
                    />
                    <DetailItem
                        label="Timed Out"
                        value={result.timedOut ? "Yes" : "No"}
                    />
                </div>
            )}

            {isHidden && (
                <div className="detail-grid">
                    <DetailItem
                        label="Points"
                        value={`${result.awardedPoints || 0}/${result.points || 0}`}
                    />
                    <DetailItem
                        label="Details"
                        value="Hidden"
                    />
                    <DetailItem
                        label="Result"
                        value={result.passed ? "Passed" : "Failed"}
                    />
                </div>
            )}

            {!isHidden && (
                <>
                    <CodeBlock
                        title="Input"
                        value={result.input || "No input"}
                        maxHeight="140px"
                    />

                    <CodeBlock
                        title="Expected Output"
                        value={result.expectedOutput || ""}
                        maxHeight="140px"
                    />

                    <CodeBlock
                        title="Actual Output"
                        value={result.actualOutput || ""}
                        maxHeight="140px"
                    />

                    <CodeBlock
                        title="Error"
                        value={result.error || ""}
                        maxHeight="140px"
                    />
                </>
            )}

            {isHidden && (
                <p className="muted-cell">
                    Details for this hidden test case are not shown.
                </p>
            )}
        </div>
    );
}

function getRunResultStatus(result) {
    if (!result) {
        return "Not run";
    }

    if (!result.totalTests) {
        return "No tests";
    }

    if (result.passedTests === result.totalTests) {
        return "All sample tests passed";
    }

    if (result.passedTests > 0) {
        return "Some sample tests passed";
    }

    return "Sample tests failed";
}

function QuestionAnswerList({ section, questions, answers, disabled, onAnswerChange }) {
    if (!questions || questions.length === 0) {
        return null;
    }

    return (
        <div className="candidate-question-list">
            <section className="candidate-question-section">
                <div className="candidate-question-section-header">
                    <h4>{section?.title || "Questions"}</h4>
                    {section?.description && <p>{section.description}</p>}
                </div>

                {questions.map((question, questionIndex) => (
                    <div className="candidate-question-card" key={question.id || questionIndex}>
                        <div className="candidate-question-card-header">
                            <strong>{question.title || `Question ${questionIndex + 1}`}</strong>
                            <span>{question.points || 0} pts</span>
                        </div>

                        <p>{question.prompt}</p>

                        {question.type === "MULTIPLE_CHOICE" ? (
                            <div className="candidate-option-list">
                                {(question.options || []).map((option) => (
                                    <label className="candidate-option-row" key={option.id}>
                                        <input
                                            type="radio"
                                            name={question.id}
                                            checked={answers[question.id] === option.id}
                                            onChange={() => onAnswerChange(question.id, option.id)}
                                            disabled={disabled}
                                        />
                                        <span>{option.text}</span>
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <textarea
                                rows="6"
                                aria-label={question.title || `Question ${questionIndex + 1}`}
                                value={answers[question.id] || ""}
                                onChange={(event) => onAnswerChange(question.id, event.target.value)}
                                placeholder="Write your answer here"
                                disabled={disabled}
                            />
                        )}
                    </div>
                ))}
            </section>
        </div>
    );
}

function SubmittedAnswersPanel({ assignment }) {
    const submittedAnswers = assignment.submittedAnswers || {};
    const entries = Object.entries(submittedAnswers);

    if (entries.length === 0) {
        return <CodeBlock title="Your Submission" value={assignment.submittedAnswer} />;
    }

    return (
        <div className="test-case-preview-section">
            <h4>Your Answers</h4>
            <div className="test-case-result-list">
                {entries.map(([questionId, value]) => (
                    <div className="test-case-result-card" key={questionId}>
                        <div className="test-case-result-header">
                            <strong>{resolveQuestionTitle(assignment, questionId)}</strong>
                        </div>
                        <p className="muted-cell">{resolveSubmittedValue(assignment, questionId, value)}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

function resolveQuestionTitle(assignment, questionId) {
    const question = (assignment.sections || [])
        .flatMap((section) => section.questions || [])
        .find((item) => item.id === questionId);

    return question?.title || questionId;
}

function resolveSubmittedValue(assignment, questionId, value) {
    const question = (assignment.sections || [])
        .flatMap((section) => section.questions || [])
        .find((item) => item.id === questionId);

    if (question?.type !== "MULTIPLE_CHOICE") {
        return value;
    }

    const option = (question.options || []).find((item) => item.id === value);
    return option?.text || value;
}

function buildLegacySection(assignment, questions) {
    if (questions.length > 0) {
        return {
            id: "legacy-section",
            title: "Assessment",
            description: assignment.prompt,
            questions,
        };
    }

    return {
        id: "coding-section",
        title: "Coding Challenge",
        description: assignment.prompt,
        questions: [
            {
                id: "coding-question",
                type: "CODING_CHALLENGE",
                title: assignment.assessmentTitle,
                prompt: assignment.prompt,
                points: assignment.maxScore || 100,
            },
        ],
    };
}

function getSectionCompletedCount(section, answers, code) {
    return (section.questions || []).filter((question) => {
        if (question.type === "CODING_CHALLENGE") {
            return Boolean(code && code.trim());
        }

        const value = answers?.[question.id];
        return value !== null && value !== undefined && String(value).trim() !== "";
    }).length;
}

function findSectionAttempt(assignment, sectionId) {
    if (!sectionId) {
        return null;
    }

    return (assignment.sectionAttempts || []).find(
        (attempt) => attempt.sectionId === sectionId
    ) || null;
}

function getAssignmentProgress({
    assignment,
    answers,
    code,
    nonCodingQuestions,
    codingQuestions,
}) {
    const answerTotal = nonCodingQuestions.length;
    const answerCompleted = nonCodingQuestions.filter((question) => {
        const value = answers?.[question.id];
        return value !== null && value !== undefined && String(value).trim() !== "";
    }).length;
    const codingTotal = assignment.assessmentType === "CODING_CHALLENGE"
        ? Math.max(codingQuestions.length, 1)
        : 0;
    const codingCompleted = codingTotal > 0 && code?.trim() ? 1 : 0;
    const total = Math.max(answerTotal + codingTotal, 1);
    const completed = Math.min(answerCompleted + codingCompleted, total);

    return {
        total,
        completed,
        percent: Math.round((completed / total) * 100),
    };
}

function formatDuration(milliseconds) {
    const totalSeconds = Math.max(Math.ceil((milliseconds || 0) / 1000), 0);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const paddedMinutes = String(minutes).padStart(2, "0");
    const paddedSeconds = String(seconds).padStart(2, "0");

    if (hours > 0) {
        return `${hours}:${paddedMinutes}:${paddedSeconds}`;
    }

    return `${minutes}:${paddedSeconds}`;
}

export default AssignmentDetail;
