import {
  Asset,
  BASE_FEE,
  Horizon,
  Keypair,
  Operation,
  TimeoutInfinite,
  Transaction,
  TransactionBuilder,
} from '@stellar/stellar-sdk';
import { NETWORK } from './NetworkConfig';

export interface Balance {
  asset: string;
  amount: string;
}

/** Horizon client for the Stellar testnet. */
export class StellarClient {
  private readonly horizon: Horizon.Server;

  constructor(horizonUrl: string = NETWORK.horizonUrl) {
    this.horizon = new Horizon.Server(horizonUrl);
  }

  /** Load the native (XLM) balance for an address, or null if the account does not exist yet. */
  async loadNativeBalance(address: string): Promise<string | null> {
    try {
      const account = await this.horizon.loadAccount(address);
      const native = account.balances.find(
        (b: { asset_type: string; balance: string }) => b.asset_type === 'native',
      );
      return native ? native.balance : null;
    } catch {
      return null;
    }
  }

  /** Load a source account by public key. */
  async loadAccount(address: string): Promise<Horizon.AccountResponse> {
    return this.horizon.loadAccount(address);
  }

  /** Build an unsigned native XLM payment from `source` to `destination`. */
  async buildPayment(
    sourcePublicKey: string,
    destination: string,
    amountXlm: string,
  ): Promise<Transaction> {
    const sourceAccount = await this.horizon.loadAccount(sourcePublicKey);
    return new TransactionBuilder(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK.passphrase,
    })
      .addOperation(
        Operation.payment({
          destination,
          asset: Asset.native(),
          amount: amountXlm,
        }),
      )
      .setTimeout(TimeoutInfinite)
      .build();
  }

  /** Submit a signed transaction and return its on-chain hash. */
  async submit(signedTx: Transaction): Promise<string> {
    const response = await this.horizon.submitTransaction(signedTx);
    return response.hash;
  }

  /** Build a Keypair from a secret key (distributor side only). */
  static fromSecret(secretKey: string): Keypair {
    return Keypair.fromSecret(secretKey);
  }
}
