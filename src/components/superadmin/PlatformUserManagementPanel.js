import { useState } from "react";
import { platformAdminApi } from "../../api/platformAdminApi";
import { getApiErrorMessage } from "../../utils/errorUtils";
import { showError, showSuccess } from "../../utils/toastUtils";

const platformRoles = [
    "SUPER_ADMIN",
    "ORG_ADMIN",
    "ADMIN",
    "RECRUITER",
    "HIRING_MANAGER",
    "EVALUATOR",
    "CANDIDATE",
];

const organizationStaffRoles = new Set([
    "ORG_ADMIN",
    "ADMIN",
    "RECRUITER",
    "HIRING_MANAGER",
    "EVALUATOR",
]);

function PlatformUserManagementPanel({ users, organizations = [], onRefresh }) {
    const [updatingUserId, setUpdatingUserId] = useState(null);

    const updateUser = async (user, patch) => {
        setUpdatingUserId(user.userId);
        const nextRole = patch.role ?? user.role;
        const nextOrganizationId = organizationStaffRoles.has(nextRole)
            ? patch.organizationId ?? user.organizationId ?? ""
            : null;

        try {
            await platformAdminApi.updateUser(user.userId, {
                role: nextRole,
                active: patch.active ?? user.active !== false,
                organizationId: nextOrganizationId,
            });
            showSuccess("User updated.");
            await onRefresh();
        } catch (err) {
            showError(getApiErrorMessage(err, "Failed to update user"));
        } finally {
            setUpdatingUserId(null);
        }
    };

    return (
        <section className="result-card">
            <div className="panel-heading-row">
                <div>
                    <p className="eyebrow">Super Admin</p>
                    <h2>Users</h2>
                </div>
                <button
                    type="button"
                    className="secondary-button"
                    onClick={onRefresh}
                    disabled={Boolean(updatingUserId)}
                >
                    Refresh
                </button>
            </div>

            <div className="table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Organization</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((item) => {
                            const isUpdating = updatingUserId === item.userId;
                            const active = item.active !== false;

                            return (
                                <tr key={item.userId}>
                                    <td data-label="Name">{item.fullName || "-"}</td>
                                    <td data-label="Email">{item.email}</td>
                                    <td data-label="Organization">
                                        {organizationStaffRoles.has(item.role) ? (
                                            <select
                                                aria-label={`Organization for ${item.email}`}
                                                value={item.organizationId || ""}
                                                onChange={(event) =>
                                                    updateUser(item, {
                                                        organizationId: event.target.value,
                                                    })
                                                }
                                                disabled={isUpdating}
                                            >
                                                <option value="">Select organization</option>
                                                {organizations.map((organization) => (
                                                    <option
                                                        value={organization.organizationId}
                                                        key={organization.organizationId}
                                                    >
                                                        {organization.name}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            "-"
                                        )}
                                    </td>
                                    <td data-label="Role">
                                        <select
                                            aria-label={`Role for ${item.email}`}
                                            value={item.role || ""}
                                            onChange={(event) =>
                                                updateUser(item, { role: event.target.value })
                                            }
                                            disabled={isUpdating}
                                        >
                                            {platformRoles.map((role) => (
                                                <option value={role} key={role}>
                                                    {role}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td data-label="Status">{active ? "Active" : "Deactivated"}</td>
                                    <td data-label="Actions">
                                        <button
                                            type="button"
                                            className={active ? "danger-button small-button" : "secondary-button small-button"}
                                            onClick={() => updateUser(item, { active: !active })}
                                            disabled={isUpdating}
                                        >
                                            {isUpdating
                                                ? "Updating..."
                                                : active
                                                    ? "Deactivate"
                                                    : "Activate"}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}

                        {users.length === 0 && (
                            <tr>
                                <td colSpan={6} className="empty-table-cell">
                                    No users found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

export default PlatformUserManagementPanel;
