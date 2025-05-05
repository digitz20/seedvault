
const mongoose = require('mongoose');

// Define allowed wallet types - ensure this matches frontend definitions (expanded & alphabetized)
const WalletTypes = [
  '1inch Wallet', // Mobile DeFi aggregator
  'Action Wallet', // Action Coin focus
  'Aktionariat Portfolio', // Tokenized equity focus
  'Algorand Wallet (Pera Algo Wallet)', // Official Algorand mobile
  'AlphaWallet', // Ethereum Mobile
  'Ambire Wallet', // Smart contract wallet
  'Apex Wallet', // Avalanche focus
  'Argent Wallet', // Smart Contract Wallet (Ethereum L2 focus)
  'Argent X', // StarkNet focus
  'Arculus Wallet', // Hardware card wallet
  'Armory', // Bitcoin desktop, advanced features
  'Atomic Wallet',
  'Aurum Wallet', // BSC focus
  'Authenticator (Generic)', // 2FA Apps sometimes used for keys
  'AVAX Wallet (Deprecated - use Core)', // Older Avalanche web wallet
  'Bifrost Wallet', // Polkadot/Kusama ecosystem
  'Binance Wallet (custodial)',
  'BitBox02', // Hardware wallet
  'BitGo Wallet', // Institutional/Multisig focus
  'BitKeep (now Bitget Wallet)', // Multi-chain mobile/extension
  'BitPay Wallet', // Bitcoin/Payment focus
  'Bitski', // Web3 login/wallet
  'BlockFi Wallet (Defunct)', // Custodial (historical)
  'Blockstream Jade', // Bitcoin hardware
  'BlockWallet', // Privacy-focused extension
  'Blocto Wallet', // Flow blockchain focus
  'BlueWallet', // Bitcoin specific
  'Brave Wallet', // Integrated into Brave Browser
  'BRD Wallet (Breadwallet)', // Acquired by Coinbase
  'Braavos', // StarkNet focus
  'Brain Wallet (Not Recommended)',
  'Cake Wallet', // Monero & Bitcoin focus
  'Celo Wallet (Valora)', // Celo mobile focus
  'Celsius Wallet (Defunct)', // Custodial (historical)
  'Citadel.one', // Staking/DeFi platform wallet
  'Clover Wallet (now CLV Wallet)', // Polkadot/Multi-chain
  'Coin98 Wallet', // Multi-chain DeFi focus
  'Coinbase (custodial)',
  'Coinbase Wallet',
  'Coinomi',
  'Coldcard Mk4', // Bitcoin specific hardware
  'CoolWallet Pro', // Hardware card wallet
  'CoolWallet S', // Hardware card wallet
  'Core Wallet (Avalanche)', // Avalanche official wallet
  'Cosmostation Wallet', // Cosmos ecosystem focus
  'Crypto.com App (custodial)',
  'Crypto.com DeFi Wallet', // Non-custodial part
  'Cypherock X1', // Hardware wallet system
  'Daedalus Wallet', // Cardano desktop (full node)
  'Dapper Wallet', // Flow blockchain focus (custodial)
  'DCENT Wallet', // Hardware wallet
  'Desktop Wallet (Generic)',
  'Edge Wallet',
  'Electrum', // Bitcoin desktop
  'Ellipal Titan', // Air-gapped hardware wallet
  'Ellipal Titan Mini', // Air-gapped hardware wallet
  'Enjin Wallet', // NFT focus
  'Enkrypt', // Polkadot/Multichain extension (by MEW)
  'Eternl Wallet', // Cardano browser extension/mobile
  'Exodus',
  'Exodus Desktop',
  'Exodus Mobile',
  'Exodus Web3 Wallet',
  'Feather Wallet', // Monero desktop
  'Fio Protocol Wallet (Anchor)', // FIO address focus
  'Fireblocks', // Institutional custody/wallet platform
  'Flint Wallet', // Cardano light wallet
  'Foundation Passport', // Bitcoin hardware
  'Frame', // Desktop multi-chain OS integration
  'Freename Wallet', // Web3 TLD/Identity focus
  'Freewallet', // Mobile/Web multi-coin (custodial history)
  'Fuse Cash', // Fuse network focus
  'GameStop Wallet (Discontinued)', // NFT/L2 focus (historical)
  'GeroWallet', // Cardano DeFi focus
  'Glow', // Solana mobile/extension
  'Gnosis Safe (now Safe{Wallet})', // Multisig focus
  'Green Wallet (Blockstream Green)', // Bitcoin specific
  'GridPlus Lattice1', // Hardware wallet/signing device
  'Guarda Wallet', // Multi-chain desktop/mobile/web
  'Hana Wallet', // Multi-chain extension
  'Hardware Wallet (Generic)',
  'HashPack', // Hedera Hashgraph focus
  'Huobi Wallet (now iToken Wallet)', // Multi-chain
  'Hydra Wallet', // Cardano focus
  'Iancu Wallet', // Mobile focus
  'imToken', // Ethereum/Multi-chain mobile
  'Infinity Wallet', // Desktop DeFi focus
  'Jaxx Liberty', // Multi-chain desktop/mobile
  'Kalamint Wallet (Discontinued)', // Tezos NFT (historical)
  'KeepKey', // Hardware wallet
  'Keplr Wallet', // Cosmos ecosystem focus
  'Keystone Pro (formerly Cobo Vault)', // Air-gapped hardware
  'Kraken Wallet (custodial)',
  'Kukai Wallet', // Tezos browser extension/mobile
  'Ledger Nano S', // Hardware wallet
  'Ledger Nano S Plus', // Hardware wallet
  'Ledger Nano X', // Hardware wallet
  'Ledger Stax', // Hardware wallet
  'Leap Wallet', // Cosmos ecosystem focus
  'Liquality Wallet', // Multi-chain extension/atomic swaps
  'Lobstr Wallet', // Stellar focus
  'Loopring Wallet', // Smart Contract Wallet (Ethereum L2 focus)
  'Maiar Wallet (now xPortal)', // MultiversX (Elrond) focus
  'Mariana Wallet', // Privacy focus
  'MathWallet', // Multi-chain extension/mobile/web
  'MEWconnect (Deprecated)', // Older MEW mobile connection
  'Metamask',
  'MetaMask Extension',
  'MetaMask Mobile',
  'Minke Wallet', // Mobile DeFi focus
  'Mobile Wallet (Generic)',
  'Monero GUI Wallet', // Monero desktop
  'Multisig Wallet (Generic)',
  'MyAlgo Wallet (Discontinued)', // Algorand web wallet (historical)
  'Mycelium Wallet', // Bitcoin mobile
  'MyCrypto', // Ethereum web/desktop interface
  'MyEtherWallet (MEW)', // Ethereum web/mobile interface
  'Nami Wallet', // Cardano browser extension
  'Nash Wallet', // Non-custodial exchange/wallet
  'Nautilus Wallet', // Ergo blockchain focus
  'Nexo Wallet (custodial)', // Lending platform wallet
  'Ngrave Zero', // Air-gapped hardware
  'Nufi Wallet', // Cardano/Multi-chain staking focus
  'Nunchuk', // Bitcoin collaborative custody
  'OKX Wallet', // Exchange-linked Web3 wallet
  'OneKey Wallet', // Hardware/Software multi-chain
  'Onto Wallet', // Ontology/Multi-chain
  'Other', // Catch-all category
  'Ownbit', // Multi-chain mobile/hardware
  'Paper Wallet', // Physical paper storage
  'Petra Wallet', // Aptos focus
  'Phantom', // Solana focus
  'Pillar Wallet', // Smart contract wallet
  'PolkaWallet', // Polkadot mobile
  'Polkadot{.js}', // Polkadot/Kusama browser extension/interface
  'Pontem Wallet', // Aptos/Move ecosystem focus
  'Pool.pm Wallet', // Cardano NFT/staking focus
  'PrivateKey (Not Recommended)', // Direct private key storage
  'Proton Wallet', // Proton Chain focus
  'Rabby Wallet', // EVM browser extension
  'Rainbow Wallet', // Ethereum mobile/NFT focus
  'Ronin Wallet', // Axie Infinity/Ronin chain
  'SafePal S1', // Hardware wallet
  'Safe{Wallet} (formerly Gnosis Safe)', // Multisig focus
  'Samourai Wallet', // Bitcoin privacy focus
  'Satowallet (Discontinued)', // Multi-coin (historical)
  'SecuX Wallet', // Hardware wallet
  'SeedSigner', // DIY Bitcoin Hardware Wallet
  'Sequence Wallet', // Web3/Gaming focus
  'Slope Wallet (Compromised)', // Solana (historical - security issue)
  'Software Wallet (Generic)',
  'Solana CLI Wallet', // Command-line interface
  'Solflare', // Solana browser extension/mobile
  'Solfarm (Discontinued)', // Solana yield farming (historical)
  'Sollet.io (Deprecated)', // Older Solana web wallet
  'Spot Wallet', // Mobile multi-chain
  'Sparrow Wallet', // Bitcoin desktop, advanced features
  'Specter Desktop', // Bitcoin hardware wallet interface/multisig
  'StakedWallet.io (Discontinued)', // Staking focus (historical)
  'Stargazer Wallet', // Stellar focus
  'Station Wallet (Terra)', // Terra ecosystem focus (use with caution)
  'Steakwallet (now Omnity)', // Liquid staking focus
  'SubWallet', // Polkadot/Kusama browser extension/mobile
  'Swype Wallet', // Mobile focus
  'Talisman', // Polkadot/Kusama browser extension
  'Tangem Wallet', // Hardware card wallet
  'Temple Wallet', // Tezos browser extension/mobile
  'Terra Station', // Terra ecosystem focus (use with caution)
  'TokenPocket', // Multi-chain mobile/extension
  'Tokenary', // Apple ecosystem focus
  'Torus Wallet', // Social login Web3 wallet
  'Trezor Model One', // Hardware wallet
  'Trezor Model T', // Hardware wallet
  'Trezor Safe 3', // Hardware wallet
  'TronLink', // Tron browser extension/mobile
  'Trust Wallet',
  'Trust Wallet Extension',
  'Trust Wallet Mobile',
  ' Guarda Wallet', // Typo fixed, already present
  'Uphold Wallet (custodial)', // Exchange/Platform wallet
  'Urbit Wallet', // Urbit OS integration
  'Valora (Celo Wallet)', // Celo mobile focus
  'Viper Wallet', // Harmony One focus
  'Voyager Wallet (Defunct)', // Custodial (historical)
  'Wallet.io', // Web wallet
  'WalletConnect (Protocol)', // Protocol, not a specific wallet
  'Wasabi Wallet', // Bitcoin privacy desktop
  'Web Wallet (Generic)',
  'XDEFI Wallet', // Multi-chain browser extension
  'Xaman (formerly Xumm)', // XRP Ledger focus
  'xPortal (formerly Maiar)', // MultiversX (Elrond) focus
  'Yoroi Wallet', // Cardano browser extension/mobile
  'Zapper Wallet', // DeFi dashboard/wallet
  'Zelcore', // Multi-asset desktop/mobile
  'ZenGo Wallet', // Keyless mobile wallet
  'Zerion Wallet', // DeFi/NFT mobile/extension
  'Zulu Wallet' // Bitcoin/Lightning focus
];


