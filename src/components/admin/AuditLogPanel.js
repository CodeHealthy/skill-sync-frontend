import "../../css/DashboardPanels.css";

const ACTION_OPTIONS = [
    { value: "", label: "All actions" },
    { value: "LOGIN_SUCCESS", label: "Login success" },
    { value: "LOGIN_FAILED", label: "Login failed" },
    { value: "ORG_REGISTERED", label: "Organization registered" },
    { value: "CANDIDATE_INVITED", label: "Candidate invited" },
    { value: "TEAM_INVITE_SENT", label: "Team invite sent" },
    { value: "TEAM_INVITE_REVOKED", label: "Team invite revoked" },
    { value: "TEAM_MEMBER_DEACTIVATED", label: "Team member deactivated" },
    { value: "ASSESSMENT_CREATED", label: "Assessment created" },
    { value: "ASSESSMENT_ASSIGNED", label: "Assessment assigned" },
    { value: "ASSIGNMENT_SUBMITTED", label: "Assignment submitted" },
    { value: "ASSIGNMENT_GRADED", label: "Assignment graded" },
    { value: "ASSIGNMENT_EXECUTED", label: "Assignment executed" },
    { value: "BILLING_SUBSCRIPTION_UPDATED", label: "Billing updated" },
    { value: "PLATFORM_SUMMARY_VIEWED", label: "Platform viewed" },
    { value: "PLATFORM_USER_UPDATED", label: "Platform user updated" },
    { value: "PLATFORM_ORGANIZATION_UPDATED", label: "Platform organization updated" },
    { value: "PLATFORM_SUBSCRIPTION_PLAN_CREATED", label: "Platform plan created" },
    { value: "PLATFORM_SUBSCRIPTION_PLAN_UPDATED", label: "Platform plan updated" },
    { value: "PLATFORM_SUBSCRIPTION_PLAN_DEACTIVATED", label: "Platform plan deactivated" },
];

const TARGET_TYPE_OPTIONS = [
    { value: "", label: "All targets" },
    { value: "USER", label: "User" },
    { value: "ORGANIZATION", label: "Organization" },
    { value: "SUBSCRIPTION_PLAN", label: "Subscription plan" },
    { value: "BILLING_SUBSCRIPTION", label: "Billing subscription" },
    { value: "ASSESSMENT", label: "Assessment" },
    { value: "ASSIGNMENT", label: "Assignment" },
    { value: "CANDIDATE", label: "Candidate" },
];

function AuditLogPanel({
    title = "Activity History",
    eyebrow = "Audit",
    logs,
    loading,
    actionFilter = "",
    onActionFilterChange,
    filters,
    organizations = [],
    onFilterChange,
    onRefresh,
    platform = false,
}) {
    const effectiveFilters = filters || { action: actionFilter };
    const updateFilter = (name, value) => {
        if (onFilterChange) {
            onFilterChange(name, value);
            return;
        }

        if (name === "action" && onActionFilterChange) {
            onActionFilterChange(value);
        }
    };

    return (
        <div className="dashboard-panel-stack">
            <section className="result-card">
                <div className="panel-heading-row">
                    <div>
                        <p className="eyebrow">{eyebrow}</p>
                        <h2>{title}</h2>
                    </div>

                    <div className="button-row">
                        <select
                            value={effectiveFilters.action || ""}
                            onChange={(event) => updateFilter("action", event.target.value)}
                            aria-label="Filter audit logs by action"
                        >
                            {ACTION_OPTIONS.map((option) => (
                                <option key={option.value || "all"} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        {platform && (
                            <>
                                <select
                                    value={effectiveFilters.organizationId || ""}
                                    onChange={(event) =>
                                        updateFilter("organizationId", event.target.value)
                                    }
                                    aria-label="Filter audit logs by organization"
                                >
                                    <option value="">All organizations</option>
                                    {organizations.map((organization) => (
                                        <option
                                            value={organization.organizationId}
                                            key={organization.organizationId}
                                        >
                                            {organization.name}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    type="email"
                                    aria-label="Filter audit logs by actor email"
                                    placeholder="Actor email"
                                    value={effectiveFilters.actorEmail || ""}
                                    onChange={(event) =>
                                        updateFilter("actorEmail", event.target.value.trim())
                                    }
                                />
                                <select
                                    value={effectiveFilters.targetType || ""}
                                    onChange={(event) =>
                                        updateFilter("targetType", event.target.value)
                                    }
                                    aria-label="Filter audit logs by target type"
                                >
                                    {TARGET_TYPE_OPTIONS.map((option) => (
                                        <option key={option.value || "all"} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </>
                        )}
                        <button
                            type="button"
                            className="secondary-button"
                            onClick={onRefresh}
                            disabled={loading}
                        >
                            {loading ? "Refreshing..." : "Refresh"}
                        </button>
                    </div>
                </div>
            </section>

            <section className="result-card">
                {logs.length === 0 ? (
                    <div className="empty-state">
                        <h3>No activity yet</h3>
                        <p>Important account, team, assessment, and billing events will appear here.</p>
                    </div>
                ) : (
                    <div>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>When</th>
                                    <th>Action</th>
                                    <th>Actor</th>
                                    {platform && <th>Organization</th>}
                                    <th>Target</th>
                                    <th>Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => (
                                    <tr key={log.id}>
                                        <td>{formatDateTime(log.createdAt)}</td>
                                        <td>{formatAction(log.action)}</td>
                                        <td>
                                            <div>
                                                <strong>{log.actorEmail || "System"}</strong>
                                                {log.actorRole && <small>{log.actorRole}</small>}
                                            </div>
                                        </td>
                                        {platform && <td>{log.organizationId || "-"}</td>}
                                        <td>
                                            <div>
                                                <strong>{log.targetType || "-"}</strong>
                                                <small>{shorten(log.targetId)}</small>
                                            </div>
                                        </td>
                                        <td>{formatMetadata(log.metadata)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}

function formatDateTime(value) {
    if (!value) {
        return "-";
    }

    return new Date(value).toLocaleString();
}

function formatAction(value) {
    if (!value) {
        return "-";
    }

    return value
        .toLowerCase()
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function formatMetadata(metadata) {
    if (!metadata || Object.keys(metadata).length === 0) {
        return "-";
    }

    return Object.entries(metadata)
        .slice(0, 3)
        .map(([key, value]) => `${formatMetadataKey(key)}: ${String(value)}`)
        .join(" | ");
}

function formatMetadataKey(value) {
    if (!value) {
        return "-";
    }

    return String(value)
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/[_-]+/g, " ")
        .split(" ")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(" ");
}

function shorten(value) {
    if (!value) {
        return "-";
    }

    return value.length > 18 ? `${value.slice(0, 18)}...` : value;
}

export default AuditLogPanel;
