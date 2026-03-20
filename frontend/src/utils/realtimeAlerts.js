export function connectRealtimeAlerts(onMessage) {
  try {
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api';
    const wsUrl = apiBase
      .replace(/^http/i, 'ws')
      .replace(/\/api\/?$/, '')
      .replace(/\/$/, '') + '/ws/alerts';

    const ws = new WebSocket(wsUrl);
    ws.onmessage = (event) => {
      if (typeof onMessage === 'function') {
        onMessage(event.data);
      }
    };
    return ws;
  } catch (err) {
    console.warn('WebSocket setup failed:', err);
    return null;
  }
}
