const http = require('node:http');
const { performance } = require('node:perf_hooks');
const { URL } = require('node:url');

const { QuoteManager } = require('./quote-manager');

const VERSION = 'v4.1.8';
const HOST = process.env.HOST || '0.0.0.0';
const PORT = Number(process.env.PORT || 8000);
const QUOTES_FILE = process.env.QUOTES_FILE || 'config/teapot_quotes.json';
const LOG_ENABLED = process.env.LOG_ENABLED !== 'false';

function buildDocsText() {
  return [
    `Teapot-as-a-Service ${VERSION}`,
    '',
    'Endpoints:',
    '- GET /teapot (returns random teapot quote, status 418)',
    '- GET /health',
    '- GET / and GET /docs'
  ].join('\n');
}

function createService(options = {}) {
  const quoteManager = options.quoteManager || new QuoteManager(options.quotesFile || QUOTES_FILE);

  function logRequest(method, path, statusCode, startMs) {
    if (!LOG_ENABLED) return;
    const elapsed = (performance.now() - startMs).toFixed(2);
    console.log(`${new Date().toISOString()} method=${method} path=${path} status=${statusCode} duration_ms=${elapsed}`);
  }

  function send(res, statusCode, body, contentType, extraHeaders = {}) {
    const bodyText = typeof body === 'string' ? body : JSON.stringify(body);
    const headers = {
      'Content-Type': contentType,
      'Cache-Control': 'no-store',
      'X-API-Version': VERSION,
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      ...extraHeaders
    };

    res.writeHead(statusCode, headers);
    res.end(bodyText);
  }

  function handleRequest(req, res) {
    const start = performance.now();
    let parsed;
    try {
      // Use a fixed base URL so untrusted Host headers cannot affect parsing.
      parsed = new URL(req.url, 'http://localhost');
    } catch (_err) {
      send(res, 400, 'Bad Request', 'text/plain; charset=utf-8');
      logRequest(req.method, 'INVALID_URL', 400, start);
      return;
    }
    const pathname = parsed.pathname;

    if (pathname === '/health') {
      send(res, 200, { status: 'healthy', version: VERSION }, 'application/json; charset=utf-8');
      logRequest(req.method, pathname, 200, start);
      return;
    }

    if (pathname === '/' || pathname === '/docs') {
      send(res, 200, buildDocsText(), 'text/plain; charset=utf-8');
      logRequest(req.method, pathname, 200, start);
      return;
    }

    if (pathname === '/teapot' && req.method !== 'GET') {
      send(res, 405, 'Method Not Allowed', 'text/plain; charset=utf-8', { Allow: 'GET' });
      logRequest(req.method, pathname, 405, start);
      return;
    }

    if (pathname === '/teapot' && req.method === 'GET') {
      const message = quoteManager.getRandomQuote();
      send(res, 418, message, 'text/plain; charset=utf-8');
      logRequest(req.method, pathname, 418, start);
      return;
    }

    send(res, 404, 'Endpoint not found', 'text/plain; charset=utf-8');
    logRequest(req.method, pathname, 404, start);
  }

  return {
    handleRequest,
    quoteManager,
    createServer() {
      return http.createServer(handleRequest);
    }
  };
}

if (require.main === module) {
  let service;
  try {
    service = createService();
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }

  service.createServer().listen(PORT, HOST, () => {
    console.log(`Teapot service ${VERSION} listening on http://${HOST}:${PORT}`);
  });
}

module.exports = { createService, VERSION, buildDocsText };
