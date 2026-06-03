import axios from "axios";

const axiosClient = axios.create({
    baseURL: process.env.REACT_APP_API_BASE_URL || "http://localhost:8080/api",
    withCredentials: true,
    xsrfCookieName: "XSRF-TOKEN",
    xsrfHeaderName: "X-XSRF-TOKEN",
    headers: {
        "Content-Type": "application/json",
    },
});

let csrfBootstrapPromise = null;
let csrfTokenValue = null;

function isUnsafeMethod(method) {
    return ["post", "put", "patch", "delete"].includes((method || "get").toLowerCase());
}

function getCookie(name) {
    return document.cookie
        .split(";")
        .map((cookie) => cookie.trim())
        .find((cookie) => cookie.startsWith(`${name}=`))
        ?.split("=")[1];
}

async function ensureCsrfToken() {
    if (csrfTokenValue || getCookie("XSRF-TOKEN")) {
        return;
    }

    if (!csrfBootstrapPromise) {
        csrfBootstrapPromise = axiosClient
            .get("/auth/csrf", {
                skipAuthRedirect: true,
                skipCsrf: true,
            })
            .then((response) => {
                csrfTokenValue = response.data?.token || null;
                return response;
            })
            .finally(() => {
                csrfBootstrapPromise = null;
            });
    }

    await csrfBootstrapPromise;
}

export function clearClientAuthCookies() {
    csrfTokenValue = null;
    csrfBootstrapPromise = null;

    if (typeof document !== "undefined") {
        document.cookie = "XSRF-TOKEN=; Max-Age=0; path=/";
    }
}

axiosClient.interceptors.request.use(async (config) => {
    if (isUnsafeMethod(config.method) && !config.skipCsrf) {
        await ensureCsrfToken();
        const csrfToken = getCookie("XSRF-TOKEN") || csrfTokenValue;

        if (csrfToken) {
            config.headers = config.headers || {};
            config.headers["X-XSRF-TOKEN"] = decodeURIComponent(csrfToken);
        }
    }

    return config;
});

axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && !error.config?.skipAuthRedirect) {
            error.isAuthRedirect = true;
            localStorage.removeItem("skillsync_user");

            if (window.location.pathname !== "/login") {
                sessionStorage.setItem("skillsync_auth_message", "SESSION_EXPIRED");
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);

export default axiosClient;
