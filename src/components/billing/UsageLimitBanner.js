import { showInfo } from "../../utils/toastUtils";

const SUBSCRIPTIONS_UNAVAILABLE_MESSAGE =
    "Subscriptions are currently unavailable. You can continue using the free workspace while billing is being prepared.";

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
                <button
                    type="button"
                    className="secondary-button"
                    onClick={() => showInfo(SUBSCRIPTIONS_UNAVAILABLE_MESSAGE)}
                >
                    Upgrade
                </button>
            )}
        </div>
    );
}

export default UsageLimitBanner;
