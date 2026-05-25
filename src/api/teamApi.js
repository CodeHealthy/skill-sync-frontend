import axiosClient from "./axiosClient";

export const teamApi = {
    getTeamMembers: () => {
        return axiosClient.get("/team");
    },

    inviteTeamMember: (payload) => {
        return axiosClient.post("/team/invites", payload);
    },

    getPendingInvites: () => {
        return axiosClient.get("/team/invites");
    },

    resendInvite: (inviteId) => {
        return axiosClient.post(`/team/invites/${inviteId}/resend`);
    },

    revokeInvite: (inviteId) => {
        return axiosClient.post(`/team/invites/${inviteId}/revoke`);
    },

    deactivateMember: (userId) => {
        return axiosClient.patch(`/team/members/${userId}/deactivate`);
    },
};
