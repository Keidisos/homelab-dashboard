import { fetchInsecure } from '@/lib/fetch-ssl';

export async function getQBittorrentAuth(): Promise<{ host: string; cookie: string }> {
  const host = process.env.QBITTORRENT_HOST;
  const username = process.env.QBITTORRENT_USERNAME || 'admin';
  const password = process.env.QBITTORRENT_PASSWORD || '';

  if (!host) {
    throw new Error('qBittorrent configuration missing');
  }

  const loginRes = await fetchInsecure(`${host}/api/v2/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
  });

  if (!loginRes.ok) {
    throw new Error(`qBittorrent login failed: ${loginRes.status}`);
  }

  const cookies = loginRes.headers.get('set-cookie') || '';
  const sidMatch = cookies.match(/SID=([^;]+)/);
  const sid = sidMatch ? sidMatch[1] : '';

  return { host, cookie: sid ? `SID=${sid}` : '' };
}
