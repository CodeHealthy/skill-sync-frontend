import { useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { profileApi } from "../api/profileApi";
import { getApiErrorMessage } from "../utils/errorUtils";
import { getPasswordChecks, isStrongPassword } from "../utils/passwordUtils";
import { showError, showSuccess, showWarning } from "../utils/toastUtils";

function ProfilePage() {
    const { user, updateAuthData } = useAuth();

    const [profileForm, setProfileForm] = useState({
        fullName: user?.fullName || "",
        email: user?.email || "",
        role: user?.role || "",
    });

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
    });

    const [savingProfile, setSavingProfile] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);

    const passwordChecks = useMemo(
        () => getPasswordChecks(passwordForm.newPassword),
        [passwordForm.newPassword]
    );

    const handleProfileChange = (event) => {
        setProfileForm((current) => ({
            ...current,
            [event.target.name]: event.target.value,
        }));
    };

    const handlePasswordChange = (event) => {
        setPasswordForm((current) => ({
            ...current,
            [event.target.name]: event.target.value,
        }));
    };

    const handleProfileSubmit = async (event) => {
        event.preventDefault();

        if (savingProfile) {
            return;
        }

        if (!profileForm.fullName.trim()) {
            showWarning("Full name is required.");
            return;
        }

        setSavingProfile(true);

        try {
            const response = await profileApi.updateProfile({
                fullName: profileForm.fullName.trim(),
            });

            updateAuthData(response.data);
            showSuccess("Profile updated successfully.");
        } catch (err) {
            showError(getApiErrorMessage(err, "Failed to update profile"));
        } finally {
            setSavingProfile(false);
        }
    };

    const handlePasswordSubmit = async (event) => {
        event.preventDefault();

        if (changingPassword) {
            return;
        }

        if (!passwordForm.currentPassword) {
            showWarning("Current password is required.");
            return;
        }

        if (!isStrongPassword(passwordForm.newPassword)) {
            showWarning(
                "New password must include 10+ characters, uppercase, lowercase, number, and special character."
            );
            return;
        }

        if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
            showWarning("New passwords do not match.");
            return;
        }

        setChangingPassword(true);

        try {
            await profileApi.changePassword({
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
            });

            setPasswordForm({
                currentPassword: "",
                newPassword: "",
                confirmNewPassword: "",
            });

            showSuccess("Password updated successfully.");
        } catch (err) {
            showError(getApiErrorMessage(err, "Failed to update password"));
        } finally {
            setChangingPassword(false);
        }
    };

    return (
        <div className="page-container profile-page">
            <div className="dashboard-header">
                <div>
                    <p className="eyebrow">Account Settings</p>
                    <h1>Profile</h1>
                    <p>Manage your SkillSync account information.</p>
                </div>
            </div>

            <div className="profile-grid">
                <div className="form-card compact-form-card">
                    <h2>Profile Information</h2>
                    <p className="small-text">
                        Update your display name. Email changes require verification and
                        are not available yet.
                    </p>

                    <form onSubmit={handleProfileSubmit}>
                        <label>Full Name</label>
                        <input
                            name="fullName"
                            value={profileForm.fullName}
                            onChange={handleProfileChange}
                            required
                        />

                        <label>Email</label>
                        <input
                            name="email"
                            type="email"
                            value={profileForm.email}
                            disabled
                        />

                        <label>Role</label>
                        <input
                            name="role"
                            value={profileForm.role}
                            disabled
                        />

                        <button
                            type="submit"
                            className="primary-button"
                            disabled={savingProfile}
                        >
                            {savingProfile ? "Saving..." : "Save Profile"}
                        </button>
                    </form>
                </div>

                <div className="form-card compact-form-card">
                    <h2>Change Password</h2>
                    <p className="small-text">
                        Use a strong password that you do not use elsewhere.
                    </p>

                    <form onSubmit={handlePasswordSubmit}>
                        <label>Current Password</label>
                        <input
                            name="currentPassword"
                            type="password"
                            value={passwordForm.currentPassword}
                            onChange={handlePasswordChange}
                            autoComplete="current-password"
                            required
                        />

                        <label>New Password</label>
                        <input
                            name="newPassword"
                            type="password"
                            value={passwordForm.newPassword}
                            onChange={handlePasswordChange}
                            autoComplete="new-password"
                            required
                        />

                        <div className="password-checklist">
                            {passwordChecks.map((check) => (
                                <div
                                    key={check.key}
                                    className={
                                        check.passed
                                            ? "password-check passed"
                                            : "password-check"
                                    }
                                >
                                    <span>{check.passed ? "OK" : "-"}</span>
                                    {check.label}
                                </div>
                            ))}
                        </div>

                        <label>Confirm New Password</label>
                        <input
                            name="confirmNewPassword"
                            type="password"
                            value={passwordForm.confirmNewPassword}
                            onChange={handlePasswordChange}
                            autoComplete="new-password"
                            required
                        />

                        {passwordForm.confirmNewPassword && (
                            <p
                                className={
                                    passwordForm.newPassword ===
                                        passwordForm.confirmNewPassword
                                        ? "field-hint success-hint"
                                        : "field-hint error-hint"
                                }
                            >
                                {passwordForm.newPassword ===
                                    passwordForm.confirmNewPassword
                                    ? "Passwords match."
                                    : "Passwords do not match."}
                            </p>
                        )}

                        <button
                            type="submit"
                            className="primary-button"
                            disabled={changingPassword}
                        >
                            {changingPassword ? "Updating..." : "Update Password"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;
