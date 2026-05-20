import MetricCard from "../common/MetricCard";

function CandidateStats({ stats }) {
    return (
        <div className="summary-grid">
            <MetricCard label="Total Assessments" value={stats.total} />
            <MetricCard label="Pending" value={stats.pending} />
            <MetricCard label="Submitted" value={stats.submitted} />
            <MetricCard label="Graded" value={stats.graded} />
        </div>
    );
}

export default CandidateStats;
