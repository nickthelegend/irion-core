const algosdk = require('algosdk');
const { AlgorandClient } = require('@algorandfoundation/algokit-utils');

const TARGET_ADDRESS = 'LEGENDMQQJJWSQVHRFK36EP7GTM3MTI3VD3GN25YMKJ6MEBR35J4SBNVD4';
const DISPENSER_MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon invest';

async function fundAccount() {
  try {
    // Use AlgoKit utils which handles this better
    const algorand = AlgorandClient.defaultLocalNet();
    
    // Get dispenser account from mnemonic
    const dispenserAccount = algosdk.mnemonicToSecretKey(DISPENSER_MNEMONIC);
    const dispenserAddr = typeof dispenserAccount.addr === 'string' ? dispenserAccount.addr : algosdk.encodeAddress(dispenserAccount.addr.publicKey);
    
    console.log('Dispenser address:', dispenserAddr);
    console.log('Target address:', TARGET_ADDRESS);
    
    // Set the dispenser as the signer
    algorand.setSigner(dispenserAddr, async (txnGroup, indexesToSign) => {
      return txnGroup.map((txn, i) => {
        if (indexesToSign.includes(i)) {
          return txn.signTxn(dispenserAccount.sk);
        }
        return null;
      });
    });
    
    // Send payment using AlgoKit utils
    const result = await algorand.send.payment({
      sender: dispenserAddr,
      receiver: TARGET_ADDRESS,
      amount: BigInt(10_000_000), // 10 ALGO in microAlgos
    });
    
    console.log('Funding transaction sent:', result.transaction.txID());
    
    // Wait for confirmation
    await result.confirmation;
    
    // Check balance
    const accountInfo = await algorand.client.algod.accountInformation(TARGET_ADDRESS).do();
    console.log('Account funded! New balance:', accountInfo.amount / 1_000_000, 'ALGO');
  } catch (error) {
    console.error('Error funding account:', error);
    console.error('Error stack:', error.stack);
  }
}

fundAccount();
