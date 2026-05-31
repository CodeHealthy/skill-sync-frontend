import { useCallback, useEffect, useState } from "react";
import { auditApi } from "../api/auditApi";
import { platformAdminApi } from "../api/platformAdminApi";
import DashboardLayout from "../components/layout/DashboardLayout";
import AuditLogPanel from "../components/admin/AuditLogPanel";
import SubscriptionPlanManagementPanel from "../components/superadmin/SubscriptionPlanManagementPanel";
import { getApiErrorMessage, isAuthRedirectError } from "../utils/errorUtils";
import { showError } from "../utils/toastUtils";
import { useAuth } from "../auth/AuthContext";

function SuperAdminDashboard() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState("overview");
    const [loading, setLoading] = useState(false);
    const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);
    const [auditActionFilter, setAuditActionFilter] = useState("");
    const [auditLogs, setAuditLogs] = useState([]);
    const [summary, setSummary] = useState({
        organizations: [],
        users: [],
    });

    const fetchSummary = async () => {
        setLoading(true);

        try {
            const response = await platformAdminApi.getSummary();
            setSummary(response.data || { organizations: [], users: [] });
        } catch (err) {
            if (isAuthRedirectError(err)) {
                return;
            }

            showError(getApiErrorMessage(err, "Failed to load platform data"));
        } finally {
            setLoading(false);
        }
    };

    const fetchAuditLogs = useCallback(async (action = "") => {
        setLoadingAuditLogs(true);

        try {
            const response = await auditApi.getPlatformLogs(
                action ? { action } : {}
            );

            setAuditLogs(response.data || []);
        } catch (err) {
            if (isAuthRedirectError(err)) {
                return;
            }

            showError(getApiErrorMessage(err, "Failed to load platform audit logs"));
        } finally {
            setLoadingAuditLogs(false);
        }
    }, []);

    useEffect(() => {
        fetchSummary();
    }, []);

    useEffect(() => {
        fetchAuditLogs(auditActionFilter);
    }, [auditActionFilter, fetchAuditLogs]);

    const tabs = [
        {
            id: "overview",
            label: "Platform",
            icon: "overview",
            content: (
                <div className="dashboard-panel-stack">
                    <section className="result-card">
                        <div className="panel-heading-row">
                            <div>
                                <p className="eyebrow">Super Admin</p>
                                <h2>Platform Overview</h2>
                            </div>
                            <button
                                type="button"
                                className="secondary-button"
                                onClick={fetchSummary}
                                disabled={loading}
                            >
                                {loading ? "Refreshing..." : "Refresh"}
                            </button>
                        </div>

                        <div className="dashboard-panel-grid dashboard-panel-grid-equal">
                            <div className="profile-detail-item">
                                <span>Organizations</span>
                                <strong>{summary.organizations.length}</strong>
                            </div>
                            <div className="profile-detail-item">
                                <span>Users</span>
                                <strong>{summary.users.length}</strong>
                            </div>
                        </div>
                    </section>

                    <section className="result-card">
                        <h2>Organizations</h2>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Users</th>
                                    <th>Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {summary.organizations.map((organization) => (
                                    <tr key={organization.organizationId}>
                                        <td>{organization.name}</td>
                                        <td>{organization.userCount}</td>
                                        <td>
                                            {organization.createdAt
                                                ? new Date(organization.createdAt).toLocaleDateString()
                                                : "-"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>

                    <section className="result-card">
                        <h2>Users</h2>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {summary.users.map((item) => (
                                    <tr key={item.userId}>
                                        <td>{item.fullName || "-"}</td>
                                        <td>{item.email}</td>
                                        <td>{item.role}</td>
                                        <td>{item.active === false ? "Deactivated" : "Active"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>
                </div>
            ),
        },
        {
            id: "plans",
            label: "Plans",
            icon: "billing",
            content: <SubscriptionPlanManagementPanel />,
        },
        {
            id: "audit",
            label: "Audit Logs",
            icon: "results",
            content: (
                <AuditLogPanel
                    title="Platform Audit Logs"
                    eyebrow="Super Admin"
                    logs={auditLogs}
                    loading={loadingAuditLogs}
                    actionFilter={auditActionFilter}
                    onActionFilterChange={setAuditActionFilter}
                    onRefresh={() => fetchAuditLogs(auditActionFilter)}
                    platform
                />
            ),
        },
    ];

    return (
        <DashboardLayout
            tabs={tabs}
            activeTabId={activeTab}
            onTabChange={setActiveTab}
            userRole="super-admin"
            userName={user?.fullName}
            userTitle="Platform Super Admin"
        />
    );
}

export default SuperAdminDashboard;
