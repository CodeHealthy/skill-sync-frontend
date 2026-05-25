import "../../css/DashboardPanels.css";

const TEAM_INVITE_ROLES = [
    { value: "RECRUITER", label: "Recruiter" },
    { value: "HIRING_MANAGER", label: "Hiring Manager" },
    { value: "EVALUATOR", label: "Evaluator" },
    { value: "ORG_ADMIN", label: "Organization Admin" },
];

function TeamSettingsPanel({
    teamMembers,
    pendingInvites,
    teamInviteForm,
    currentUserId,
    loadingTeam,
    invitingTeamMember,
    canInviteTeamMember = true,
    teamActionId,
    onTeamInviteChange,
    onInviteTeamMember,
    onResendInvite,
    onRevokeInvite,
    onDeactivateMember,
    onRefresh,
}) {
    return (
        <div className="dashboard-panel-stack">
            <section className="result-card">
                <div className="panel-heading-row">
                    <div>
                        <p className="eyebrow">Team</p>
                        <h2>Organization Members</h2>
                    </div>

                    <button
                        type="button"
                        className="secondary-button"
                        onClick={onRefresh}
                        disabled={loadingTeam}
                    >
                        {loadingTeam ? "Refreshing..." : "Refresh"}
                    </button>
                </div>

                <form className="form-grid" onSubmit={onInviteTeamMember}>
                    <div>
                        <label>Full Name</label>
                        <input
                            name="fullName"
                            type="text"
                            value={teamInviteForm.fullName}
                            onChange={onTeamInviteChange}
                            placeholder="Teammate name"
                            autoComplete="name"
                            required
                        />
                    </div>

                    <div>
                        <label>Email</label>
                        <input
                            name="email"
                            type="email"
                            value={teamInviteForm.email}
                            onChange={onTeamInviteChange}
                            placeholder="teammate@company.com"
                            autoComplete="email"
                            required
                        />
                    </div>

                    <div>
                        <label>Role</label>
                        <select
                            name="role"
                            value={teamInviteForm.role || "RECRUITER"}
                            onChange={onTeamInviteChange}
                            required
                        >
                            {TEAM_INVITE_ROLES.map((role) => (
                                <option key={role.value} value={role.value}>
                                    {role.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="submit"
                        className="primary-button"
                        disabled={invitingTeamMember || !canInviteTeamMember}
                    >
                        {invitingTeamMember ? "Sending..." : "Invite Member"}
                    </button>
                </form>

                {!canInviteTeamMember && (
                    <div className="plan-gate">
                        <h3>Team member limit reached</h3>
                        <p>Upgrade the workspace plan or deactivate an existing member before inviting someone new.</p>
                    </div>
                )}
            </section>

            <section className="result-card">
                {teamMembers.length === 0 ? (
                    <div className="empty-state">
                        <h3>No team members yet</h3>
                        <p>Invite another recruiter or hiring manager to collaborate.</p>
                    </div>
                ) : (
                    <div>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Joined</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {teamMembers.map((member) => (
                                    <tr key={member.userId || member.email}>
                                        <td>{member.fullName || "-"}</td>
                                        <td>{member.email}</td>
                                        <td>{member.role}</td>
                                        <td>{member.active === false ? "Deactivated" : "Active"}</td>
                                        <td>
                                            {member.createdAt
                                                ? new Date(member.createdAt).toLocaleDateString()
                                                : "-"}
                                        </td>
                                        <td>
                                            <button
                                                type="button"
                                                className="secondary-button"
                                                onClick={() => onDeactivateMember(member.userId)}
                                                disabled={
                                                    member.active === false ||
                                                    member.userId === currentUserId ||
                                                    teamActionId === member.userId
                                                }
                                            >
                                                {teamActionId === member.userId
                                                    ? "Saving..."
                                                    : "Deactivate"}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <section className="result-card">
                <div className="panel-heading-row">
                    <div>
                        <p className="eyebrow">Invites</p>
                        <h2>Pending Team Invites</h2>
                    </div>
                </div>

                {pendingInvites.length === 0 ? (
                    <div className="empty-state">
                        <h3>No pending invites</h3>
                        <p>Pending team invitations will appear here.</p>
                    </div>
                ) : (
                    <div>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Expires</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingInvites.map((invite) => (
                                    <tr key={invite.inviteId}>
                                        <td>{invite.fullName || "-"}</td>
                                        <td>{invite.email}</td>
                                        <td>{invite.role || "RECRUITER"}</td>
                                        <td>{invite.status}</td>
                                        <td>
                                            {invite.expiresAt
                                                ? new Date(invite.expiresAt).toLocaleDateString()
                                                : "-"}
                                        </td>
                                        <td>
                                            <div className="button-row">
                                                <button
                                                    type="button"
                                                    className="secondary-button"
                                                    onClick={() => onResendInvite(invite.inviteId)}
                                                    disabled={teamActionId === invite.inviteId}
                                                >
                                                    {teamActionId === invite.inviteId
                                                        ? "Sending..."
                                                        : "Resend"}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="secondary-button danger-button"
                                                    onClick={() => onRevokeInvite(invite.inviteId)}
                                                    disabled={teamActionId === invite.inviteId}
                                                >
                                                    Revoke
                                                </button>
                                            </div>
                                        </td>
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

export default TeamSettingsPanel;
