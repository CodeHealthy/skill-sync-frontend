import { useState } from "react";
import { platformAdminApi } from "../../api/platformAdminApi";
import { getApiErrorMessage } from "../../utils/errorUtils";
import { showError, showSuccess } from "../../utils/toastUtils";

function PlatformOrganizationManagementPanel({ organizations, onRefresh }) {
    const [draftNames, setDraftNames] = useState({});
    const [updatingOrganizationId, setUpdatingOrganizationId] = useState(null);

    const getDraftName = (organization) =>
        draftNames[organization.organizationId] ?? organization.name ?? "";

    const handleNameChange = (organizationId, value) => {
        setDraftNames((current) => ({
            ...current,
            [organizationId]: value,
        }));
    };

    const updateOrganization = async (organization) => {
        const nextName = getDraftName(organization).trim();

        if (!nextName) {
            showError("Organization name is required.");
            return;
        }

        setUpdatingOrganizationId(organization.organizationId);

        try {
            await platformAdminApi.updateOrganization(organization.organizationId, {
                name: nextName,
                status: organization.status || "ACTIVE",
            });
            showSuccess("Organization updated.");
            setDraftNames((current) => {
                const next = { ...current };
                delete next[organization.organizationId];
                return next;
            });
            await onRefresh();
        } catch (err) {
            showError(getApiErrorMessage(err, "Failed to update organization"));
        } finally {
            setUpdatingOrganizationId(null);
        }
    };

    const updateOrganizationStatus = async (organization) => {
        const nextStatus =
            organization.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";

        setUpdatingOrganizationId(organization.organizationId);

        try {
            await platformAdminApi.updateOrganization(organization.organizationId, {
                name: organization.name,
                status: nextStatus,
            });
            showSuccess(
                nextStatus === "SUSPENDED"
                    ? "Organization suspended."
                    : "Organization reactivated."
            );
            await onRefresh();
        } catch (err) {
            showError(getApiErrorMessage(err, "Failed to update organization status"));
        } finally {
            setUpdatingOrganizationId(null);
        }
    };

    return (
        <section className="result-card">
            <div className="panel-heading-row">
                <div>
                    <p className="eyebrow">Super Admin</p>
                    <h2>Organizations</h2>
                </div>
                <button
                    type="button"
                    className="secondary-button"
                    onClick={onRefresh}
                    disabled={Boolean(updatingOrganizationId)}
                >
                    Refresh
                </button>
            </div>

            <div className="table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Users</th>
                            <th>Status</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {organizations.map((organization) => {
                            const isUpdating =
                                updatingOrganizationId === organization.organizationId;
                            const draftName = getDraftName(organization);
                            const nameChanged =
                                draftName.trim() !== (organization.name || "").trim();

                            return (
                                <tr key={organization.organizationId}>
                                    <td data-label="Name">
                                        <input
                                            aria-label={`Name for ${organization.name}`}
                                            value={draftName}
                                            onChange={(event) =>
                                                handleNameChange(
                                                    organization.organizationId,
                                                    event.target.value
                                                )
                                            }
                                            disabled={isUpdating}
                                        />
                                    </td>
                                    <td data-label="Users">{organization.userCount}</td>
                                    <td data-label="Status">
                                        {organization.status === "SUSPENDED"
                                            ? "Suspended"
                                            : "Active"}
                                    </td>
                                    <td data-label="Created">
                                        {organization.createdAt
                                            ? new Date(organization.createdAt).toLocaleDateString()
                                            : "-"}
                                    </td>
                                    <td data-label="Actions">
                                        <div className="table-action-group">
                                            <button
                                                type="button"
                                                className="primary-button small-button"
                                                onClick={() => updateOrganization(organization)}
                                                disabled={isUpdating || !nameChanged}
                                            >
                                                {isUpdating ? "Saving..." : "Save"}
                                            </button>
                                            <button
                                                type="button"
                                                className={
                                                    organization.status === "SUSPENDED"
                                                        ? "secondary-button small-button"
                                                        : "danger-button small-button"
                                                }
                                                onClick={() => updateOrganizationStatus(organization)}
                                                disabled={isUpdating}
                                            >
                                                {organization.status === "SUSPENDED"
                                                    ? "Reactivate"
                                                    : "Suspend"}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}

                        {organizations.length === 0 && (
                            <tr>
                                <td colSpan={5} className="empty-table-cell">
                                    No organizations found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

export default PlatformOrganizationManagementPanel;
