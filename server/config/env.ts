import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import dotenv from 'dotenv';

dotenv.config();

const ROOT_DIR = process.cwd();
const configuredStorage = process.env.STORAGE_DIR?.trim();
export const STORAGE_DIR = configuredStorage ? path.resolve(ROOT_DIR, configuredStorage) : path.join(ROOT_DIR, 'storage');
export const UPLOADS_DIR = path.join(STORAGE_DIR, 'uploads');
export const DB_PATH = path.join(STORAGE_DIR, 'platform.db');

if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
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
  PORT: Number(process.env.PORT || 3000),
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
