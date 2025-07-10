import express from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());

// Helper to get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dynamically import and mount all route files
const routeFiles = fs.readdirSync(__dirname)
  .filter(
    file => file.endsWith('.js') &&
      file !== 'index.js' &&
      file !== '_db.js' &&
      !file.startsWith('_')
  );

for (const file of routeFiles) {
  const routeModule = await import(`./${file}`);
  const routeName = file.replace('.js', '');
  const router = express.Router();
  
  // Create routes for GET and POST methods
  router.get('/', async (req, res) => {
    req.method = 'GET';
    await routeModule.default(req, res);
  });
  
  router.post('/', async (req, res) => {
    req.method = 'POST';
    await routeModule.default(req, res);
  });
  // Add RESTful support for /:id for all methods
  router.all('/:id', async (req, res) => {
    // If id is not in body, set it from params
    if (!req.body || !req.body.id) {
      req.body = { ...req.body, id: req.params.id };
    }
    await routeModule.default(req, res);
  });
  
  // Mount at /api/<routeName>, e.g. /api/sales
  app.use(`/api/${routeName}`, router);
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
}); 