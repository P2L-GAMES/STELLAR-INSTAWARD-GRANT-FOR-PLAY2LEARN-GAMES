import { NETWORK } from './NetworkConfig';

/**
 * Testnet distributor account that funds player payouts.
 *
 * SECURITY: this secret key ships in the client bundle and is extractable via
 * devtools. That is acceptable ONLY for a testnet-only demonstration with no
 * real value at stake. It MUST never be reused for mainnet — assertTestnet()
 * rejects any non-testnet passphrase at runtime.
 *
 * The account below is unfunded. Fund it via Friendbot before payouts work:
 *   https://friendbot.stellar.org/?addr=GD2OXQ4SBJYWGNPSMEXUVYOC43AQEOPXMTPQR4FXIK44K2GWTUDB4QJQ
 * or from the CLI:
 *   curl "https://friendbot.stellar.org/?addr=GD2OXQ4SBJYWGNPSMEXUVYOC43AQEOPXMTPQR4FXIK44K2GWTUDB4QJQ"
 */
export const DISTRIBUTOR = {
  publicKey: 'GD2OXQ4SBJYWGNPSMEXUVYOC43AQEOPXMTPQR4FXIK44K2GWTUDB4QJQ',
  /** Testnet-only secret key. Fund via Friendbot before enabling payouts. */
  secretKey: 'SCTZGSPP7PWOKRHIBQ7UWCPWLA3CSVDAGAG4LAQ3CP62HWT5H3ITKE4K',
} as const;

/** Hard guard: refuse to operate on any non-testnet network passphrase. */
export function assertTestnet(passphrase: string): void {
  if (passphrase !== NETWORK.passphrase) {
    throw new Error(
      'Stellar payouts are restricted to testnet. Mainnet payouts are disabled.',
    );
  }
}
