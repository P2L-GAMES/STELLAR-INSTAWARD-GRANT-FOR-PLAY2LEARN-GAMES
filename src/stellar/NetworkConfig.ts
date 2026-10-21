/** Stellar network configuration. Play2Learn runs exclusively on testnet. */
export const NETWORK = {
  /** SDF testnet passphrase. Must match Networks.TESTNET exactly or tx_bad_auth occurs. */
  passphrase: 'Test SDF Network ; September 2015',
  horizonUrl: 'https://horizon-testnet.stellar.org',
  explorerUrl: 'https://stellar.expert/explorer/testnet',
  friendbotUrl: 'https://friendbot.stellar.org',
} as const;

export const isTestnet = (passphrase: string): boolean =>
  passphrase === NETWORK.passphrase;
