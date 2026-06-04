import { Link } from "react-router-dom";
import "../../css/DashboardPanels.css";

function CandidateProfilePanel({ user }) {
    return (
        <div className="profile-panel">
            <div className="profile-card">
                <ProfileAvatar name={user?.fullName} imageUrl={user?.profileImageUrl} />

                <div className="profile-card-content">
                    <p className="eyebrow">Candidate</p>
                    <h2>{user?.fullName || "Candidate User"}</h2>
                    <p>{user?.email || "No email available"}</p>

                    <div className="profile-detail-grid">
                        <ProfileDetail label="Role" value={user?.role || "CANDIDATE"} />
                        <ProfileDetail label="Account" value="SkillSync candidate" />
                    </div>

                    <div className="button-row-left">
                        <Link className="primary-link" to="/profile">
                            Edit Profile
                        </Link>
                        <Link className="secondary-link" to="/profile">
                            Change Password
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ProfileAvatar({ name, imageUrl }) {
    const initials = (name || "Candidate User")
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    return (
        <div className="profile-avatar-large">
            {imageUrl ? <img src={imageUrl} alt="" /> : initials}
        </div>
    );
}

function ProfileDetail({ label, value }) {
    return (
        <div className="profile-detail-item">
            <span>{label}</span>
            <strong>{value}</strong>
        </div>
    );
}

export default CandidateProfilePanel;
