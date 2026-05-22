import { useEffect, useRef, useState } from "react";
import { generateAssessmentWithAi } from "../../api/aiApi";
import { showError, showSuccess } from "../../utils/toastUtils";

const initialForm = {
  roleTitle: "",
  skillTopic: "",
  difficulty: "Medium",
  includeCoding: true,
  includeMultipleChoice: true,
  includeShortAnswer: true,
  questionCount: 6,
  durationMinutes: 60,
  language: "JAVA",
  context: "",
};

function AiAssessmentGeneratorModal({ isOpen, onClose, onGenerated }) {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const abortControllerRef = useRef(null);
  const selectedComponentCount = [
    form.includeCoding,
    form.includeMultipleChoice,
    form.includeShortAnswer,
  ].filter(Boolean).length;
  const canGenerate = selectedComponentCount > 0 && !loading;
  const progress = getGenerationProgress(elapsedSeconds);
  const progressStage = getGenerationStage(elapsedSeconds);

  useEffect(() => {
    if (!loading) {
      setElapsedSeconds(0);
      return undefined;
    }

    const timerId = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [loading]);

  useEffect(() => {
    if (!isOpen && abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleClose = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setLoading(false);
    onClose();
  };

  const handleGenerate = async (event) => {
    event.preventDefault();

    if (!form.roleTitle.trim() || !form.skillTopic.trim()) {
      showError("Please enter role/title and skill/topic.");
      return;
    }

    if (!form.includeCoding && !form.includeMultipleChoice && !form.includeShortAnswer) {
      showError("Please select at least one assessment component.");
      return;
    }

    try {
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      setLoading(true);
      setElapsedSeconds(0);

      const draft = await generateAssessmentWithAi({
        ...form,
        assessmentType: form.includeCoding ? "CODING_CHALLENGE" : "MCQ",
        language: form.includeCoding ? form.language : "",
        questionCount: Number(form.questionCount || 5),
        durationMinutes: Number(form.durationMinutes || 45),
      }, {
        signal: abortController.signal,
      });

      onGenerated(draft);
      showSuccess("AI assessment draft generated. Please review before saving.");
      onClose();
    } catch (error) {
      if (error?.code === "ERR_CANCELED") {
        return;
      }

      showError(
        error?.response?.data?.message ||
          (error?.code === "ECONNABORTED"
            ? "AI generation took longer than expected. Please try a smaller draft or try again."
            : null) ||
          "Unable to generate assessment draft right now."
      );
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card modal-card-large">
        <div className="modal-header">
          <div>
            <h3>Generate full assessment with AI</h3>
            <p>Create coding tasks, MCQs, and short-answer signals in one draft.</p>
          </div>

          <button
            type="button"
            className="icon-button"
            onClick={handleClose}
            aria-label="Close AI assessment generator"
          >
            x
          </button>
        </div>

        <form onSubmit={handleGenerate} className="ai-generator-form">
          <section className="ai-generator-section">
            <div className="form-grid">
              <label>
                Role / title
                <input
                  value={form.roleTitle}
                  onChange={(event) => updateField("roleTitle", event.target.value)}
                  placeholder="Software Engineer"
                />
              </label>

              <label>
                Skills / topics
                <input
                  value={form.skillTopic}
                  onChange={(event) => updateField("skillTopic", event.target.value)}
                  placeholder="Kafka, RabbitMQ, arrays"
                />
              </label>

              <label>
                Difficulty
                <select
                  value={form.difficulty}
                  onChange={(event) => updateField("difficulty", event.target.value)}
                >
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                </select>
              </label>

              <label>
                Duration
                <input
                  type="number"
                  min="10"
                  max="240"
                  value={form.durationMinutes}
                  onChange={(event) => updateField("durationMinutes", event.target.value)}
                />
              </label>

              <label>
                Question count
                <input
                  type="number"
                  min="2"
                  max="12"
                  value={form.questionCount}
                  onChange={(event) => updateField("questionCount", event.target.value)}
                />
              </label>

              {form.includeCoding && (
                <label>
                  Coding language
                  <select
                    value={form.language}
                    onChange={(event) => updateField("language", event.target.value)}
                  >
                    <option value="JAVA">Java</option>
                    <option value="JAVASCRIPT">JavaScript</option>
                    <option value="PYTHON">Python</option>
                  </select>
                </label>
              )}
            </div>
          </section>

          <section className="ai-generator-section">
            <div className="ai-generator-section-header">
              <h4>Assessment structure</h4>
              <span>{resolveStructureLabel(form)}</span>
            </div>

            <div className="ai-structure-grid">
              <label className="ai-structure-option">
                <input
                  type="checkbox"
                  checked={form.includeCoding}
                  onChange={(event) => updateField("includeCoding", event.target.checked)}
                />
                <span>
                  <strong>Coding challenge</strong>
                  <small>Auto-graded with test cases.</small>
                </span>
              </label>

              <label className="ai-structure-option">
                <input
                  type="checkbox"
                  checked={form.includeMultipleChoice}
                  onChange={(event) => updateField("includeMultipleChoice", event.target.checked)}
                />
                <span>
                  <strong>MCQs</strong>
                  <small>Objective skill checks.</small>
                </span>
              </label>

              <label className="ai-structure-option">
                <input
                  type="checkbox"
                  checked={form.includeShortAnswer}
                  onChange={(event) => updateField("includeShortAnswer", event.target.checked)}
                />
                <span>
                  <strong>Work-style answers</strong>
                  <small>Manual review only.</small>
                </span>
              </label>
            </div>
          </section>

          <section className="ai-draft-plan">
            <div>
              <span>Draft plan</span>
              <strong>{form.questionCount || 5} questions over {form.durationMinutes || 45} minutes</strong>
            </div>
            <ul>
              {form.includeCoding && <li>One coding challenge with visible and hidden test cases</li>}
              {form.includeMultipleChoice && <li>Scenario-based MCQs for automatic scoring</li>}
              {form.includeShortAnswer && <li>Manual-review short answers for judgment and work style</li>}
            </ul>
          </section>

          {loading && (
            <section className="ai-generation-progress" aria-live="polite">
              <div className="ai-generation-progress-header">
                <div>
                  <span>AI generation in progress</span>
                  <strong>{progressStage}</strong>
                </div>
                <small>{elapsedSeconds}s elapsed</small>
              </div>

              <div className="ai-generation-progress-track" aria-hidden="true">
                <span style={{ width: `${progress}%` }} />
              </div>

              <p>
                Full assessments can take up to three minutes when coding tasks,
                test cases, MCQs, and short-answer prompts are generated together.
              </p>
            </section>
          )}

          <label className="form-field-full">
            Extra instructions
            <textarea
              value={form.context}
              onChange={(event) => updateField("context", event.target.value)}
              placeholder="Add seniority, scenario, company context, or must-cover topics."
              rows={4}
            />
          </label>

          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={handleClose}>
              {loading ? "Cancel request" : "Cancel"}
            </button>

            <button type="submit" className="primary-button" disabled={!canGenerate}>
              {loading ? `Generating draft (${progress}%)` : "Generate draft"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function getGenerationProgress(elapsedSeconds) {
  if (elapsedSeconds <= 0) {
    return 8;
  }

  return Math.min(95, Math.round(8 + (elapsedSeconds / 180) * 87));
}

function getGenerationStage(elapsedSeconds) {
  if (elapsedSeconds < 8) {
    return "Preparing the assessment blueprint";
  }

  if (elapsedSeconds < 25) {
    return "Designing question coverage";
  }

  if (elapsedSeconds < 70) {
    return "Writing questions and test cases";
  }

  if (elapsedSeconds < 130) {
    return "Checking scoring and structure";
  }

  return "Finalizing the draft";
}

function resolveStructureLabel(form) {
  const selected = [
    form.includeCoding ? "coding" : null,
    form.includeMultipleChoice ? "MCQs" : null,
    form.includeShortAnswer ? "short answers" : null,
  ].filter(Boolean);

  return selected.length > 0 ? selected.join(" + ") : "Select at least one";
}

export default AiAssessmentGeneratorModal;
