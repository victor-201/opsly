import http from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../dist', import.meta.url));
const PORT = Number(process.env.WEB_PORT || 5173);
const UPSTREAM = process.env.API_UPSTREAM || 'http://localhost:3000';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json',
};

function staticHandler(req, res) {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  let filePath = normalize(join(ROOT, urlPath));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
    const index = join(filePath, 'index.html');
    const fallback = join(ROOT, 'index.html');
    filePath = existsSync(index) ? index : existsSync(fallback) ? fallback : null;
    if (!filePath) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
  }
  const type = MIME[extname(filePath)] || 'application/octet-stream';
  res.writeHead(200, {
    'Content-Type': type,
    'Cache-Control': type.includes('text/html') ? 'no-cache' : 'public, max-age=3600',
  });
  createReadStream(filePath).pipe(res);
}

function proxyHandler(req, res) {
  const upstream = new URL(UPSTREAM);
  const upstreamPort = upstream.port || (upstream.protocol === 'https:' ? 443 : 80);
  const proxyReq = http.request(
    {
      hostname: upstream.hostname,
      port: upstreamPort,
      path: req.url,
      method: req.method,
      headers: { ...req.headers, Host: upstream.host },
    },
    (upRes) => {
      res.writeHead(upRes.statusCode || 502, upRes.headers);
      upRes.pipe(res);
    },
  );
  proxyReq.on('error', (err) => {
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ statusCode: 502, message: `Bad gateway: ${err.message}` }));
    }
  });
  req.pipe(proxyReq);
}

http
  .createServer((req, res) => {
    if (req.url && req.url.startsWith('/api/')) proxyHandler(req, res);
    else staticHandler(req, res);
  })
  .listen(PORT, '0.0.0.0', () => {
    console.log(`OPSLY web serving ${ROOT} on ${PORT} (api -> ${UPSTREAM})`);
  });