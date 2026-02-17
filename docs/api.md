# API Reference

## `GET /teapot`
Returns status `418` with a random quote from `config/teapot_quotes.json`.

Response headers:
- `Content-Type: text/plain; charset=utf-8`
- `X-API-Version: v4.1.8`
- `Cache-Control: no-store`

## `GET /health`
Returns:
```json
{"status":"healthy","version":"v4.1.8"}
```

## Method and route behavior
- `/teapot` allows only `GET` (`405` otherwise)
- Unknown routes return `404`
