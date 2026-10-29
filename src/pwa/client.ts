interface InstallPrompt extends Event { prompt(): Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }
export class AppInstall extends EventTarget {
  online = navigator.onLine;
  offlineReady = false;
  updateAvailable = false;
  installed = window.matchMedia('(display-mode: standalone)').matches || !!(navigator as Navigator & { standalone?: boolean }).standalone;
  private deferred: InstallPrompt | null = null;
  private registration: ServiceWorkerRegistration | null = null;
  constructor() {
    super();
    window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); this.deferred = event as InstallPrompt; this.changed(); });
    window.addEventListener('appinstalled', () => { this.installed = true; this.deferred = null; this.changed(); });
    window.addEventListener('online', () => { this.online = true; this.changed(); });
    window.addEventListener('offline', () => { this.online = false; this.changed(); });
    if (import.meta.env.PROD && 'serviceWorker' in navigator) void this.register();
  }
  private async register() {
    try {
      const root = new URL(import.meta.env.BASE_URL, document.baseURI);
      const r = this.registration = await navigator.serviceWorker.register(new URL('sw.js', root), { scope: root.pathname });
      const waiting = () => { if (r.waiting && navigator.serviceWorker.controller) this.updateAvailable = true; this.changed(); };
      waiting();
      r.addEventListener('updatefound', () => {
        const worker = r.installing;
        worker?.addEventListener('statechange', () => {
          if (worker.state !== 'installed') return;
          if (navigator.serviceWorker.controller) this.updateAvailable = true;
          else this.offlineReady = true;
          this.changed();
        });
      });
      await navigator.serviceWorker.ready; this.offlineReady = true; this.changed();
      document.addEventListener('visibilitychange', () => { if (!document.hidden && navigator.onLine) void r.update().catch(() => {}); });
    } catch { this.offlineReady = !!navigator.serviceWorker.controller; this.changed(); }
  }
  get canPrompt() { return !!this.deferred; }
  get platform() { return /iPad|iPhone|iPod/.test(navigator.userAgent) || navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1 ? 'ios' : 'other'; }
  async install() {
    if (!this.deferred) return false;
    const prompt = this.deferred; this.deferred = null;
    await prompt.prompt(); const choice = await prompt.userChoice;
    if (choice.outcome === 'accepted') this.installed = true;
    this.changed(); return choice.outcome === 'accepted';
  }
  async update() {
    if (!this.updateAvailable) return;
    const worker = this.registration?.waiting;
    if (!worker) { window.location.reload(); return; }
    // Only the player's explicit action arms a reload. No timer can interrupt a dish.
    navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), { once: true });
    worker.postMessage({ type: 'SKIP_WAITING' });
  }
  private changed() { this.dispatchEvent(new Event('change')); }
}
export const appInstall = new AppInstall();
