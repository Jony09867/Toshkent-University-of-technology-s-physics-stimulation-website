import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".md": "text/plain; charset=utf-8",
};
http
  .createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://localhost");
      const target = path.resolve(root, "." + decodeURIComponent(url.pathname));
      if (
        (target !== root && !target.startsWith(root + path.sep)) ||
        path
          .relative(root, target)
          .split(path.sep)
          .some((p) => p.startsWith("."))
      ) {
        res.writeHead(403).end();
        return;
      }
      const file = (await stat(target)).isDirectory()
        ? path.join(target, "index.html")
        : target;
      res.writeHead(200, {
        "Content-Type": mime[path.extname(file)] || "application/octet-stream",
        "Cache-Control": "no-cache",
        "X-Content-Type-Options": "nosniff",
      });
      res.end(await readFile(file));
    } catch {
      res.writeHead(404).end("Not found");
    }
  })
  .listen(Number(process.env.PORT || 5173), "127.0.0.1", () =>
    console.log(
      "TT Physics Lab: http://127.0.0.1:" + (process.env.PORT || 5173),
    ),
  );
