# Testing Guide

This directory contains tests for the HTTP Chameleon server.

## Running Tests

Tests are written using Vitest and Supertest. The test suite automatically starts and stops the server.

```bash
npm test
```

## What is Tested

- **POST/PUT/PATCH**: Creating and updating mock files
- **GET**: Retrieving mock data, array lookups, 404 handling
- **Proxy**: HTTP/HTTPS proxying to external services
- **File system integration**: Verifies data persistence in the mocks directory

## Test Coverage

| Files             | Coverage                       |
| ----------------- | ------------------------------ |
| `server.test.js`  | Server logic, request handling |

## Troubleshooting

**Test failures:**

- The tests create files in the test mocks directory - ensure write permissions
- Proxy tests require internet connectivity to reach external services
