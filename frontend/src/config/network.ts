/**
 * NEX PLAY - Centralized Network Configuration
 *
 * Exposes API_URL and WS_URL for HTTP requests and Realtime WebSocket communication.
 * Environment-driven: Supports localhost development and temporary ngrok tunnels (wss://).
 * No hardcoded ngrok or host-specific domains.
 */

const rawApiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
const rawWsUrl = (import.meta.env.VITE_WS_URL as string | undefined)?.trim();

export const API_URL: string = rawApiUrl || 'http://localhost:4000';

function resolveWsUrl(): string {
  if (rawWsUrl) {
    let url = rawWsUrl.replace(/\/+$/, '');
    // If protocol was mistakenly specified as http(s), convert to ws(s)
    if (url.startsWith('https://')) {
      url = 'wss://' + url.slice('https://'.length);
    } else if (url.startsWith('http://')) {
      url = 'ws://' + url.slice('http://'.length);
    }
    // Ensure path ends with /ws
    if (!url.endsWith('/ws')) {
      url = `${url}/ws`;
    }
    return url;
  }

  // Fallback when no VITE_WS_URL is provided in environment
  if (typeof window !== 'undefined') {
    const isSecure = window.location.protocol === 'https:';
    const proto = isSecure ? 'wss:' : 'ws:';
    // If running on localhost or 127.0.0.1, connect to backend port 4000
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return `${proto}//localhost:4000/ws`;
    }
    // Default fallback to current host
    return `${proto}//${window.location.host}/ws`;
  }

  return 'ws://localhost:4000/ws';
}

export const WS_URL: string = resolveWsUrl();
