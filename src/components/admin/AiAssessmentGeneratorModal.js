import { useState } from "react";
import { generateAssessmentWithAi } from "../../api/aiApi";
import { showError, showSuccess } from "../../utils/toastUtils";

const initialForm = {
  roleTitle: "",
  skillTopic: "",
  difficulty: "Medium",
  assessmentType: "CODING_CHALLENGE",
  language: "JAVA",
  context: "",
};

function AiAssessmentGeneratorModal({ isOpen, onClose, onGenerated }) {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);

  if (!isOpen) {
    return null;
  }

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleGenerate = async (event) => {
    event.preventDefault();

    if (!form.roleTitle.trim() || !form.skillTopic.trim()) {
      showError("Please enter role/title and skill/topic.");
      return;
    }

    try {
      setLoading(true);

      const draft = await generateAssessmentWithAi({
        ...form,
        language: form.assessmentType === "CODING_CHALLENGE" ? form.language : "",
      });

      onGenerated(draft);
      showSuccess("AI assessment draft generated. Please review before saving.");
      onClose();
    } catch (error) {
      showError(
        error?.response?.data?.message ||
          "Unable to generate assessment draft right now."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card modal-card-large">
        <div className="modal-header">
          <div>
            <h3>Generate assessment with AI</h3>
            <p>Create a draft, then review and edit before saving.</p>
          </div>

          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close AI assessment generator"
          >
            x
          </button>
        </div>

        <form onSubmit={handleGenerate} className="form-grid">
          <label>
            Role / title
            <input
              value={form.roleTitle}
              onChange={(event) => updateField("roleTitle", event.target.value)}
              placeholder="Junior Java Developer"
            />
          </label>

          <label>
            Skill / topic
            <input
              value={form.skillTopic}
              onChange={(event) => updateField("skillTopic", event.target.value)}
              placeholder="Arrays and strings"
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
            Assessment type
            <select
              value={form.assessmentType}
              onChange={(event) =>
                updateField("assessmentType", event.target.value)
              }
            >
              <option value="QUIZ">Quiz</option>
              <option value="CODING_CHALLENGE">Coding challenge</option>
            </select>
          </label>

          {form.assessmentType === "CODING_CHALLENGE" && (
            <label>
              Language
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

          <label className="form-field-full">
            Context / duration
            <textarea
              value={form.context}
              onChange={(event) => updateField("context", event.target.value)}
              placeholder="20-minute screening question for invited candidates."
              rows={4}
            />
          </label>

          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={onClose}>
              Cancel
            </button>

            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? "Generating..." : "Generate draft"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AiAssessmentGeneratorModal;
