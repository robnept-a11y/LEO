const fs = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");

const rootDir = path.join(__dirname, "dist");
const port = Number(process.env.PORT || 4174);

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

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const requestPath = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = path.normalize(path.join(rootDir, requestPath));

  if (!isInside(rootDir, filePath)) {
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
});

server.listen(port, "127.0.0.1", () => {
  console.log(`LEO 静态预览：http://127.0.0.1:${port}`);
});
