const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { createService, VERSION } = require('../src/server');

function invoke(service, method, url) {
  const req = {
    method,
    url,
    headers: { host: 'localhost' }
  };

  return new Promise((resolve) => {
    const res = {
      statusCode: 200,
      headers: {},
      body: '',
      writeHead(statusCode, headers) {
        this.statusCode = statusCode;
        this.headers = headers;
      },
      end(body) {
        this.body = body;
        resolve({
          status: this.statusCode,
          headers: this.headers,
          body: this.body
        });
      }
    };

    service.handleRequest(req, res);
  });
}

test('GET /teapot returns 418 plain text quote', async () => {
  const service = createService();
  const res = await invoke(service, 'GET', '/teapot');
  assert.equal(res.status, 418);
  assert.match(res.headers['Content-Type'], /^text\/plain/);
  assert.equal(res.headers['X-Content-Type-Options'], 'nosniff');
  assert.ok(String(res.body).length > 0);
});

test('GET /teapot ignores query customization and still returns plain text quote', async () => {
  const service = createService();
  const res = await invoke(service, 'GET', '/teapot?format=json&message=custom');
  assert.equal(res.status, 418);
  assert.match(res.headers['Content-Type'], /^text\/plain/);
  assert.notEqual(res.body, 'custom');
});

test('GET /health returns healthy payload quickly', async () => {
  const service = createService();
  const start = performance.now();
  const res = await invoke(service, 'GET', '/health');
  const duration = performance.now() - start;
  assert.equal(res.status, 200);
  assert.deepEqual(JSON.parse(res.body), { status: 'healthy', version: VERSION });
  assert.ok(duration < 100);
});

test('Non-GET /teapot methods return 405 with Allow: GET', async () => {
  const service = createService();
  for (const method of ['POST', 'PUT', 'DELETE', 'PATCH']) {
    const res = await invoke(service, method, '/teapot');
    assert.equal(res.status, 405);
    assert.equal(res.headers.Allow, 'GET');
  }
});

test('Unknown endpoints return 404', async () => {
  const service = createService();
  const res = await invoke(service, 'GET', '/missing');
  assert.equal(res.status, 404);
});

test('Malformed URL returns 400 instead of crashing request handling', async () => {
  const service = createService();
  const res = await invoke(service, 'GET', 'http://[invalid');
  assert.equal(res.status, 400);
});

test('Quote list is immutable after startup even if config changes on disk', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'teapot-'));
  const file = path.join(tmp, 'quotes.json');

  fs.writeFileSync(file, JSON.stringify({ quotes: ['a', 'b'] }), 'utf8');
  const service = createService({ quotesFile: file });
  const first = service.quoteManager.getRandomQuote();
  assert.ok(['a', 'b'].includes(first));

  fs.writeFileSync(file, JSON.stringify({ quotes: ['x', 'y'] }), 'utf8');
  const second = service.quoteManager.getRandomQuote();
  assert.ok(['a', 'b'].includes(second));
});

test('Invalid config throws startup error', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'teapot-'));
  const missing = path.join(tmp, 'missing.json');

  assert.throws(() => createService({ quotesFile: missing }), /Failed to load quotes file/);
});
