const request = require('supertest');
const express = require('express');
const fs = require('fs').promises;
const path = require('path');

let app;
const TEST_MOCKS_DIR = path.join(__dirname, 'test-mocks');

beforeAll(async () => {
  process.env.PORT = 0;

  app = express();
  app.use(express.json());

  const pathToFilename = (reqPath) => {
    const cleanPath = reqPath.replace(/^\//, '').replace(/\/$/, '');
    const filename = cleanPath.replace(/\//g, '_') || 'index';
    return path.join(TEST_MOCKS_DIR, `${filename}.json`);
  };

  app.all('*', async (req, res) => {
    const filename = pathToFilename(req.path);
    const method = req.method.toUpperCase();

    try {
      if (method === 'GET') {
        try {
          const content = await fs.readFile(filename, 'utf-8');
          const data = JSON.parse(content);
          res.json(data);
        } catch (error) {
          if (error.code === 'ENOENT') {
            const pathParts = req.path.replace(/^\//, '').replace(/\/$/, '').split('/');

            if (pathParts.length > 1) {
              const id = pathParts[pathParts.length - 1];
              const parentPath = pathParts.slice(0, -1).join('/');
              const parentFilename = path.join(TEST_MOCKS_DIR, `${parentPath.replace(/\//g, '_')}.json`);

              try {
                const parentContent = await fs.readFile(parentFilename, 'utf-8');
                const parentData = JSON.parse(parentContent);

                if (Array.isArray(parentData)) {
                  const item = parentData.find(item =>
                    item.id === id || item.id === parseInt(id, 10)
                  );

                  if (item) {
                    res.json(item);
                  } else {
                    res.status(404).end();
                  }
                  return;
                }
              } catch (parentError) {
              }
            }

            if (req.path.endsWith('s') || req.path.endsWith('s/')) {
              res.json([]);
            } else {
              res.status(404).end();
            }
          } else {
            res.status(500).json({ error: 'Server error' });
          }
        }
      } else if (['POST', 'PUT', 'PATCH'].includes(method)) {
        await fs.mkdir(TEST_MOCKS_DIR, { recursive: true });
        await fs.writeFile(filename, JSON.stringify(req.body, null, 2), 'utf-8');
        res.json({ success: true, stored: filename });
      } else {
        res.status(405).json({ error: 'Method not allowed' });
      }
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });
});

afterEach(async () => {
  try {
    await fs.rm(TEST_MOCKS_DIR, { recursive: true, force: true });
  } catch (error) {
  }
});

describe('HTTP Mock Server', () => {
  describe('POST/PUT/PATCH requests', () => {
    it('should store POST data to file', async () => {
      const data = { id: 1, name: 'Test Entity' };
      const response = await request(app)
        .post('/entity')
        .send(data)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.stored).toContain('entity.json');

      const fileContent = await fs.readFile(path.join(TEST_MOCKS_DIR, 'entity.json'), 'utf-8');
      expect(JSON.parse(fileContent)).toEqual(data);
    });

    it('should store PUT data to nested path', async () => {
      const data = { id: 21, name: 'User 21' };
      await request(app)
        .put('/users/21')
        .send(data)
        .expect(200);

      const fileContent = await fs.readFile(path.join(TEST_MOCKS_DIR, 'users_21.json'), 'utf-8');
      expect(JSON.parse(fileContent)).toEqual(data);
    });

    it('should store PATCH data to file', async () => {
      const data = { status: 'updated' };
      await request(app)
        .patch('/entity')
        .send(data)
        .expect(200);

      const fileContent = await fs.readFile(path.join(TEST_MOCKS_DIR, 'entity.json'), 'utf-8');
      expect(JSON.parse(fileContent)).toEqual(data);
    });
  });

  describe('GET requests', () => {
    it('should return existing file content', async () => {
      const data = { id: 1, name: 'Test Entity' };
      await fs.mkdir(TEST_MOCKS_DIR, { recursive: true });
      await fs.writeFile(path.join(TEST_MOCKS_DIR, 'entity.json'), JSON.stringify(data));

      const response = await request(app)
        .get('/entity')
        .expect(200);

      expect(response.body).toEqual(data);
    });

    it('should return 404 with no body for missing non-plural endpoint', async () => {
      const response = await request(app)
        .get('/entity')
        .expect(404);

      expect(response.body).toEqual({});
    });

    it('should return empty array for missing plural endpoint', async () => {
      const response = await request(app)
        .get('/entities')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should find item in parent array by id', async () => {
      const users = [
        { id: 1, name: 'User 1' },
        { id: 21, name: 'User 21' },
        { id: 42, name: 'User 42' }
      ];
      await fs.mkdir(TEST_MOCKS_DIR, { recursive: true });
      await fs.writeFile(path.join(TEST_MOCKS_DIR, 'users.json'), JSON.stringify(users));

      const response = await request(app)
        .get('/users/21')
        .expect(200);

      expect(response.body).toEqual({ id: 21, name: 'User 21' });
    });

    it('should return 404 when id not found in parent array', async () => {
      const users = [
        { id: 1, name: 'User 1' },
        { id: 2, name: 'User 2' }
      ];
      await fs.mkdir(TEST_MOCKS_DIR, { recursive: true });
      await fs.writeFile(path.join(TEST_MOCKS_DIR, 'users.json'), JSON.stringify(users));

      const response = await request(app)
        .get('/users/999')
        .expect(404);

      expect(response.body).toEqual({});
    });

    it('should prefer specific file over parent array lookup', async () => {
      const users = [{ id: 21, name: 'User from array' }];
      const specificUser = { id: 21, name: 'Specific user file' };

      await fs.mkdir(TEST_MOCKS_DIR, { recursive: true });
      await fs.writeFile(path.join(TEST_MOCKS_DIR, 'users.json'), JSON.stringify(users));
      await fs.writeFile(path.join(TEST_MOCKS_DIR, 'users_21.json'), JSON.stringify(specificUser));

      const response = await request(app)
        .get('/users/21')
        .expect(200);

      expect(response.body).toEqual(specificUser);
    });
  });

  describe('Edge cases', () => {
    it('should handle nested paths correctly', async () => {
      const data = { images: ['img1.jpg', 'img2.jpg'] };
      await request(app)
        .post('/entity/images')
        .send(data)
        .expect(200);

      const fileContent = await fs.readFile(path.join(TEST_MOCKS_DIR, 'entity_images.json'), 'utf-8');
      expect(JSON.parse(fileContent)).toEqual(data);
    });

    it('should return 405 for unsupported methods', async () => {
      const response = await request(app)
        .delete('/entity')
        .expect(405);

      expect(response.body.error).toBe('Method not allowed');
    });
  });
});
