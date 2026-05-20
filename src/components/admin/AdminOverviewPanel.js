import AdminStats from "./AdminStats";
import "../../css/AdminOverviewPanel.css";

function AdminOverviewPanel({
    stats,
    loadingDashboard,
    onRefresh,
    assignments,
}) {
    const recentPending = assignments
        .filter((assignment) => assignment.status === "SUBMITTED")
        .slice(0, 5);

    const recentlyGraded = assignments
        .filter((assignment) => assignment.status === "GRADED")
        .sort((a, b) => new Date(b.gradedAt) - new Date(a.gradedAt))
        .slice(0, 5);

    const assignedCount = assignments.filter(
        (assignment) => assignment.status === "ASSIGNED"
    ).length;

    return (
        <div className="admin-overview-panel">
            <AdminStats stats={stats} />

            <div className="overview-refresh-section">
                <button
                    className="secondary-button"
                    onClick={onRefresh}
                    disabled={loadingDashboard}
                >
                    {loadingDashboard ? "Refreshing..." : "Refresh Dashboard"}
                </button>
            </div>

            <div className="overview-grid">
                <section className="overview-card">
                    <h3>Quick Actions</h3>
                    <p className="muted-cell">
                        Common tasks to manage your organization.
                    </p>

                    <div className="quick-actions-list">
                        <QuickAction
                            label="Pending Review"
                            value={`${stats.pendingSubmissions} submission${stats.pendingSubmissions !== 1 ? "s" : ""} waiting for grading`}
                        />
                        <QuickAction
                            label="Active Assessments"
                            value={`${stats.totalAssessments} assessment${stats.totalAssessments !== 1 ? "s" : ""} available`}
                        />
                        <QuickAction
                            label="Active Candidates"
                            value={`${stats.totalCandidates} candidate${stats.totalCandidates !== 1 ? "s" : ""} in your organization`}
                        />
                        <QuickAction
                            label="Completed"
                            value={`${stats.gradedSubmissions} submission${stats.gradedSubmissions !== 1 ? "s" : ""} graded`}
                        />
                    </div>
                </section>

                <section className="overview-card">
                    <h3>Workflow Status</h3>
                    <p className="muted-cell">
                        Current state of your assessment pipeline.
                    </p>

                    <div className="workflow-status">
                        <WorkflowStage
                            label="Candidates"
                            value={stats.totalCandidates}
                            width={100}
                        />
                        <WorkflowStage
                            label="Assigned"
                            value={assignedCount}
                            width={getWorkflowWidth(assignedCount, stats.totalCandidates)}
                        />
                        <WorkflowStage
                            label="Submitted"
                            value={stats.pendingSubmissions}
                            width={getWorkflowWidth(
                                stats.pendingSubmissions,
                                stats.totalCandidates
                            )}
                        />
                        <WorkflowStage
                            label="Graded"
                            value={stats.gradedSubmissions}
                            width={getWorkflowWidth(
                                stats.gradedSubmissions,
                                stats.totalCandidates
                            )}
                        />
                    </div>
                </section>
            </div>

            <div className="overview-grid">
                <ActivityCard
                    title="Pending Review"
                    subtitle="Submissions waiting for grade."
                    emptyMessage="No pending submissions"
                    assignments={recentPending}
                    badgeLabel="Review"
                    badgeType="pending"
                />

                <ActivityCard
                    title="Recently Graded"
                    subtitle="Latest graded submissions."
                    emptyMessage="No graded submissions yet"
                    assignments={recentlyGraded}
                    badgeLabel="Done"
                    badgeType="success"
                    showScore
                />
            </div>
        </div>
    );
}

function QuickAction({ label, value }) {
    return (
        <div className="quick-action-item">
            <strong>{label}</strong>
            <p>{value}</p>
        </div>
    );
}

function WorkflowStage({ label, value, width }) {
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

function ActivityCard({
    title,
    subtitle,
    emptyMessage,
    assignments,
    badgeLabel,
    badgeType,
    showScore,
}) {
    return (
        <section className="overview-card">
            <h3>{title}</h3>
            <p className="muted-cell">{subtitle}</p>

            {assignments.length === 0 ? (
                <p className="empty-message">{emptyMessage}</p>
            ) : (
                <div className="activity-list">
                    {assignments.map((assignment) => (
                        <div key={assignment.id} className="activity-item">
                            <div className="activity-info">
                                <strong>{assignment.candidateName}</strong>
                                <p className="muted-cell">
                                    {assignment.assessmentTitle}
                                    {showScore &&
                                        ` - ${assignment.score}/${assignment.maxScore}`}
                                </p>
                            </div>
                            <span className={`activity-badge ${badgeType}`}>
                                {badgeLabel}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}

function getWorkflowWidth(value, total) {
    if (!total) {
        return 0;
    }

    return Math.min(100, Math.round((value / total) * 100));
}

export default AdminOverviewPanel;
