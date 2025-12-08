# HTTP Chameleon

![CI](https://github.com/draftmode-io/http-chameleon/workflows/CI/badge.svg)

A versatile HTTP server that adapts to your needs - mock API responses with file-based JSON storage or proxy requests to external services with CORS support.

## Setup

1. Configure environment variables in `.env`:

   ```
   HOST=http://api.dev.draftmode.io
   PORT=3000
   ```

2. Start the server:
   ```bash
   docker-compose up --build
   ```

## Features

- 🎭 **Dual Mode**: File-based mocks OR HTTP/HTTPS proxy
- 📁 **Smart File Mapping**: Automatic path-to-filename conversion
- 🔍 **Array Lookup**: Find items by ID in JSON arrays
- 🌐 **CORS Enabled**: Cross-origin support for all requests
- 🚀 **Zero Config**: Works out of the box with sensible defaults

## How It Works

### HTTP/HTTPS Proxy Mode

Prefix paths with `/http/` or `/https/` to proxy requests to external services:

```bash
curl http://localhost:3000/https/api.example.com/users
# Proxies to: https://api.example.com/users
# Returns response with CORS headers
```

### File-Based Mock Mode

### Path to File Mapping

Request paths are converted to filenames in the `mocks/` directory:

- `/entity` → `mocks/entity.json`
- `/entity/images` → `mocks/entity_images.json`
- `/users/123/profile` → `mocks/users_123_profile.json`

### GET Requests

- **File exists**: Returns the JSON content
- **File missing & nested path (e.g., `/users/21`)**:
  - Tries parent file (e.g., `mocks/users.json`)
  - If parent is an array, searches for item with matching `id`
  - Returns the item or 404 if not found
- **File missing & path ends with 's'**: Returns empty array `[]`
- **File missing & path doesn't end with 's'**: Returns 404 (no body)

Example:

```bash
curl http://localhost:3000/entity
# Returns content of mocks/entity.json or 404

curl http://localhost:3000/users
# Returns content of mocks/users.json or []

curl http://localhost:3000/users/21
# 1. Tries mocks/users_21.json
# 2. Falls back to mocks/users.json, searches for {id: 21}
# 3. Returns the item or 404
```

### POST/PUT/PATCH Requests

Stores the request body into the corresponding JSON file.

Example:

```bash
curl -X POST http://localhost:3000/entity \
  -H "Content-Type: application/json" \
  -d '{"id": 1, "name": "Test"}'
# Saves to mocks/entity.json
```

## File Structure

```
.
├── docker-compose.yml
├── Dockerfile
├── .env
├── server.js
├── package.json
└── mocks/
    └── .gitkeep
```

## Development

### Running Tests

Unit tests:

```bash
npm install
npm test
```

Integration tests (requires server running):

```bash
./test/test.sh
```

### Running Locally (without Docker)

```bash
npm install
npm start
```

## Stopping the Server

```bash
docker-compose down
```
