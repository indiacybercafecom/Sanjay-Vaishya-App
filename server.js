// Fallback JS entry point for Hostinger Node.js panels that invoke "node server.js"
// Standard startup remains "npm start" -> "tsx server.ts"
import { register } from 'tsx/esm/api';

register();
await import('./server.ts');
