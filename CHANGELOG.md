# Changelog

## 2025-12-05

### Added

- Initial release of HTTP mock server
- Docker Compose setup with configurable environment variables
- Path-to-filename mapping for JSON responses
- GET request handling with file-based responses
- Automatic fallback to parent array for nested paths (e.g., `/users/21` searches in `users.json`)
- Empty array response for missing plural endpoints (paths ending with 's')
- POST/PUT/PATCH request handling to store JSON bodies to files
- Environment configuration via `.env` file
- MIT License

### Features

- Automatic mock file creation on write operations
- ID-based lookup in array collections
- 404 responses with no body for missing resources
- Volume mounting for persistent mock data
