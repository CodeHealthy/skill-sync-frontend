export function getApiErrorMessage(error, fallbackMessage) {
    const data = error?.response?.data;

    if (!data) {
        return fallbackMessage;
    }

    if (typeof data === "string") {
        return data;
    }

    if (Array.isArray(data.errors) && data.errors.length > 0) {
        return data.errors.join(", ");
    }

    if (data.validationErrors && typeof data.validationErrors === "object") {
        return Object.values(data.validationErrors).join(", ");
    }

    return data.message || data.error || fallbackMessage;
}

export function isAuthRedirectError(error) {
    return Boolean(error?.isAuthRedirect || error?.response?.status === 401);
}
