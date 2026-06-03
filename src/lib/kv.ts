import { Redis } from '@upstash/redis';

// Vercel KV / Upstash inject either KV_REST_API_* or UPSTASH_REDIS_REST_* env vars.
const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

export const kvConfigured = Boolean(url && token);
export const redis = kvConfigured ? new Redis({ url: url as string, token: token as string }) : null;
