import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Hostinger automatically sets the PORT environment variable
const port = process.env.PORT || 3000;

const distPath = path.join(__dirname, 'dist');

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    distExists: fs.existsSync(distPath)
  });
});

// Serve static files from the 'dist' directory
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
} else {
  console.error('Error: dist directory not found. Please run "npm run build" first.');
}

// Handle SPA routing: return index.html for all requests
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Application not built. Please run "npm run build" and restart the server.');
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
});
