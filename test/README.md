# Testing Guide

This directory contains tests for the HTTP Chameleon server.

## Prerequisites

**The server must be running before executing integration tests.**

Start the server using one of these methods:

### Docker (recommended)

```bash
docker-compose up --build
```

### Local

```bash
npm install
npm start
```

The server will start on port 3000 by default (configurable via `PORT` in `.env`).

## Running Tests

### Integration Tests (test.sh)

The integration test suite uses bash and curl to test the server's actual HTTP endpoints.

```bash
./test/test.sh
```

The script automatically reads `HOST` and `PORT` from `../.env` if no `BASE_URL` is provided.

**Custom base URL:**

```bash
BASE_URL=http://localhost:8080 ./test/test.sh
```

**What it tests:**

- POST/PUT/PATCH: Creating and updating mock files
- GET: Retrieving mock data, array lookups, 404 handling
- Proxy: HTTP/HTTPS proxying to external services
- File system integration: Verifies data persistence in `mocks/` directory

### Unit Tests (Jest)

Unit tests can run without a live server:

```bash
npm test
```

These tests use Jest and Supertest to test the server logic in isolation.

## Test Coverage

| Test Type   | Files                                          | Coverage                                   |
| ----------- | ---------------------------------------------- | ------------------------------------------ |
| Integration | `test.sh`                                      | End-to-end HTTP flows, proxy functionality |
| Unit        | `server.test.js`, `server.integration.test.js` | Server logic, request handling             |

## Troubleshooting

**Connection refused errors:**

- Ensure the server is running on the expected port
- Check `BASE_URL` matches your server configuration
- Verify no firewall is blocking localhost connections

**Test failures:**

- The integration tests create files in `mocks/` - ensure write permissions
- Some tests depend on previous test data - run the full suite sequentially
- Proxy tests require internet connectivity to reach httpbin.org