// Seed Phrase Schema (No User Link)
const SeedPhraseSchema = new mongoose.Schema({
   /* Removed userId field
   userId: {
       type: mongoose.Schema.Types.ObjectId,
       ref: 'User', // Reference to the User model
       required: true, // Each seed phrase must belong to a user
       index: true, // Index for faster lookups by user
   },
   */
  encryptedEmail: {
    type: String,
    required: false, // Optional email
    default: '', // Ensure default is empty string if not provided
  },
  encryptedEmailPassword: {
      type: String,
      required: false, // Optional password
      default: '', // Ensure default is empty string
  },
  walletName: {
    type: String,
    required: [true, 'Wallet name/label is required.'],
    trim: true,
    maxlength: [50, 'Wallet name cannot exceed 50 characters.']
  },
  encryptedSeedPhrase: {
    type: String,
    required: [true, 'Encrypted seed phrase is required.'],
     // Add validation if needed, e.g., ensure it's not empty after potential encryption placeholder removal
     validate: {
         validator: function(v) { return v && v.length > 0 && v !== 'ENCRYPTED()'; }, // Basic check
         message: 'Encrypted seed phrase appears invalid.'
     }
  },
  walletType: {
    type: String,
    required: [true, 'Wallet type is required.'],
    enum: {
      values: WalletTypes, // Use the updated list
      message: 'Invalid wallet type selected.'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Optional: Remove index on userId if it existed
// SeedPhraseSchema.index({ userId: 1, createdAt: -1 }); // Removed

const SeedPhrase = mongoose.model('SeedPhrase', SeedPhraseSchema);

module.exports = SeedPhrase;
