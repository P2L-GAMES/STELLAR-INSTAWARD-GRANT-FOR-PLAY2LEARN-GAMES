import { Keypair } from '@stellar/stellar-sdk';
import { StellarClient } from './StellarClient';
import { DISTRIBUTOR, assertTestnet } from './distributor.config';
import { NETWORK } from './NetworkConfig';

/** Result of a payout. */
export interface Payout {
  txHash: string;
  destination: string;
  amountXlm: string;
  explorerUrl: string;
}

/** Pays quiz earnings from the distributor account to a player wallet on testnet. */
export class PayoutService {
  private readonly distributorKeypair: Keypair;

  constructor(
    private readonly stellar: StellarClient,
    distributorSecretKey: string = DISTRIBUTOR.secretKey,
  ) {
    assertTestnet(NETWORK.passphrase);
    this.distributorKeypair = StellarClient.fromSecret(distributorSecretKey);
  }

  /**
   * Send `amountXlm` XLM from the distributor to `destination`.
   * Returns the on-chain transaction hash and explorer link.
   * Throws if the distributor account is unfunded or the transaction fails.
   */
  async payout(destination: string, amountXlm: string): Promise<Payout> {
    const tx = await this.stellar.buildPayment(
      DISTRIBUTOR.publicKey,
      destination,
      amountXlm,
    );

    tx.sign(this.distributorKeypair);
    const txHash = await this.stellar.submit(tx);

    return {
      txHash,
      destination,
      amountXlm,
      explorerUrl: `${NETWORK.explorerUrl}/tx/${txHash}`,
    };
  }
}
