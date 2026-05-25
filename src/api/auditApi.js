import axiosClient from "./axiosClient";

export const auditApi = {
    getOrganizationLogs: (params = {}) => {
        return axiosClient.get("/audit-logs", { params });
    },

    getPlatformLogs: (params = {}) => {
        return axiosClient.get("/platform-admin/audit-logs", { params });
    },
};
