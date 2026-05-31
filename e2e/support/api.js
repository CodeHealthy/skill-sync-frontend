const apiHeaders = {
    "access-control-allow-origin": "http://127.0.0.1:3000",
    "access-control-allow-credentials": "true",
    "access-control-allow-headers": "content-type,x-xsrf-token",
    "access-control-allow-methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS",
};

function jsonResponse(body, status = 200, headers = {}) {
    return {
        status,
        headers: {
            ...apiHeaders,
            "content-type": "application/json",
            ...headers,
        },
        body: JSON.stringify(body),
    };
}

async function fulfillOptions(route) {
    await route.fulfill({ status: 204, headers: apiHeaders });
}

async function installCsrfCookie(page, value = "e2e-csrf-token") {
    await page.context().addCookies([
        {
            name: "XSRF-TOKEN",
            value,
            domain: "127.0.0.1",
            path: "/",
            sameSite: "Lax",
        },
    ]);
}

module.exports = {
    apiHeaders,
    fulfillOptions,
    installCsrfCookie,
    jsonResponse,
};
