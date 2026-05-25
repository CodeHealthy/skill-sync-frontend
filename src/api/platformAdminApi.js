import axiosClient from "./axiosClient";

export const platformAdminApi = {
    getSummary: () => {
        return axiosClient.get("/platform-admin/summary");
    },
};
