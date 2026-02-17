const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { QuoteManager } = require('../src/quote-manager');

test('QuoteManager returns one of the configured quotes', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'teapot-'));
  const file = path.join(tmp, 'quotes.json');
  const quotes = ['a', 'b', 'c'];
  fs.writeFileSync(file, JSON.stringify({ quotes }), 'utf8');

  const manager = new QuoteManager(file);
  for (let i = 0; i < 20; i += 1) {
    assert.ok(quotes.includes(manager.getRandomQuote()));
  }
});

test('QuoteManager exposes frozen quote array', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'teapot-'));
  const file = path.join(tmp, 'quotes.json');
  fs.writeFileSync(file, JSON.stringify({ quotes: ['a'] }), 'utf8');

  const manager = new QuoteManager(file);
  assert.equal(Object.isFrozen(manager.quotes), true);
});
