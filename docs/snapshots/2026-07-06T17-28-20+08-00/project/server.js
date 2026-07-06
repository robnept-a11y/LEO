const fs = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");

const rootDir = __dirname;
const siteDir = path.join(rootDir, "site");
const docsDir = path.join(rootDir, "docs", "leo-project-baseline");
const changeLogDir = path.join(rootDir, "docs", "change-log");
const port = Number(process.env.PORT || 4173);

const contentTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".md", "text/markdown; charset=utf-8"],
]);

function send(response, status, body, contentType = "text/plain; charset=utf-8") {
  response.writeHead(status, {
    "content-type": contentType,
    "cache-control": "no-store",
  });
  response.end(body);
}

function isInside(parent, child) {
  const relative = path.relative(parent, child);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

async function serveStatic(requestPath, response) {
  const normalizedPath = requestPath === "/" ? "/index.html" : requestPath;
  const filePath = path.normalize(path.join(siteDir, normalizedPath));

  if (!isInside(siteDir, filePath)) {
    send(response, 403, "禁止访问");
    return;
  }

  try {
    const body = await fs.readFile(filePath);
    send(response, 200, body, contentTypes.get(path.extname(filePath)) || "application/octet-stream");
  } catch (error) {
    if (error.code === "ENOENT") {
      send(response, 404, "未找到");
      return;
    }
    send(response, 500, `服务器错误：${error.message}`);
  }
}

async function serveApi(url, response) {
  if (url.pathname === "/api/index") {
    const body = await fs.readFile(path.join(docsDir, "index.json"), "utf8");
    send(response, 200, body, "application/json; charset=utf-8");
    return;
  }

  if (url.pathname === "/api/changelog") {
    const body = await fs.readFile(path.join(changeLogDir, "index.json"), "utf8");
    send(response, 200, body, "application/json; charset=utf-8");
    return;
  }

  if (url.pathname.startsWith("/api/doc/")) {
    const fileName = decodeURIComponent(url.pathname.replace("/api/doc/", ""));
    const filePath = path.normalize(path.join(docsDir, fileName));

    if (!isInside(docsDir, filePath) || path.extname(filePath) !== ".md") {
      send(response, 403, "禁止访问");
      return;
    }

    const body = await fs.readFile(filePath, "utf8");
    send(response, 200, body, "text/markdown; charset=utf-8");
    return;
  }

  send(response, 404, "未找到");
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);

    if (url.pathname.startsWith("/api/")) {
      await serveApi(url, response);
      return;
    }

    await serveStatic(url.pathname, response);
  } catch (error) {
    send(response, 500, `服务器错误：${error.message}`);
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`LEO 本地查看器：http://127.0.0.1:${port}`);
});
