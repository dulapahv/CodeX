import { kv } from '@vercel/kv';

export async function get(key: string): Promise<string> {
  if (!key) throw new Error('Key is required');

  return await kv.get(key);
}

export async function set(key: string, value: string): Promise<void> {
  if (!key) throw new Error('Key is required');
  if (!value) throw new Error('Value is required');

  await kv.set(key, value);
}

export async function del(key: string): Promise<void> {
  if (!key) throw new Error('Key is required');

  await kv.del(key);
}
