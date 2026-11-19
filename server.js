// Node.js entry point for Hostinger Express / Node.js hosting ("node server.js" or require('./server.js'))
// Standard startup also supports "npm start" -> "tsx server.ts"
// IMPORTANT: Keep this module free of top-level await so Node 22 require(esm)
// loaders (e.g., Hostinger LiteSpeed lsnode / Passenger) do not throw ERR_REQUIRE_ASYNC_MODULE.
import { register } from 'tsx/esm/api';

register();

import('./server.ts').catch((err) => {
  console.error('[FATAL] Failed to start server.ts:', err);
  process.exit(1);
});
