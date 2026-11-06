// Pepper Nursery IoT - Local Dev & Proxy Server (Zero dependencies)
// DKhoa - Phase 2 & 3: Kết nối API Backend của TDat

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// 1. Đọc cấu hình từ file .env (nếu có) không cần thư viện ngoài
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  const envVars = {};
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim();
        envVars[key] = val;
      }
    }
  }
  return envVars;
}

const env = loadEnv();
const PORT = process.env.PORT || env.PORT || 3000;
const API_BASE_URL = (process.env.API_BASE_URL || env.API_BASE_URL || 'https://pepper-nursery-iot.onrender.com').replace(/\/+$/, '');
const DATA_MODE = process.env.DATA_MODE || env.DATA_MODE || 'REAL_API';
const DEFAULT_DEVICE_ID = process.env.DEFAULT_DEVICE_ID || env.DEFAULT_DEVICE_ID || 'esp32-nursery-01';
const AUTO_REFRESH_INTERVAL_MS = parseInt(process.env.AUTO_REFRESH_INTERVAL_MS || env.AUTO_REFRESH_INTERVAL_MS || '10000', 10);

const PUBLIC_DIR = __dirname;
const FIXTURES_DIR = path.resolve(__dirname, '../docs/contracts/fixtures');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png'
};

function loadFixture(filename) {
  const filepath = path.join(FIXTURES_DIR, filename);
  try {
    const raw = fs.readFileSync(filepath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

// Hàm proxy chuyển tiếp request sang Backend TDat (Hỗ trợ cả HTTP và HTTPS)
function proxyToBackend(req, res, targetUrl) {
  const target = new URL(targetUrl);
  const isHttps = target.protocol === 'https:';
  const client = isHttps ? https : http;

  const headers = { ...req.headers };
  headers.host = target.host;

  const options = {
    hostname: target.hostname,
    port: target.port || (isHttps ? 443 : 80),
    path: req.url,
    method: req.method,
    headers: headers
  };

  const proxyReq = client.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: {
        code: 'backend_unreachable',
        message: `Không thể kết nối Backend tại ${API_BASE_URL}: ${err.message}`
      }
    }));
  });

  req.pipe(proxyReq);
}

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization, x-use-fixture');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Cung cấp endpoint cấu hình cho trình duyệt
  if (pathname === '/api/config') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      port: PORT,
      apiBaseUrl: API_BASE_URL,
      dataMode: DATA_MODE,
      defaultDeviceId: DEFAULT_DEVICE_ID,
      autoRefreshIntervalMs: AUTO_REFRESH_INTERVAL_MS,
      timeZone: env.TIMEZONE || 'Asia/Ho_Chi_Minh'
    }));
    return;
  }

  // --- Chuyển tiếp (Proxy) hoặc Phục vụ Mock API ---
  if (pathname.startsWith('/api/v1/')) {
    // Nếu có header x-use-fixture hoặc query ?use_fixture=true thì dùng mock
    const useFixture = parsedUrl.searchParams.get('use_fixture') === 'true' || req.headers['x-use-fixture'] === 'true';

    if (!useFixture && API_BASE_URL) {
      // Chuyển tiếp tới Backend TDat
      proxyToBackend(req, res, API_BASE_URL);
      return;
    }

    // Xử lý Mock API nội bộ
    const latestMatch = pathname.match(/^\/api\/v1\/devices\/([^/]+)\/readings\/latest$/);
    if (latestMatch && req.method === 'GET') {
      const deviceId = latestMatch[1];
      const scenario = parsedUrl.searchParams.get('scenario') || 'normal';

      if (deviceId === 'esp32-unknown' || scenario === 'not_found') {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: { code: 'device_not_found', message: `Device '${deviceId}' does not exist` } }));
        return;
      }

      if (deviceId === 'esp32-empty-01' || scenario === 'empty') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(loadFixture('latest-empty.json')));
        return;
      }

      if (deviceId === 'esp32-stale-01' || scenario === 'stale') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(loadFixture('latest-stale.json')));
        return;
      }

      let fixtureName = 'latest-normal.json';
      if (scenario === 'uncalibrated') fixtureName = 'latest-uncalibrated.json';
      else if (scenario === 'partial_error') fixtureName = 'latest-partial-error.json';

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(loadFixture(fixtureName)));
      return;
    }

    const historyMatch = pathname.match(/^\/api\/v1\/devices\/([^/]+)\/readings$/);
    if (historyMatch && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(loadFixture('history.json')));
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: { code: 'route_not_found', message: `Endpoint ${pathname} không tồn tại` } }));
    return;
  }

  // --- Phục vụ Static Files ---
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`Pepper Nursery IoT - Web Dashboard (DKhoa Phase 2 & 3)`);
  console.log(`Local Web Server: http://localhost:${PORT}`);
  console.log(`Target Backend:   ${API_BASE_URL} (TDat)`);
  console.log(`Default Mode:     ${DATA_MODE}`);
  console.log(`====================================================`);
});
