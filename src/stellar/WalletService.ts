import { isConnected, requestAccess } from '@stellar/freighter-api';
import type { TWalletConnectModuleParams } from '@creit.tech/stellar-wallets-kit/modules/wallet-connect';

/** Result of connecting a wallet. */
export interface WalletConnection {
  publicKey: string;
}

/** Abstraction over a browser wallet so the app never depends on a wallet SDK directly. */
export interface WalletService {
  /** Whether this browser has any way to connect a wallet. */
  isAvailable(): Promise<boolean>;
  /** Request access and return the connected public key. */
  connect(): Promise<WalletConnection>;
  /** Recover an existing session without prompting, or null when there is none. */
  restore(waitMs?: number): Promise<string | null>;
  /** Nudge the wallet layer after the page returns from a wallet app. */
  resume(): Promise<void>;
  /** Close any wallet UI that could still cover the page. */
  dismiss(): Promise<void>;
  /** End the wallet session, when the wallet supports it. */
  disconnect(): Promise<void>;
}

/** Freighter extension implementation of WalletService. */
export class FreighterWallet implements WalletService {
  async isAvailable(): Promise<boolean> {
    const injected = window as unknown as { freighter?: unknown; freighterApi?: unknown };
    if (injected.freighter !== undefined || injected.freighterApi !== undefined) {
      return true;
    }

    // Freighter Mobile is not an extension, so there is no content script to
    // probe. Go straight to WalletConnect instead of waiting on a timeout.
    if (/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)) return false;

    // Current Freighter builds do not set a window flag. The extension answers
    // the API's connection-status request whenever it is installed; if it is
    // missing the request times out and resolves false.
    try {
      const result = await isConnected();
      return result.isConnected === true;
    } catch {
      return false;
    }
  }

  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    let timer: ReturnType<typeof setTimeout>;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('Wallet connect timed out')), ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
  }

  async connect(): Promise<WalletConnection> {
    const result = await this.withTimeout(requestAccess(), 10000);
    if (result.error) {
      throw new Error(result.error?.message ?? 'Freighter connection failed');
    }
    if (!result.address) {
      throw new Error('Freighter returned no public key');
    }
    return { publicKey: result.address };
  }

  async disconnect(): Promise<void> {
    // The extension has no session to end; the app just forgets the address.
  }

  async resume(): Promise<void> {
    // Nothing to resume for the injected extension.
  }

  async dismiss(): Promise<void> {
    // The extension does not draw anything over the page.
  }

  async restore(): Promise<string | null> {
    // Reading the extension address on startup can prompt for access, so the
    // persisted player address is the source of truth across reloads.
    return null;
  }
}

export interface WalletConnectOptions {
  readonly projectId: string;
  readonly appName: string;
  readonly appUrl: string;
  readonly appIcon: string;
}

/**
 * Mobile / WalletConnect implementation. Loaded lazily so the extension path
 * stays small: the WalletConnect dependency graph is only fetched when the user
 * actually connects without the Freighter extension.
 *
 * The official Freighter mobile integration is WalletConnect v2. Loading a page
 * inside the Freighter mobile app does not expose the extension API, so this is
 * the only way to connect there.
 */
export class WalletConnectWallet implements WalletService {
  private kitPromise: Promise<typeof import('@creit.tech/stellar-wallets-kit/sdk')['StellarWalletsKit']> | null =
    null;
  private moduleInstance:
    | import('@creit.tech/stellar-wallets-kit/modules/wallet-connect').WalletConnectModule
    | null = null;

  constructor(private readonly options: WalletConnectOptions) {}

  async isAvailable(): Promise<boolean> {
    return this.options.projectId.trim().length > 0;
  }

  private kit(): Promise<typeof import('@creit.tech/stellar-wallets-kit/sdk')['StellarWalletsKit']> {
    this.kitPromise ??= this.initKit().catch((error: unknown) => {
      // A transient relay/network failure must not poison every later attempt.
      this.kitPromise = null;
      throw error;
    });
    return this.kitPromise;
  }

