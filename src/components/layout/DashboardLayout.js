import { useState, useEffect } from "react";
import "../../css/DashboardLayout.css";

const iconPaths = {
    overview: (
        <>
            <path d="M4 13h6V4H4v9Z" />
            <path d="M14 20h6V4h-6v16Z" />
            <path d="M4 20h6v-3H4v3Z" />
        </>
    ),
    candidates: (
        <>
            <path d="M16 11a4 4 0 1 0-3.5-5.94" />
            <path d="M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
            <path d="M2 20a6 6 0 0 1 12 0" />
            <path d="M14 15a5 5 0 0 1 6 5" />
        </>
    ),
    assessment: (
        <>
            <path d="M5 4h14v16H5V4Z" />
            <path d="M8 8h8" />
            <path d="M8 12h8" />
            <path d="M8 16h5" />
        </>
    ),
    assignments: (
        <>
            <path d="M6 4h12v16H6V4Z" />
            <path d="M9 8h6" />
            <path d="M9 12h6" />
            <path d="M9 16h3" />
        </>
    ),
    results: (
        <>
            <path d="M4 18h16" />
            <path d="M7 15v-4" />
            <path d="M12 15V7" />
            <path d="M17 15V9" />
        </>
    ),
    profile: (
        <>
            <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
            <path d="M4 20a8 8 0 0 1 16 0" />
        </>
    ),
};

function DashboardIcon({ name, className }) {
    const paths = iconPaths[name];

    if (!paths) {
        return null;
    }

    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {paths}
        </svg>
    );
}

/**
 * DashboardLayout: Provides a consistent sidebar + main content area layout
 * Features:
 * - Collapsible sidebar (hamburger on mobile, always visible on desktop)
 * - Smooth transitions
 * - Tab navigation
 * - Responsive design
 */
function DashboardLayout({
    tabs,
    activeTabId,
    onTabChange,
    userRole, // "admin" or "candidate"
    userName,
    userTitle,
}) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (!mobile) {
                setSidebarOpen(true);
            }
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const toggleSidebar = () => {
        setSidebarOpen((prev) => !prev);
    };

    const toggleSidebarCollapsed = () => {
        setSidebarCollapsed((current) => !current);
    };

    const closeSidebarOnMobile = () => {
        if (isMobile) {
            setSidebarOpen(false);
        }
    };

    const activeTab = tabs.find((tab) => tab.id === activeTabId);

    return (
        <div
            className={`dashboard-layout dashboard-${userRole} ${
                !isMobile && sidebarCollapsed ? "sidebar-collapsed" : ""
            }`}
        >
            <aside className={`dashboard-sidebar ${sidebarOpen ? "open" : "closed"}`}>
                <div className="sidebar-header">
                    <div className="sidebar-user-info">
                        <div className="sidebar-user-avatar">
                            {userName
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase() || "U"}
                        </div>
                        <div className="sidebar-user-details">
                            <p className="sidebar-user-name">{userName || "User"}</p>
                            <p className="sidebar-user-role">{userTitle || userRole}</p>
                        </div>
                    </div>

                    {!isMobile && (
                        <button
                            type="button"
                            className="sidebar-collapse-button"
                            onClick={toggleSidebarCollapsed}
                            aria-label={
                                sidebarCollapsed
                                    ? "Expand sidebar"
                                    : "Collapse sidebar"
                            }
                            title={
                                sidebarCollapsed
                                    ? "Expand sidebar"
                                    : "Collapse sidebar"
                            }
                        >
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                            >
                                {sidebarCollapsed ? (
                                    <path d="M9 6l6 6-6 6" />
                                ) : (
                                    <path d="M15 6l-6 6 6 6" />
                                )}
                            </svg>
                        </button>
                    )}
                </div>

                <nav className="sidebar-nav">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            className={`sidebar-tab ${activeTabId === tab.id ? "active" : ""}`}
                            onClick={() => {
                                onTabChange(tab.id);
                                closeSidebarOnMobile();
                            }}
                            title={tab.label}
                        >
                            <DashboardIcon name={tab.icon} className="tab-icon" />
                            <span className="tab-label">{tab.label}</span>
                        </button>
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <div className="dashboard-main">
                {/* Header Bar */}
                <div className="dashboard-header-bar">
                    <button
                        className="sidebar-toggle"
                        onClick={toggleSidebar}
                        title="Toggle sidebar"
                        aria-label="Toggle navigation"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path
                                d="M3 6H21M3 12H21M3 18H21"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                        </svg>
                    </button>

                    {activeTab && (
                        <div className="header-title-section">
                            <DashboardIcon
                                name={activeTab.icon}
                                className="header-icon"
                            />
                            <h1 className="header-title">{activeTab.label}</h1>
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div className="dashboard-content">
                    {activeTab ? (
                        <div className="tab-content-wrapper">
                            {activeTab.content}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <h3>Select a section</h3>
                            <p>Choose a tab from the sidebar to get started.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Sidebar Backdrop */}
            {isMobile && sidebarOpen && (
                <div
                    className="dashboard-backdrop"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    );
}

export default DashboardLayout;
