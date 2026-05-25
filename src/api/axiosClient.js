import axios from "axios";

const axiosClient = axios.create({
    baseURL: process.env.REACT_APP_API_BASE_URL || "http://localhost:8080/api",
    headers: {
        "Content-Type": "application/json",
    },
});

axiosClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("skillsync_token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            error.isAuthRedirect = true;
            localStorage.removeItem("skillsync_token");
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
