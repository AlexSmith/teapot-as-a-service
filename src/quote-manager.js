const fs = require('node:fs');
const path = require('node:path');

class QuoteManager {
  constructor(quotesFile) {
    this.quotes = this.loadQuotes(quotesFile);
  }

  loadQuotes(quotesFile) {
    const resolved = path.resolve(quotesFile || 'config/teapot_quotes.json');
    let parsed;
    try {
      parsed = JSON.parse(fs.readFileSync(resolved, 'utf8'));
    } catch (err) {
      throw new Error(`Failed to load quotes file '${resolved}': ${err.message}`);
    }

    if (!parsed || !Array.isArray(parsed.quotes) || parsed.quotes.length === 0) {
      throw new Error("Quotes file must contain a non-empty 'quotes' array");
    }

    if (!parsed.quotes.every((q) => typeof q === 'string' && q.trim().length > 0)) {
      throw new Error('All quotes must be non-empty strings');
    }

    return Object.freeze([...parsed.quotes]);
  }

  getRandomQuote() {
    const index = Math.floor(Math.random() * this.quotes.length);
    return this.quotes[index];
  }
}

module.exports = { QuoteManager };