  private async initKit(): Promise<typeof import('@creit.tech/stellar-wallets-kit/sdk')['StellarWalletsKit']> {
    const [
      { StellarWalletsKit },
      { WalletConnectModule, WalletConnectTargetChain },
      { Networks, SwkAppDarkTheme },
    ] = await Promise.all([
      import('@creit.tech/stellar-wallets-kit/sdk'),
      import('@creit.tech/stellar-wallets-kit/modules/wallet-connect'),
      import('@creit.tech/stellar-wallets-kit/types'),
    ]);

    const module = new WalletConnectModule({
      projectId: this.options.projectId,
      allowedChains: [WalletConnectTargetChain.TESTNET],
      metadata: {
        name: this.options.appName,
        description: 'Learn Stellar by playing short quiz rounds.',
        url: this.options.appUrl,
        icons: [this.options.appIcon],
      },
      // Only show Stellar wallets (Freighter, LOBSTR, Scopuly). Without this the
      // generic WalletConnect list is dominated by EVM wallets that cannot sign
      // a Stellar transaction.
      appKitOptions: {
        allWallets: 'HIDE',
        includeWalletIds: [
          '997a355c8f682468706a76cff1b004a7115f505fb962dac54b6e9b442dd1c380', // Freighter
          '76a3d548a08cf402f5c7d021f24fd2881d767084b387a5325df88bc3d4b6f21b', // LOBSTR
          '9c78aee7d8a771255942334d06d2cbab89e2178ee49fee4ea3b6c78032fcac76', // Scopuly
        ],
      } as unknown as NonNullable<TWalletConnectModuleParams['appKitOptions']>,
    });

    StellarWalletsKit.init({
      modules: [module],
      network: Networks.TESTNET,
      theme: SwkAppDarkTheme,
      authModal: { showInstallLabel: false, hideUnsupportedWallets: true },
    });

    // The module starts its WalletConnect client asynchronously in the
    // constructor. The auth modal hides wallets that are not ready yet, so wait
    // for the client before opening it.
    await this.waitUntilReady(module, 15000);
    this.moduleInstance = module;
    return StellarWalletsKit;
  }

  private async waitUntilReady(
    module: { isAvailable(): Promise<boolean> },
    timeoutMs: number,
  ): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if (await module.isAvailable()) return;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    throw new Error('WalletConnect did not start. Check the Project ID and network connection.');
  }

  async connect(): Promise<WalletConnection> {
    const kit = await this.kit();
    const { address } = await kit.authModal();
    if (!address) {
      throw new Error('Wallet returned no public key');
    }
    return { publicKey: address };
  }

  async restore(waitMs = 0): Promise<string | null> {
    if (!this.options.projectId.trim()) return null;
    // A session that already settled is persisted by WalletConnect. Reading it
    // directly avoids waiting for a client that may not have reloaded it into
    // memory yet (the common case after a wallet-app redirect).
    const stored = this.storedSessionAddress();
    if (stored) return stored;
    try {
      await this.kit();
      // After a mobile redirect the relay may still be settling the session,
      // so allow a short grace period for it to land in the client store.
      const deadline = Date.now() + Math.max(0, waitMs);
      for (;;) {
        const address =
          this.sessionAddress(await this.moduleInstance?.getSessions()) ??
          this.storedSessionAddress();
        if (address) return address;
        if (Date.now() >= deadline) return null;
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } catch {
      // No usable session (expired, cleared, or offline).
      return null;
    }
  }

  /**
   * Called when the page becomes visible again after the wallet app. The
   * WalletConnect socket is often dead after a long background pause, so
   * restart it and dismiss the connection overlays. Hiding the modal is what
   * lets the lobby (and its cards) show through while the session settles.
   */
  async resume(): Promise<void> {
    const module = this.moduleInstance;
    if (!module) return;
    await this.dismiss();
    try {
      const client = module.signClient as unknown as {
        core?: { relayer?: { restartTransport?: () => Promise<void> } };
      };
      // Force a fresh subscription so a session approved while the tab was
      // backgrounded is fetched from the relay.
      void client.core?.relayer?.restartTransport?.().catch(() => {});
    } catch {
      // Older kit versions do not expose the relayer; the poll still runs.
    }
  }

  async dismiss(): Promise<void> {
    const module = this.moduleInstance;
    if (!module) return;
    try {
      module.modal?.close();
    } catch {
      // The AppKit modal may already be closed.
    }
    try {
      const { closeEvent } = await import('@creit.tech/stellar-wallets-kit/state');
      // Rejects the pending auth modal promise and removes the kit's overlay.
      closeEvent.next();
    } catch {
      // State module is optional; the AppKit close above still helps.
    }
  }

  /** Session addresses persisted by WalletConnect, independent of the client. */
  private storedSessionAddress(): string | null {
    try {
      const now = Math.floor(Date.now() / 1000);
      for (let index = 0; index < window.localStorage.length; index += 1) {
        const key = window.localStorage.key(index);
        if (!key || !/^wc@2:[^/]+\/\/session$/.test(key)) continue;
        const raw = window.localStorage.getItem(key);
        if (!raw) continue;
        const sessions = JSON.parse(raw) as Array<{
          expiry?: number;
          namespaces?: Record<string, { accounts?: string[] }>;
        }>;
        if (!Array.isArray(sessions)) continue;
        const address = this.sessionAddress(
          sessions.filter((session) => !session.expiry || session.expiry > now),
        );
        if (address) return address;
      }
    } catch {
      // Malformed or unavailable storage; fall back to the live client.
    }
    return null;
  }

  private sessionAddress(
    sessions:
      | Array<{ namespaces?: Record<string, { accounts?: string[] }> }>
      | undefined,
  ): string | null {
    for (const session of sessions ?? []) {
      const accounts = session.namespaces?.['stellar']?.accounts ?? [];
      for (const account of accounts) {
        const [namespace, chain, address] = account.split(':');
        if (namespace === 'stellar' && chain === 'testnet' && address) {
          return address;
        }
      }
    }
    return null;
  }

  async disconnect(): Promise<void> {
    try {
      await this.kit();
      await this.moduleInstance?.disconnect();
    } catch {
      // The session may already be gone or the relay unreachable; local state
      // still has to be cleared by the caller.
    }
  }
}

