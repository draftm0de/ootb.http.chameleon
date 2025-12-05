const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '';
const MOCKS_DIR = path.join(__dirname, 'mocks');

app.use(cors());
app.use(express.json());

async function ensureMocksDir() {
  try {
    await fs.access(MOCKS_DIR);
  } catch {
    await fs.mkdir(MOCKS_DIR, { recursive: true });
  }
}

function pathToFilename(reqPath) {
  const cleanPath = reqPath.replace(/^\//, '').replace(/\/$/, '');
  const filename = cleanPath.replace(/\//g, '_') || 'index';
  return path.join(MOCKS_DIR, `${filename}.json`);
}

app.all('*', async (req, res) => {
  const cleanPath = req.path.replace(/^\//, '');

  if (cleanPath.startsWith('http/') || cleanPath.startsWith('https/')) {
    const targetUrl = cleanPath.replace(/^(https?)\//, '$1://');

    try {
      const headers = { ...req.headers };
      delete headers.host;
      delete headers['content-length'];

      const axiosConfig = {
        method: req.method,
        url: targetUrl,
        headers: headers,
        validateStatus: () => true
      };

      if (['POST', 'PUT', 'PATCH'].includes(req.method.toUpperCase())) {
        axiosConfig.data = req.body;
      }

      const response = await axios(axiosConfig);

      res.status(response.status);
      Object.keys(response.headers).forEach(key => {
        res.setHeader(key, response.headers[key]);
      });
      res.send(response.data);
      return;
    } catch (error) {
      console.error('Proxy error:', error.message);
      res.status(502).json({ error: 'Proxy error', message: error.message });
      return;
    }
  }

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
            const parentFilename = path.join(MOCKS_DIR, `${parentPath.replace(/\//g, '_')}.json`);

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
      await ensureMocksDir();
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

ensureMocksDir().then(() => {
  app.listen(PORT, () => {
    console.log(`🎭 HTTP Chameleon running on port ${PORT}`);
    console.log(`HOST: ${HOST}`);
    console.log(`Mocks directory: ${MOCKS_DIR}`);
  });
});
