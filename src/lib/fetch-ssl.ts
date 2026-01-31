// Utility for making fetch requests to services with self-signed certificates
// This is needed for homelab services that use HTTPS with self-signed certs

import { Agent, fetch as undiciFetch } from 'undici';

// Create an agent that ignores certificate errors
// IMPORTANT: Only use this for trusted internal services!
const insecureAgent = new Agent({
  connect: {
    rejectUnauthorized: false,
  },
});

interface FetchOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
}

/**
 * Fetch wrapper that handles self-signed certificates for internal services
 * Uses undici under the hood for proper SSL handling
 */
export async function fetchInsecure(url: string, options: FetchOptions = {}): Promise<Response> {
  const { timeout = 15000, ...fetchOptions } = options;

  const response = await undiciFetch(url, {
    ...fetchOptions,
    dispatcher: insecureAgent,
    signal: AbortSignal.timeout(timeout),
  });

  return response as unknown as Response;
}

/**
 * Parse error messages for better user feedback
 */
export function parseApiError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes('DEPTH_ZERO_SELF_SIGNED_CERT')) {
      return 'SSL Certificate error - self-signed certificate rejected';
    }
    if (error.message.includes('ECONNREFUSED')) {
      return 'Connection refused - service may be offline';
    }
    if (error.message.includes('ETIMEDOUT') || error.message.includes('ConnectTimeoutError')) {
      return 'Connection timeout - service unreachable';
    }
    if (error.message.includes('ENOTFOUND')) {
      return 'Host not found - check the URL';
    }
    return error.message;
  }
  return 'Unknown error occurred';
}