export type WalletMethod = 'freighter' | 'walletconnect';

const WALLET_METHOD_KEY = 'p2l:wallet-method';

function readWalletMethod(): WalletMethod | null {
  try {
    const value = window.localStorage.getItem(WALLET_METHOD_KEY);
    return value === 'freighter' || value === 'walletconnect' ? value : null;
  } catch {
    return null;
  }
}

function writeWalletMethod(method: WalletMethod | null): void {
  try {
    if (method) {
      window.localStorage.setItem(WALLET_METHOD_KEY, method);
    } else {
      window.localStorage.removeItem(WALLET_METHOD_KEY);
    }
  } catch {
    // Storage can be unavailable in private mode; the session still works.
  }
}

export interface WalletRouterOptions {
  readonly walletConnectProjectId?: string | undefined;
  readonly appName: string;
  readonly appUrl: string;
  readonly appIcon: string;
}

/**
 * Picks the best available wallet path: the Freighter extension on desktop,
 * WalletConnect on mobile (and as a desktop fallback when the extension is not
 * installed).
 */
export class WalletRouter implements WalletService {
  private readonly freighter = new FreighterWallet();
  private readonly walletConnect: WalletConnectWallet | null;
  private lastMethod: WalletMethod | null = readWalletMethod();
  private freighterDetected = false;

  constructor(options: WalletRouterOptions) {
    const projectId = options.walletConnectProjectId?.trim();
    this.walletConnect = projectId
      ? new WalletConnectWallet({
          projectId,
          appName: options.appName,
          appUrl: options.appUrl,
          appIcon: options.appIcon,
        })
      : null;
  }

  async isAvailable(): Promise<boolean> {
    if (this.walletConnect) return true;
    this.freighterDetected = await this.freighter.isAvailable();
    return this.freighterDetected;
  }

  private setMethod(method: WalletMethod | null): void {
    this.lastMethod = method;
    writeWalletMethod(method);
  }

  async connect(): Promise<WalletConnection> {
    if (this.freighterDetected || (await this.freighter.isAvailable())) {
      this.freighterDetected = true;
      this.setMethod('freighter');
      return this.freighter.connect();
    }
    if (this.walletConnect) {
      this.setMethod('walletconnect');
      return this.walletConnect.connect();
    }
    throw new Error('No wallet available in this browser');
  }

  async restore(waitMs = 0): Promise<string | null> {
    // Desktop page loads stay on the extension path; the persisted player
    // address covers them. Mobile redirects back from the wallet app, so the
    // WalletConnect session has to be recovered explicitly.
    if (!this.walletConnect || !isMobileDevice()) return null;
    const address = await this.walletConnect.restore(waitMs);
    if (address) {
      this.setMethod('walletconnect');
      this.freighterDetected = false;
    }
    return address;
  }

  async resume(): Promise<void> {
    if (this.walletConnect && isMobileDevice()) {
      await this.walletConnect.resume();
    }
  }

  async dismiss(): Promise<void> {
    if (this.walletConnect) await this.walletConnect.dismiss();
  }

  async disconnect(): Promise<void> {
    // Clear the persisted method first so a reload during the async close does
    // not try to resume a session the user already ended.
    const method = this.lastMethod;
    this.setMethod(null);
    if (this.walletConnect && method === 'walletconnect') {
      await this.walletConnect.disconnect();
    }
  }
}

/** True when the current device is likely a phone or tablet. */
export const isMobileDevice = (): boolean => {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return false;
  if (/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)) return true;
  return window.matchMedia?.('(pointer: coarse)').matches ?? false;
};
