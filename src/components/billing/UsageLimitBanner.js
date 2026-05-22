import { Link } from "react-router-dom";

function UsageLimitBanner({ label, usage, compact = false }) {
    if (!usage || usage.isUnlimited) {
        return null;
    }

    const tone = usage.isAtLimit ? "danger" : usage.percentUsed >= 80 ? "warning" : "default";

    return (
        <div className={`usage-limit-banner ${tone} ${compact ? "compact" : ""}`}>
            <div>
                <strong>{label}</strong>
                <span>
                    {usage.used}/{usage.limit} used
                    {usage.remaining > 0 ? `, ${usage.remaining} remaining` : ""}
                </span>
            </div>
            <div className="usage-limit-progress" aria-hidden="true">
                <span style={{ width: `${usage.percentUsed}%` }} />
            </div>
            {usage.isAtLimit && (
                <Link to="/pricing" className="secondary-link">
                    Upgrade
                </Link>
            )}
        </div>
    );
}

export default UsageLimitBanner;
