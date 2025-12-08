const request = require('supertest');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

let serverProcess;
let baseURL;
const TEST_PORT = 3001;
const TEST_MOCKS_DIR = path.join(__dirname, 'mocks');

beforeAll(async () => {
  await fs.rm(TEST_MOCKS_DIR, { recursive: true, force: true });

  serverProcess = spawn('node', ['server.js'], {
    env: { ...process.env, PORT: TEST_PORT },
    stdio: 'pipe'
  });

  baseURL = `http://localhost:${TEST_PORT}`;

  // Wait for server to be ready
  const maxAttempts = 30;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await request(baseURL).get('/').timeout(500);
      break;
    } catch (error) {
      if (i === maxAttempts - 1) throw new Error('Server failed to start');
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
}, 30000);

afterAll(async () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  await fs.rm(TEST_MOCKS_DIR, { recursive: true, force: true });
});

describe('HTTP Mock Server - Integration Tests', () => {
  describe('Proxy functionality', () => {
    it('should proxy HTTPS requests', async () => {
      const response = await request(baseURL)
        .get('/https/example.com')
        .expect(200);

      expect(response.text).toContain('Example Domain');
    });

    it('should proxy HTTP requests', async () => {
      const response = await request(baseURL)
        .get('/http/example.com')
        .expect(200);

      expect(response.text).toContain('Example Domain');
    });

    it('should include CORS headers', async () => {
      const response = await request(baseURL)
        .get('/https/example.com')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('*');
    });
  });

  describe('File-based mock functionality', () => {
    it('should store and retrieve mock data', async () => {
      const testData = { id: 1, name: 'Test Entity' };

      await request(baseURL)
        .post('/entity')
        .send(testData)
        .expect(200);

      const response = await request(baseURL)
        .get('/entity')
        .expect(200);

      expect(response.body).toEqual(testData);
    });

    it('should return empty array for missing plural endpoints', async () => {
      const response = await request(baseURL)
        .get('/products')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return 404 for missing singular endpoints', async () => {
      await request(baseURL)
        .get('/product')
        .expect(404);
    });

    it('should find item by ID in array', async () => {
      const users = [
        { id: 1, name: 'User 1' },
        { id: 21, name: 'User 21' },
        { id: 42, name: 'User 42' }
      ];

      await request(baseURL)
        .post('/users')
        .send(users)
        .expect(200);

      const response = await request(baseURL)
        .get('/users/21')
        .expect(200);

      expect(response.body).toEqual({ id: 21, name: 'User 21' });
    });
  });
});
