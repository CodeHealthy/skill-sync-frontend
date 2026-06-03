import axiosClient, { clearClientAuthCookies } from "./axiosClient";

const originalAdapter = axiosClient.defaults.adapter;

function clearCookies() {
    document.cookie.split(";").forEach((cookie) => {
        const name = cookie.split("=")[0].trim();
        if (name) {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        }
    });
}

function successfulResponse(config, data = {}) {
    return Promise.resolve({
        data,
        status: 200,
        statusText: "OK",
        headers: {},
        config,
    });
}

describe("axiosClient", () => {
    beforeEach(() => {
        clearClientAuthCookies();
        clearCookies();
        localStorage.clear();
        sessionStorage.clear();
    });

    afterEach(() => {
        axiosClient.defaults.adapter = originalAdapter;
        clearCookies();
        jest.restoreAllMocks();
    });

    test("uses cookie-backed sessions instead of bearer tokens", () => {
        expect(axiosClient.defaults.withCredentials).toBe(true);
        expect(axiosClient.defaults.headers.common.Authorization).toBeUndefined();
        expect(localStorage.getItem("skillsync_token")).toBeNull();
    });

    test("bootstraps CSRF cookie before unsafe requests and sends XSRF header", async () => {
        const seenRequests = [];

        axiosClient.defaults.adapter = jest.fn((config) => {
            seenRequests.push(config);

            if (config.url === "/auth/csrf") {
                document.cookie = "XSRF-TOKEN=csrf-token-123; path=/";
                return successfulResponse(config, { headerName: "X-XSRF-TOKEN" });
            }

            return successfulResponse(config, { saved: true });
        });

        await axiosClient.post("/assessments", { title: "Java Basics" });

        expect(seenRequests.map((request) => request.url)).toEqual([
            "/auth/csrf",
            "/assessments",
        ]);
        expect(seenRequests[1].headers["X-XSRF-TOKEN"]).toBe("csrf-token-123");
    });

    test("uses CSRF token from bootstrap response when cookie is cross-domain", async () => {
        const seenRequests = [];

        axiosClient.defaults.adapter = jest.fn((config) => {
            seenRequests.push(config);

            if (config.url === "/auth/csrf") {
                return successfulResponse(config, {
                    headerName: "X-XSRF-TOKEN",
                    token: "response-token-456",
                });
            }

            return successfulResponse(config, { saved: true });
        });

        await axiosClient.post("/auth/login", {
            email: "admin@example.com",
            password: "password",
        });

        expect(seenRequests.map((request) => request.url)).toEqual([
            "/auth/csrf",
            "/auth/login",
        ]);
        expect(seenRequests[1].headers["X-XSRF-TOKEN"]).toBe("response-token-456");
    });

    test("does not bootstrap CSRF for safe requests", async () => {
        const seenRequests = [];

        axiosClient.defaults.adapter = jest.fn((config) => {
            seenRequests.push(config);
            return successfulResponse(config, { ok: true });
        });

        await axiosClient.get("/profile");

        expect(seenRequests).toHaveLength(1);
        expect(seenRequests[0].url).toBe("/profile");
    });

    test("clears readable CSRF cookie and cached token on logout cleanup", async () => {
        const seenRequests = [];

        axiosClient.defaults.adapter = jest.fn((config) => {
            seenRequests.push(config);

            if (config.url === "/auth/csrf") {
                return successfulResponse(config, {
                    headerName: "X-XSRF-TOKEN",
                    token: "cached-token-before-logout",
                });
            }

            return successfulResponse(config, { saved: true });
        });

        await axiosClient.post("/auth/login", {
            email: "admin@example.com",
            password: "password",
        });

        clearClientAuthCookies();

        await axiosClient.post("/auth/login", {
            email: "admin@example.com",
            password: "password",
        });

        expect(seenRequests.map((request) => request.url)).toEqual([
            "/auth/csrf",
            "/auth/login",
            "/auth/csrf",
            "/auth/login",
        ]);
    });
});
