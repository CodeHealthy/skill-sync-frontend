import MetricCard from "../common/MetricCard";

function AdminStats({ stats }) {
    return (
        <div className="summary-grid">
            <MetricCard label="Candidates" value={stats.totalCandidates} />
            <MetricCard label="Assessments" value={stats.totalAssessments} />
            <MetricCard label="Pending Review" value={stats.pendingSubmissions} />
            <MetricCard label="Graded" value={stats.gradedSubmissions} />
        </div>
    );
}

export default AdminStats;