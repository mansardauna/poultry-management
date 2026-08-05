import { proxy } from './proxy';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  return proxy(request);
}

export { config } from './proxy';
