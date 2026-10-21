import {
  getAddress,
  isConnected,
  requestAccess,
} from '@stellar/freighter-api';

/** Result of connecting a wallet. */
export interface WalletConnection {
  publicKey: string;
}

/** Abstraction over a browser wallet extension so the app never depends on Freighter directly. */
export interface WalletService {
  /** Whether the wallet extension is installed in this browser. */
  isInstalled(): Promise<boolean>;
  /** Whether a wallet is currently connected / unlocked. */
  isConnected(): Promise<boolean>;
  /** Request access and return the connected public key. */
  connect(): Promise<WalletConnection>;
  /** Return the currently connected public key, or null. */
  getPublicKey(): Promise<string | null>;
}

/** Freighter extension implementation of WalletService. */
export class FreighterWallet implements WalletService {
  async isInstalled(): Promise<boolean> {
    try {
      const result = await isConnected();
      return result.isConnected !== undefined && result.error === undefined;
    } catch {
      return false;
    }
  }

  async isConnected(): Promise<boolean> {
    try {
      const result = await isConnected();
      return result.isConnected === true;
    } catch {
      return false;
    }
  }

  async connect(): Promise<WalletConnection> {
    const result = await requestAccess();
    if (result.error) {
      throw new Error(result.error?.message ?? 'Freighter connection failed');
    }
    if (!result.address) {
      throw new Error('Freighter returned no public key');
    }
    return { publicKey: result.address };
  }

  async getPublicKey(): Promise<string | null> {
    try {
      const result = await getAddress();
      if (result.error || !result.address) return null;
      return result.address;
    } catch {
      return null;
    }
  }
}
