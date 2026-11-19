import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const APP_ROOT = path.resolve(__dirname, '../..');

// Load .env from the application root first (Hostinger/LiteSpeed may start with a different cwd)
dotenv.config({ path: path.join(APP_ROOT, '.env') });
dotenv.config();

const configuredStorage = process.env.STORAGE_DIR?.trim();
export const STORAGE_DIR = configuredStorage ? path.resolve(APP_ROOT, configuredStorage) : path.join(APP_ROOT, 'storage');
export const UPLOADS_DIR = path.join(STORAGE_DIR, 'uploads');
export const DB_PATH = path.join(STORAGE_DIR, 'platform.db');

if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function resolvePort(): number | string {
  const raw = (process.env.PORT || '').trim();
  if (!raw) return 3000;
  if (/^\d+$/.test(raw)) {
    const parsed = Number(raw);
    if (Number.isInteger(parsed) && parsed > 0 && parsed <= 65535) {
      return parsed;
    }
  }
  // Preserve non-numeric socket / named pipe paths injected by some Node.js hosting runners
  return raw;
}

function resolveSessionSecret(): string {
  const configured = process.env.SESSION_SECRET?.trim();
  if (configured && configured.length >= 16) {
    return configured;
  }
  const secretFile = path.join(STORAGE_DIR, '.session-secret');
  if (fs.existsSync(secretFile)) {
    const existing = fs.readFileSync(secretFile, 'utf8').trim();
    if (existing.length >= 32) return existing;
  }
  const generated = crypto.randomBytes(32).toString('hex');
  fs.writeFileSync(secretFile, generated, { mode: 0o600 });
  return generated;
}

export const ENV = {
  PORT: resolvePort(),
  IS_DEV: process.env.NODE_ENV === 'development',
  APP_URL: (process.env.APP_URL || 'http://localhost:3000').trim(),
  SESSION_SECRET: resolveSessionSecret(),
  FIREBASE_PROJECT_ID: (process.env.FIREBASE_PROJECT_ID || 'sanjay-vaishya-app').trim(),
  FIREBASE_DATABASE_URL: (
    process.env.FIREBASE_DATABASE_URL || 'https://sanjay-vaishya-app-default-rtdb.firebaseio.com'
  ).trim(),
  FIREBASE_SERVICE_ACCOUNT_JSON: (process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '').trim(),
  RAZORPAY_KEY_ID: (process.env.RAZORPAY_KEY_ID || '').trim(),
  RAZORPAY_KEY_SECRET: (process.env.RAZORPAY_KEY_SECRET || '').trim(),
  RAZORPAY_WEBHOOK_SECRET: (process.env.RAZORPAY_WEBHOOK_SECRET || '').trim(),
};

export function isRazorpayConfigured(): boolean {
  return Boolean(ENV.RAZORPAY_KEY_ID && ENV.RAZORPAY_KEY_SECRET && ENV.RAZORPAY_WEBHOOK_SECRET);
}
