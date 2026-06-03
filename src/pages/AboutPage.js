import { Link } from "react-router-dom";


const productPrinciples = [
    "Structured hiring workflows should be clear for recruiters and fair for candidates.",
    "Assessment systems need server-side security, role boundaries, and tenant isolation from the start.",
    "Coding evaluations should provide useful execution feedback without exposing infrastructure risk.",
    "AI-assisted authoring should help humans draft better assessments, not replace review and judgment.",
];

function AboutPage() {
    return (
        <main className="about-page">
            <section className="about-hero">
                <div className="about-hero-copy">
                    <span className="eyebrow">About SkillSync</span>
                    <h1>Built by a software developer focused on practical hiring signals.</h1>
                    <p>
                        SkillSync is being developed by Muhammad Yeshar, a software
                        developer building a professional skills-assessment platform for
                        recruiters, candidates, and hiring teams.
                    </p>

                    <div className="about-hero-actions">
                        <Link to="/register" className="primary-link">
                            Try SkillSync
                        </Link>
                        <a
                            className="secondary-link"
                            href="https://github.com/CodeHealthy"
                            target="_blank"
                            rel="noreferrer"
                        >
                            View GitHub
                        </a>
                    </div>
                </div>

                <aside className="about-profile-card" aria-label="Founder profile">
                    <span className="eyebrow">Founder and Developer</span>
                    <h2>Muhammad Yeshar</h2>
                    <p>Software Developer</p>

                    <div className="about-profile-links">
                        <a href="mailto:iamyeshar@gmail.com">iamyeshar@gmail.com</a>
                        <a
                            href="https://www.linkedin.com/in/iamyeshar"
                            target="_blank"
                            rel="noreferrer"
                        >
                            LinkedIn
                        </a>
                        <a
                            href="https://github.com/CodeHealthy"
                            target="_blank"
                            rel="noreferrer"
                        >
                            GitHub
                        </a>
                    </div>
                </aside>
            </section>

            <section className="about-section about-product-section">
                <div className="about-section-header">
                    <span className="eyebrow">Product Direction</span>
                    <h2>Why SkillSync exists</h2>
                    <p>
                        The goal is to help teams evaluate technical skills through
                        structured assessments, secure code execution, clear scoring,
                        and role-specific workflows.
                    </p>
                </div>

                <div className="about-principles-grid">
                    {productPrinciples.map((principle) => (
                        <article className="about-principle-card" key={principle}>
                            <p>{principle}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section className="about-section">
                <div className="about-story-card">
                    <span className="eyebrow">Professional Background</span>
                    <h2>Experience building business software and platform features</h2>
                    <p>
                        Muhammad works as a Software Developer, where he has contributed to business automation products,
                        KPI and scorecard systems, plugin enhancements, database logic,
                        billing architecture, and custom domain provisioning.
                    </p>
                    <p>
                        That experience shapes SkillSync as a product with practical
                        SaaS concerns: authentication, organization scoping, billing,
                        deployment, assessment integrity, and maintainable workflows.
                    </p>
                </div>

                
            </section>


            <section className="about-final-cta">
                <div>
                    <span className="eyebrow">Product Status</span>
                    <h2>SkillSync is evolving into a serious assessment platform.</h2>
                    <p>
                        The platform already supports organization workspaces,
                        candidate invitations, assessments, code execution,
                        authentication, role-based access, and AI-assisted assessment
                        drafting, with more production-readiness work underway.
                    </p>
                </div>

                <Link to="/pricing" className="secondary-link">
                    View Plans
                </Link>
            </section>
        </main>
    );
}

export default AboutPage;
