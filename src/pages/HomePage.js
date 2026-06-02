import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
    getPostAuthPathForUser,
    isOrgStaffRole,
    isPlatformAdminRole,
} from "../utils/roleUtils";

function HomePage() {
    const { user, isAuthenticated } = useAuth();

    const dashboardPath = getPostAuthPathForUser(user);
    const dashboardLabel = isPlatformAdminRole(user?.role)
        ? "Go to Super Admin"
        : isOrgStaffRole(user?.role)
            ? "Go to Admin Dashboard"
            : "Go to Candidate Portal";

    return (
        <main className="landing-page">
            <section className="landing-hero">
                <div className="landing-hero-content">
                    <div className="landing-badge">
                        Automated Talent Skill-Validator
                    </div>

                    <h1>
                        Validate technical talent with structured assessments,
                        code execution, and clear hiring signals.
                    </h1>

                    <p>
                        SkillSync helps recruiters create assessments, invite
                        candidates, run coding submissions safely, and review results
                        across multiple organizations.
                    </p>

                    <div className="landing-actions">
                        {!isAuthenticated && (
                            <>
                                <Link to="/register" className="primary-link landing-primary">
                                    Get Started
                                </Link>
                                <Link to="/login" className="secondary-link landing-secondary">
                                    Login
                                </Link>
                            </>
                        )}

                        {isAuthenticated && (
                            <Link to={dashboardPath} className="primary-link landing-primary">
                                {dashboardLabel}
                            </Link>
                        )}
                    </div>

                    <div className="landing-trust-row">
                        <span>Multi-tenant</span>
                        <span>Docker execution</span>
                        <span>JWT secured</span>
                        <span>Candidate portals</span>
                    </div>
                </div>

                <div className="landing-hero-panel">
                    <div className="hero-panel-top">
                        <span className="hero-panel-dot" />
                        <span className="hero-panel-dot" />
                        <span className="hero-panel-dot" />
                    </div>

                    <div className="hero-panel-card">
                        <div>
                            <span className="hero-panel-label">Assessment</span>
                            <strong>Java Coding Challenge</strong>
                        </div>
                        <span className="status-badge status-submitted">Submitted</span>
                    </div>

                    <div className="hero-code-preview">
                        <pre>{`public class Main {
  public static void main(String[] args) {
    System.out.println("Hello SkillSync");
  }
}`}</pre>
                    </div>

                    <div className="hero-panel-grid">
                        <div>
                            <span>Execution</span>
                            <strong>Passed</strong>
                        </div>
                        <div>
                            <span>Score</span>
                            <strong>100</strong>
                        </div>
                        <div>
                            <span>Feedback</span>
                            <strong>Ready</strong>
                        </div>
                    </div>
                </div>
            </section>

            <section id="features" className="landing-section">
                <div className="landing-section-header">
                    <span className="eyebrow">Platform Features</span>
                    <h2>Everything needed to run technical assessments</h2>
                    <p>
                        Create, assign, execute, and grade assessments from one
                        organized workspace.
                    </p>
                </div>

                <div className="landing-feature-grid">
                    <div className="landing-feature-card">
                        <div className="feature-icon" aria-hidden="true">Org</div>
                        <h3>Organization Workspaces</h3>
                        <p>
                            Keep candidates, assessments, assignments, and results
                            scoped to each organization.
                        </p>
                    </div>

                    <div className="landing-feature-card">
                        <div className="feature-icon" aria-hidden="true">Code</div>
                        <h3>Coding Challenges</h3>
                        <p>
                            Support Java, JavaScript, and Python submissions with
                            controlled Docker-based execution.
                        </p>
                    </div>

                    <div className="landing-feature-card">
                        <div className="feature-icon" aria-hidden="true">Score</div>
                        <h3>Results & Grading</h3>
                        <p>
                            Review submitted answers, execution output, errors, scores,
                            and recruiter feedback.
                        </p>
                    </div>

                    <div className="landing-feature-card">
                        <div className="feature-icon" aria-hidden="true">Auth</div>
                        <h3>Secure Access</h3>
                        <p>
                            Role-based access keeps admin and candidate workflows
                            separated and protected.
                        </p>
                    </div>
                </div>
            </section>

            <section className="landing-split-section">
                <div id="recruiters" className="landing-split-card">
                    <span className="eyebrow">For Recruiters</span>
                    <h2>Manage assessments with confidence</h2>
                    <p>
                        Invite candidates, build MCQ, short-answer, or coding assessments, assign
                        tests, execute submissions, and manually grade results when
                        needed.
                    </p>

                    <ul className="landing-check-list">
                        <li>Create reusable assessment templates</li>
                        <li>Assign tests to invited candidates</li>
                        <li>Run Docker grading from the admin dashboard</li>
                        <li>Track candidate progress and final scores</li>
                    </ul>

                    {!isAuthenticated && (
                        <Link to="/register" className="primary-link">
                            Start as Recruiter
                        </Link>
                    )}
                </div>

                <div id="candidates" className="landing-split-card landing-split-card-dark">
                    <span className="eyebrow">For Candidates</span>
                    <h2>Take assessments from a clean portal</h2>
                    <p>
                        Candidates can view assigned assessments, write answers, run
                        code before final submission, and review feedback after grading.
                    </p>

                    <ul className="landing-check-list">
                        <li>See assignments across organizations</li>
                        <li>Run code before final submission</li>
                        <li>Submit MCQ answers, short responses, or coding solutions</li>
                        <li>Review scores, output, and feedback</li>
                    </ul>

                    {!isAuthenticated && (
                        <Link to="/login" className="secondary-link">
                            Candidate Login
                        </Link>
                    )}
                </div>
            </section>

            <section className="landing-final-cta">
                <div>
                    <span className="eyebrow">Ready to build better assessments?</span>
                    <h2>Start validating technical skills with SkillSync.</h2>
                    <p>
                        Build a structured hiring workflow from invitation to final
                        result.
                    </p>
                </div>

                {!isAuthenticated ? (
                    <div className="landing-actions">
                        <Link to="/register" className="primary-link landing-primary">
                            Create Account
                        </Link>
                        <Link to="/login" className="secondary-link landing-secondary">
                            Login
                        </Link>
                    </div>
                ) : (
                    <Link to={dashboardPath} className="primary-link landing-primary">
                        Open Dashboard
                    </Link>
                )}
            </section>
        </main>
    );
}

export default HomePage;
