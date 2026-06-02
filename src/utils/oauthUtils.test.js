import { buildGoogleOAuthUrl, OAUTH_FLOWS } from "./oauthUtils";

describe("oauthUtils", () => {
    const originalApiBaseUrl = process.env.REACT_APP_API_BASE_URL;

    afterEach(() => {
        process.env.REACT_APP_API_BASE_URL = originalApiBaseUrl;
    });

    test("builds public Google OAuth URL from API base URL", () => {
        process.env.REACT_APP_API_BASE_URL = "https://api.example.com/api";

        const url = new URL(buildGoogleOAuthUrl());

        expect(url.origin).toBe("https://api.example.com");
        expect(url.pathname).toBe("/oauth2/authorization/google");
        expect(url.searchParams.get("skillsync_oauth_flow")).toBe(OAUTH_FLOWS.PUBLIC);
    });

    test("includes invite context for Google OAuth invite signup", () => {
        process.env.REACT_APP_API_BASE_URL = "https://api.example.com/api";

        const url = new URL(
            buildGoogleOAuthUrl({
                flow: OAUTH_FLOWS.TEAM_INVITE,
                inviteToken: "invite-token",
            })
        );

        expect(url.searchParams.get("skillsync_oauth_flow")).toBe(OAUTH_FLOWS.TEAM_INVITE);
        expect(url.searchParams.get("skillsync_invite_token")).toBe("invite-token");
    });
});
