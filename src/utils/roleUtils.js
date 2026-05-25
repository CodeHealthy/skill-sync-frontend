export const PLATFORM_ADMIN_ROLES = ["SUPER_ADMIN"];
export const ORG_STAFF_ROLES = [
    "ADMIN",
    "ORG_ADMIN",
    "RECRUITER",
    "HIRING_MANAGER",
    "EVALUATOR",
];
export const CANDIDATE_ROLES = ["CANDIDATE"];

export function isPlatformAdminRole(role) {
    return PLATFORM_ADMIN_ROLES.includes(role);
}

export function isOrgStaffRole(role) {
    return ORG_STAFF_ROLES.includes(role);
}

export function isCandidateRole(role) {
    return CANDIDATE_ROLES.includes(role);
}

export function getDashboardPathForRole(role) {
    if (isPlatformAdminRole(role)) {
        return "/super-admin";
    }

    if (isOrgStaffRole(role)) {
        return "/admin";
    }

    if (isCandidateRole(role)) {
        return "/candidate";
    }

    return "/";
}
