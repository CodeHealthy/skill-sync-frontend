import axiosClient from "./axiosClient";

export const authApi = {
    login: (payload) => {
        return axiosClient.post("/auth/login", payload);
    },

    register: (payload) => {
        return axiosClient.post("/auth/register", payload);
    },

    verifyEmail: (token) => {
        return axiosClient.get("/auth/verify-email", {
            params: { token },
        });
    },

    resendVerification: (payload) => {
        return axiosClient.post("/auth/resend-verification", payload);
    },

    forgotPassword: (payload) => {
        return axiosClient.post("/auth/forgot-password", payload);
    },

    resetPassword: (payload) => {
        return axiosClient.post("/auth/reset-password", payload);
    },
};