const OAUTH_FLOW_PARAM = "skillsync_oauth_flow";
const OAUTH_INVITE_TOKEN_PARAM = "skillsync_invite_token";

export const OAUTH_FLOWS = {
    PUBLIC: "public",
    CANDIDATE_INVITE: "candidate-invite",
    TEAM_INVITE: "team-invite",
};

export function buildGoogleOAuthUrl({ flow = OAUTH_FLOWS.PUBLIC, inviteToken } = {}) {
    const apiBaseUrl =
        process.env.REACT_APP_API_BASE_URL || "http://localhost:8080/api";
    const authUrl = new URL(
        `${apiBaseUrl.replace(/\/api\/?$/, "")}/oauth2/authorization/google`
    );

    authUrl.searchParams.set(OAUTH_FLOW_PARAM, flow);

    if (inviteToken) {
        authUrl.searchParams.set(OAUTH_INVITE_TOKEN_PARAM, inviteToken);
    }

    return authUrl.toString();
}
