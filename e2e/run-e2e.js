const { spawn } = require("child_process");
const http = require("http");

const isWindows = process.platform === "win32";
const playwrightCommand = isWindows ? "cmd" : "npx";
const playwrightArgs = isWindows
    ? ["/c", "npx", "playwright", "test"]
    : ["playwright", "test"];
const serverProcess = spawn(
    process.execPath,
    ["e2e/static-server.js", "build", "3000"],
    {
        stdio: "inherit",
        windowsHide: true,
    }
);

function waitForServer() {
    const startedAt = Date.now();

    return new Promise((resolve, reject) => {
        const check = () => {
            const request = http.get("http://127.0.0.1:3000", (response) => {
                response.resume();
                resolve();
            });

            request.on("error", () => {
                if (Date.now() - startedAt > 30000) {
                    reject(new Error("Timed out waiting for E2E static server."));
                    return;
                }

                setTimeout(check, 250);
            });
        };

        check();
    });
}

function stopServer() {
    if (!serverProcess.killed) {
        serverProcess.kill();
    }
}

async function run() {
    try {
        await waitForServer();

        const testProcess = spawn(playwrightCommand, playwrightArgs, {
            stdio: "inherit",
        });

        testProcess.on("exit", (code) => {
            stopServer();
            process.exit(code ?? 1);
        });
    } catch (error) {
        console.error(error.message);
        stopServer();
        process.exit(1);
    }
}

process.on("SIGINT", () => {
    stopServer();
    process.exit(130);
});

process.on("SIGTERM", () => {
    stopServer();
    process.exit(143);
});

run();
