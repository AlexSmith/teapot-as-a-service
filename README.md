# Teapot-as-a-Service (TaaS) (v4.1.8)

![teapot screenshot](code_teapot.png)


Minimal stateless HTTP API implemented in Node.js.

## Features
- `GET /teapot` returns HTTP `418` with a random teapot quote
- `GET /health` returns `200` with health payload
- `GET /` and `GET /docs` return usage documentation
- Non-GET methods on `/teapot` return `405` with `Allow: GET`
- Unknown routes return `404`

## Requirements
- Node.js `>=22`

## Run
```bash
npm start
```

Optional environment variables:
- `HOST` (default `0.0.0.0`)
- `PORT` (default `8000`)
- `QUOTES_FILE` (default `config/teapot_quotes.json`)
- `LOG_ENABLED` (default `true`)

## Test
```bash
npm test
```

## Docker Compose
```bash
docker compose up
```

## Example calls
```bash
curl -i 'http://localhost:8000/teapot'
curl -i 'http://localhost:8000/health'
curl -i 'http://localhost:8000/docs'
```


Totally Made with Ai.