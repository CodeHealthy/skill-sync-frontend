export const PASSWORD_RULES = [
    {
        key: "length",
        label: "At least 10 characters",
        test: (password) => password.length >= 10,
    },
    {
        key: "uppercase",
        label: "At least one uppercase letter",
        test: (password) => /[A-Z]/.test(password),
    },
    {
        key: "lowercase",
        label: "At least one lowercase letter",
        test: (password) => /[a-z]/.test(password),
    },
    {
        key: "number",
        label: "At least one number",
        test: (password) => /\d/.test(password),
    },
    {
        key: "special",
        label: "At least one special character",
        test: (password) => /[^A-Za-z0-9]/.test(password),
    },
];

export function getPasswordChecks(password) {
    return PASSWORD_RULES.map((rule) => ({
        ...rule,
        passed: rule.test(password || ""),
    }));
}

export function isStrongPassword(password) {
    return getPasswordChecks(password).every((check) => check.passed);
}