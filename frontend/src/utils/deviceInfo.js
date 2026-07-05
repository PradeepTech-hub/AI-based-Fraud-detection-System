// A stable per-browser identifier so the backend's "new device" fraud check
// (FraudDetectionService.isNewDevice) actually has something to compare
// against. Persisted in localStorage so the same browser is recognized as
// the same device across transactions.
const STORAGE_KEY = 'fraudguard_device_id';

export function getDeviceId() {
  try {
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = `web-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    return 'web-unknown';
  }
}

export function getDeviceType() {
  const ua = navigator.userAgent || '';
  if (/android/i.test(ua)) return 'Android';
  if (/iphone|ipad|ipod/i.test(ua)) return 'iOS';
  if (/windows/i.test(ua)) return 'Windows';
  if (/macintosh|mac os/i.test(ua)) return 'macOS';
  if (/linux/i.test(ua)) return 'Linux';
  return 'Web';
}
