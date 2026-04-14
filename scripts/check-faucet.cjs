const algosdk = require('algosdk');

const MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon invest';

const account = algosdk.mnemonicToSecretKey(MNEMONIC);
console.log('Faucet account address:', account.addr);
console.log('Public key:', Buffer.from(account.addr.publicKey).toString('hex'));
