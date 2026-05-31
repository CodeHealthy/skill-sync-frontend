const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(process.cwd(), process.argv[2] || "build");
const port = Number(process.argv[3] || 3000);

const contentTypes = {
    ".css": "text/css",
    ".html": "text/html",
    ".ico": "image/x-icon",
    ".js": "application/javascript",
    ".json": "application/json",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".txt": "text/plain",
    ".webmanifest": "application/manifest+json",
};

function resolveRequestPath(requestUrl) {
    const parsedUrl = new URL(requestUrl, `http://127.0.0.1:${port}`);
    const requestedPath = decodeURIComponent(parsedUrl.pathname);
    const normalizedPath = path.normalize(requestedPath).replace(/^(\.\.[/\\])+/, "");
    const absolutePath = path.join(root, normalizedPath);

    if (!absolutePath.startsWith(root)) {
        return path.join(root, "index.html");
    }

    if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile()) {
        return absolutePath;
    }

    return path.join(root, "index.html");
}

const server = http.createServer((request, response) => {
    const filePath = resolveRequestPath(request.url);
    const extension = path.extname(filePath);

    fs.readFile(filePath, (error, content) => {
        if (error) {
            response.writeHead(404, { "content-type": "text/plain" });
            response.end("Not found");
            return;
        }

        response.writeHead(200, {
            "content-type": contentTypes[extension] || "application/octet-stream",
        });
        response.end(content);
    });
});

server.listen(port, "127.0.0.1", () => {
    console.log(`Serving ${root} at http://127.0.0.1:${port}`);
});

function shutdown() {
    server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
