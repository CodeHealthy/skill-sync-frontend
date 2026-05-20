import CandidateStats from "./CandidateStats";
import StatusBadge from "../common/StatusBadge";
import { formatDate, formatLanguage } from "../../utils/formatters";
import "../../css/DashboardPanels.css";

function CandidateOverviewPanel({
    stats,
    assignments,
    loadingAssignments,
    onRefresh,
}) {
    const recentAssignments = assignments.slice(0, 5);
    const completionRate =
        stats.total > 0 ? Math.round((stats.graded / stats.total) * 100) : 0;

    return (
        <div className="dashboard-panel-stack">
            <CandidateStats stats={stats} />

            <div className="overview-refresh-section">
                <button
                    className="secondary-button"
                    onClick={onRefresh}
                    disabled={loadingAssignments}
                >
                    {loadingAssignments ? "Refreshing..." : "Refresh Assignments"}
                </button>
            </div>

            <div className="dashboard-panel-grid dashboard-panel-grid-equal">
                <section className="overview-card">
                    <h3>Progress</h3>
                    <p className="muted-cell">Your current assessment completion.</p>

                    <div className="candidate-progress-ring">
                        <strong>{completionRate}%</strong>
                        <span>graded</span>
                    </div>

                    <div className="workflow-status">
                        <ProgressRow label="Pending" value={stats.pending} total={stats.total} />
                        <ProgressRow label="Submitted" value={stats.submitted} total={stats.total} />
                        <ProgressRow label="Graded" value={stats.graded} total={stats.total} />
                    </div>
                </section>

                <section className="overview-card">
                    <h3>Recent Assessments</h3>
                    <p className="muted-cell">Latest assignments from your organizations.</p>

                    {recentAssignments.length === 0 ? (
                        <p className="empty-message">No assessments assigned yet.</p>
                    ) : (
                        <div className="activity-list">
                            {recentAssignments.map((assignment) => (
                                <div key={assignment.id} className="activity-item">
                                    <div className="activity-info">
                                        <strong>{assignment.assessmentTitle}</strong>
                                        <p className="muted-cell">
                                            {assignment.organizationName || "Organization"} ·{" "}
                                            {formatLanguage(assignment.language)} ·{" "}
                                            {formatDate(assignment.assignedAt)}
                                        </p>
                                    </div>
                                    <StatusBadge value={assignment.status} />
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}

function ProgressRow({ label, value, total }) {
    const width = total > 0 ? Math.round((value / total) * 100) : 0;

    return (
        <div className="workflow-stage">
            <div className="workflow-stage-header">
                <span className="stage-label">{label}</span>
                <span className="stage-value">{value}</span>
            </div>
            <div className="stage-bar">
                <div className="stage-fill" style={{ width: `${width}%` }} />
            </div>
        </div>
    );
}

export default CandidateOverviewPanel;
